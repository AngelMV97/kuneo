/**
 * TESSERACT OCR UTILITIES
 * Text extraction from images and scanned PDFs
 * Reused and adapted from Aula Nativa server/utils/ocrUtils.js
 */

const fs = require('fs').promises;
const path = require('path');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const pdfPoppler = require('pdf-poppler');
const os = require('os');

/**
 * Extract text from image using OCR
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {Object} options - OCR options
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromImage(imageBuffer, options = {}) {
  const {
    language = 'spa+eng', // Spanish + English
    optimizeImage = true
  } = options;

  try {
    let processedBuffer = imageBuffer;

    // Optimize image for better OCR results
    if (optimizeImage) {
      processedBuffer = await sharp(imageBuffer)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .greyscale()
        .normalize()
        .png()
        .toBuffer();
    }

    // Perform OCR
    const result = await Tesseract.recognize(processedBuffer, language, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`  OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    return result.data.text || '';
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error(`OCR failed: ${error.message}`);
  }
}

/**
 * Extract text from PDF using OCR (for scanned/image-based PDFs)
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} fileName - Original file name
 * @param {Object} options - OCR options
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromPDF(pdfBuffer, fileName = 'document.pdf', options = {}) {
  const {
    language = 'spa+eng',
    maxPages = null,
    verbose = true
  } = options;

  const tempDir = path.join(
    os.tmpdir(),
    `kuneo-ocr-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  await fs.mkdir(tempDir, { recursive: true });

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const tempPdfPath = path.join(tempDir, sanitizedFileName);

  try {
    // Save PDF to temp file
    await fs.writeFile(tempPdfPath, pdfBuffer);

    // Convert PDF pages to PNG images
    const convertOpts = {
      format: 'png',
      out_dir: tempDir,
      out_prefix: 'page',
      page: maxPages ? `1-${maxPages}` : null
    };

    await pdfPoppler.convert(tempPdfPath, convertOpts);

    // Get generated image files
    const files = await fs.readdir(tempDir);
    const imageFiles = files
      .filter(f => f.startsWith('page') && f.endsWith('.png'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });

    if (imageFiles.length === 0) {
      throw new Error('No images generated from PDF');
    }

    if (verbose) {
      console.log(`✓ Converted PDF to ${imageFiles.length} images`);
    }

    // Process each page with OCR
    let allText = '';
    for (let i = 0; i < imageFiles.length; i++) {
      const imagePath = path.join(tempDir, imageFiles[i]);

      // Optimize image
      const optimizedBuffer = await sharp(imagePath)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .greyscale()
        .normalize()
        .png()
        .toBuffer();

      // OCR
      const result = await Tesseract.recognize(optimizedBuffer, language, {
        logger: (m) => {
          if (verbose && m.status === 'recognizing text') {
            if (i === 0 || i === imageFiles.length - 1) {
              console.log(`  OCR page ${i + 1}/${imageFiles.length}: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      });

      allText += result.data.text + '\n\n';

      // Progress logging
      if (verbose && ((i + 1) % 5 === 0 || i === imageFiles.length - 1)) {
        console.log(`✓ OCR processed ${i + 1}/${imageFiles.length} pages`);
      }
    }

    if (verbose) {
      console.log(`✓ OCR extracted ${allText.length} chars from ${imageFiles.length} pages`);
    }

    return allText;
  } catch (error) {
    console.error('PDF OCR failed:', error);
    throw new Error(`PDF OCR failed: ${error.message}`);
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.warn('Failed to cleanup temp OCR files:', err.message);
    }
  }
}

/**
 * Detect if text extraction is sufficient (heuristic)
 * @param {string} text - Extracted text
 * @param {number} pageCount - Number of pages
 * @returns {boolean} Is extraction sufficient
 */
function isTextExtractionSufficient(text, pageCount = 1) {
  if (!text || text.trim().length === 0) {
    return false;
  }

  // Heuristic: expect at least 100 characters per page on average
  const avgCharsPerPage = text.length / pageCount;
  const hasMinimumContent = avgCharsPerPage >= 100;

  // Check for meaningful content (not just symbols/numbers)
  const wordCount = text.split(/\s+/).filter(w => w.length > 2).length;
  const hasWords = wordCount >= pageCount * 20; // ~20 words per page minimum

  return hasMinimumContent && hasWords;
}

/**
 * Clean OCR text (remove artifacts, fix spacing)
 * @param {string} text - Raw OCR text
 * @returns {string} Cleaned text
 */
function cleanOCRText(text) {
  let cleaned = text;

  // Remove excessive whitespace
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // Normalize line breaks
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Remove common OCR artifacts
  cleaned = cleaned.replace(/[�]/g, ''); // Replacement character
  cleaned = cleaned.replace(/\f/g, ''); // Form feed

  // Fix common OCR mistakes in Spanish
  cleaned = cleaned.replace(/\bl\b/g, 'I'); // Lowercase L -> I
  cleaned = cleaned.replace(/\b0\b/g, 'O'); // Zero -> O

  return cleaned.trim();
}

module.exports = {
  extractTextFromImage,
  extractTextFromPDF,
  isTextExtractionSufficient,
  cleanOCRText
};
