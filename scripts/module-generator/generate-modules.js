const fs = require("fs");
const path = require("path");
const { buildModuleFromCompetencyUnit } = require("./module-generator");

const INPUT_FILE = path.resolve(
  __dirname,
  "../../data/processed/normalized/competency_units/all_competency_units.json"
);

const OUTPUT_DIR = path.resolve(
  __dirname,
  "../../data/processed/modules"
);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function normalizeFileName(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function generateAllModules() {
  ensureDir(OUTPUT_DIR);

  console.log("============================================================");
  console.log("🏗️  MODULE GENERATOR");
  console.log("============================================================");
  console.log(`\n📂 Leyendo: ${INPUT_FILE}`);

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Archivo no encontrado: ${INPUT_FILE}`);
    console.error(`   Asegúrate de ejecutar primero el normalizador universal.`);
    process.exit(1);
  }

  const units = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));
  console.log(`✅ ${units.length} competency_units cargadas\n`);

  const modules = [];
  let successCount = 0;
  let errorCount = 0;

  console.log("🔄 Generando módulos...\n");

  for (const unit of units) {
    try {
      const module = buildModuleFromCompetencyUnit(unit);
      modules.push(module);
      successCount++;
      
      if (successCount % 100 === 0) {
        console.log(`   ✓ ${successCount} módulos generados...`);
      }
    } catch (err) {
      errorCount++;
      console.error(`   ❌ Error en unit ${unit.id}: ${err.message}`);
    }
  }

  console.log(`\n✅ ${successCount} módulos generados exitosamente`);
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} errores encontrados`);
  }

  // Guardar todos los módulos en un solo archivo
  const allPath = path.join(OUTPUT_DIR, "all_modules.json");
  fs.writeFileSync(allPath, JSON.stringify(modules, null, 2), "utf-8");
  console.log(`\n💾 Guardado: ${allPath}`);

  // Agrupar por materia
  const grouped = groupBySubject(modules);

  console.log(`\n📚 Organizando por materia y grado...`);

  for (const [subject, subjectModules] of Object.entries(grouped)) {
    const subjectDir = path.join(OUTPUT_DIR, subject);
    ensureDir(subjectDir);

    const byGrade = groupByGrade(subjectModules);

    for (const [grade, gradeModules] of Object.entries(byGrade)) {
      const fileName = `${normalizeFileName(grade)}.json`;
      fs.writeFileSync(
        path.join(subjectDir, fileName),
        JSON.stringify(gradeModules, null, 2),
        "utf-8"
      );
    }

    console.log(`   ✓ ${subject}: ${subjectModules.length} módulos`);
  }

  // Estadísticas
  console.log("\n============================================================");
  console.log("📊 ESTADÍSTICAS");
  console.log("============================================================");
  
  console.log("\n📚 Por materia:");
  for (const [subject, subjectModules] of Object.entries(grouped)) {
    console.log(`   ${subject.padEnd(20)} → ${subjectModules.length.toString().padStart(4)} módulos`);
  }

  console.log("\n🎓 Por grado (todas las materias):");
  const byGradeAll = groupByGrade(modules);
  for (const [grade, gradeModules] of Object.entries(byGradeAll)) {
    console.log(`   ${grade.padEnd(10)} → ${gradeModules.length.toString().padStart(4)} módulos`);
  }

  console.log("\n============================================================");
  console.log("✅ GENERACIÓN COMPLETADA");
  console.log("============================================================");
  console.log(`\n📁 Archivos generados en: ${OUTPUT_DIR}`);
  console.log(`\nPróximos pasos:`);
  console.log(`   1. Revisar módulos generados`);
  console.log(`   2. Enriquecer con OpenAI (opcional)`);
  console.log(`   3. Cargar a Supabase: kuneo.modules`);
}

function groupBySubject(modules) {
  return modules.reduce((acc, m) => {
    acc[m.subject] ||= [];
    acc[m.subject].push(m);
    return acc;
  }, {});
}

function groupByGrade(modules) {
  return modules.reduce((acc, m) => {
    acc[m.grade_range] ||= [];
    acc[m.grade_range].push(m);
    return acc;
  }, {});
}

generateAllModules();
