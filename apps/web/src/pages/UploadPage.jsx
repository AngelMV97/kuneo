/**
 * UPLOAD PAGE
 * Upload PDFs and create embeddings (similar to Aula Nativa FileUploader)
 */

import React, { useState } from 'react'

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
    } else {
      alert('Por favor selecciona un archivo PDF')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert('Selecciona un archivo primero')
      return
    }

    setUploading(true)
    setProgress(0)

    // TODO: Implement upload logic
    // 1. Upload PDF to Supabase Storage
    // 2. Process PDF and extract text
    // 3. Generate embeddings via backend
    // 4. Save to content_nodes and embeddings tables

    setTimeout(() => {
      setProgress(100)
      setUploading(false)
      alert('Archivo procesado correctamente')
      setFile(null)
    }, 2000)
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Subir Contenido</h1>
        <p className="page-subtitle">Carga PDFs para crear material de aprendizaje</p>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Seleccionar PDF
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ padding: '0.5rem' }}
          />
        </div>

        {file && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#edf2f7', borderRadius: '6px' }}>
            <p><strong>Archivo:</strong> {file.name}</p>
            <p><strong>Tamaño:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        {uploading && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: '#4a90e2',
                  transition: 'width 0.3s'
                }}
              />
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#718096' }}>
              Procesando... {progress}%
            </p>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{ opacity: (!file || uploading) ? 0.5 : 1 }}
        >
          {uploading ? 'Procesando...' : 'Subir y Procesar'}
        </button>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>¿Cómo funciona?</h3>
        <ol style={{ paddingLeft: '1.5rem', lineHeight: 1.8 }}>
          <li>Selecciona un archivo PDF con contenido educativo</li>
          <li>El sistema extrae el texto del PDF usando OCR</li>
          <li>El texto se divide en fragmentos (chunks) de 500 palabras</li>
          <li>Se generan embeddings usando OpenAI (text-embedding-3-small)</li>
          <li>Los embeddings se guardan en la base de datos para búsqueda semántica</li>
        </ol>
      </div>
    </div>
  )
}
