# Parsers de Referentes Curriculares

Sistema de procesamiento completo para los referentes curriculares del Ministerio de Educación Nacional de Colombia:
- **DBAs** (Derechos Básicos de Aprendizaje)
- **Estándares** (Estándares Básicos de Competencias)

## 📋 Estructura de Datos

### Input - Archivos Limpios
```
data/processed/
├── parsed/
│   ├── dba/
│   │   ├── matematicas/
│   │   │   ├── 1.json
│   │   │   ├── 2.json
│   │   │   └── ...
│   │   ├── ciencias/
│   │   └── ...
│   └── standards/
│       ├── matematicas/
│       │   ├── 1-3.json
│       │   ├── 4-5.json
│       │   └── ...
│       ├── ciencias/
│       └── ...
└── normalized/competency_units/
    ├── dba/
    │   ├── matematicas/
    │   ├── ciencias/
    │   └── ...
    ├── standards/
    │   ├── matematicas/
    │   ├── ciencias/
    │   └── ...
    └── all_competency_units.json    # ⭐ Consolidado (DBAs + Estándares)
```

---

## 🔄 Pipeline DBA

Procesa Derechos Básicos de Aprendizaje (un DBA completo → 1 competency unit)
├── ciencias/dba_grades/
├── lenguaje/dba_grades/
├── sociales/dba_grades/
└── ingles/dba_grades/
```

### Output
```
data/processed/
├── parsed/dba/
│   ├── matematicas/
│   │   ├── 1.json
│   │   ├── 2.json
│   │   └── ...
│   ├── ciencias/
│   └── ...
└── normalized/competency_units/
    ├── dba/
    │   ├── matematicas/
    │   ├── ciencias/
    │   └── ...
    └── all_competency_units.json
```

## 🔄 Pipeline

### Paso 1: Parsing
Convierte archivos TXT limpios en JSON estructurado.

**Entrada**: `data/clean/dba/{subject}/dba_grades/{grade}.txt`

**Formato de entrada**:
```
DBA: 1
SUBJECT: matematicas
GRADE: 4

ENUNCIADO:
Interpreta las fracciones como razón...

EVIDENCES:
- Describe situaciones en las cuales...
- Reconoce situaciones...

EXAMPLE:
[TIPO: texto]
Las limonadas de don Diego...

[TIPO: imagen]
descripcion: receta para preparar...

[TIPO: pregunta]
- Tratando de imitar la receta...
```

**Salida**: `data/processed/parsed/dba/{subject}/{grade}.json`

**Estructura de salida**:
```json
[
  {
    "id": "uuid",
    "type": "competency_unit",
    "source": "dba",
    "dba_number": 1,
    "subject": "mathematics",
    "grade_range": "4",
    "content": {
      "competency": "...",
      "evidence": [...],
      "examples": [
        {
          "type": "texto",
          "content": "..."
        },
        {
          "type": "imagen",
          "content": {"description": "..."}
        },
        {
          "type": "pregunta",
          "content": ["...", "..."]
        }
      ],
      "concepts": [...],
      "misconceptions": [...]
    },
    "metadata": {
      "is_english": false,
      "example_count": 3,
      "evidence_count": 2
    }
  }
]
```

### Paso 2: Normalización
Enriquece los competency units con análisis cognitivo.

**Entrada**: `data/processed/parsed/dba/{subject}/{grade}.json`

**Salida**: `data/processed/normalized/competency_units/dba/{subject}/{grade}.json`

**Estructura normalizada**:
```json
{
  "id": "uuid",
  "type": "competency_unit",
  "source": "dba",
  "source_id": "dba_1",
  
  "curriculum": {
    "subject": "mathematics",
    "grade_range": "4",
    "dba_number": 1
  },
  
  "content": {
    "competency": "...",
    "evidence": [...],
    "examples": [...],
    "concepts": [...],
    "misconceptions": [...]
  },
  
  "cognitive_analysis": {
    "dimensions": {
      "comprension": 0.5,
      "representacion": 0.3,
      "razonamiento": 0.7,
      "transferencia": 0.4,
      "metacognicion": 0.2
    },
    "primary_dimension": "razonamiento",
    "complexity_level": 3,
    "keywords": ["fraccion", "razon", "operador"]
  },
  
  "embedding_metadata": {
    "text_for_embedding": "...",
    "chunk_size": 45,
    "requires_chunking": false
  },
  
  "processing": {
    "parsed_at": "2026-05-11T...",
    "parser_version": "1.0",
    "is_english": false
  }
}
```

## 🚀 Uso

### Ejecutar pipeline completo
```bash
python scripts/parsers/run_dba_pipeline.py
```

### Ejecutar solo parsing
```bash
python scripts/parsers/run_dba_pipeline.py parse
```

### Ejecutar solo normalización
```bash
python scripts/parsers/run_dba_pipeline.py normalize
```

### Ejecutar scripts individuales
```bash
# Solo parser
python scripts/parsers/dba_parser.py

# Solo normalizer
python scripts/parsers/dba_normalizer.py
```

## 📊 Tipos de Contenido en EXAMPLE

### Materias comunes (matemáticas, ciencias, lenguaje, sociales)
- **texto**: Texto descriptivo o narrativo
- **imagen**: Descripción de una imagen con `descripcion:`
- **pregunta**: Lista de preguntas (bullets con -)
- **lista**: Items con a), b), c) o bullets
- **tabla**: Descripción de tabla

### Inglés (estructura especial)
Usa **SKILL** en lugar de **EVIDENCES**

Skills: Escucha, Lectura, Conversacion, Escritura, Monologo

Tipos adicionales de contenido:
- **conversacion**: Diálogos con formato A:, B:, C:
- **monologo**: Texto directo hablado

## 🧠 Dimensiones Cognitivas

El normalizador identifica 5 dimensiones cognitivas:

1. **Comprensión**: Entender conceptos, definiciones, propiedades
2. **Representación**: Múltiples formas de representar (visual, simbólico, verbal)
3. **Razonamiento**: Análisis, inferencia, argumentación
4. **Transferencia**: Aplicar conocimiento en nuevos contextos
5. **Metacognición**: Reflexión sobre el propio proceso de aprendizaje

## 🎯 Características Clave

### Parser
- ✅ Detección automática de bloques DBA
- ✅ Extracción de múltiples tipos de contenido
- ✅ Manejo especial para inglés (SKILL vs EVIDENCES)
- ✅ Identificación de conceptos clave
- ✅ Generación de misconceptions comunes

### Normalizer
- ✅ Análisis de dimensiones cognitivas
- ✅ Cálculo de nivel de complejidad (1-5)
- ✅ Extracción de keywords para búsqueda
- ✅ Preparación de texto para embeddings
- ✅ Metadata completa para cada unidad

## 📁 Archivos Generados

### Pipeline DBA
1. **Archivos parseados**: `data/processed/parsed/dba/{subject}/{grade}.json`
2. **Archivos normalizados**: `data/processed/normalized/competency_units/dba/{subject}/{grade}.json`
3. **410 competency units** (55 archivos procesados)

### Pipeline Estándares
1. **Archivos parseados**: `data/processed/parsed/standards/{subject}/{grade_range}.json`
2. **Archivos normalizados**: `data/processed/normalized/competency_units/standards/{subject}/{grade_range}.json`
3. **1,158 competency units** (25 archivos procesados)

### Consolidado
- **Archivo final**: `data/processed/normalized/competency_units/all_competency_units.json`
- **Total**: **1,568 competency units** (410 DBAs + 1,158 Estándares)

---

## 🔄 Pipeline Estándares

Procesa Estándares Básicos de Competencias (cada item/subproceso → 1 competency unit)

### Ejecutar Pipeline Completo
```bash
python scripts/parsers/run_standards_pipeline.py
```

### Ejecutar Solo Parsing
```bash
python scripts/parsers/run_standards_pipeline.py parse
```

### Ejecutar Solo Normalización
```bash
python scripts/parsers/run_standards_pipeline.py normalize
```

### Estructura por Materia

#### Matemáticas
```
PENSAMIENTO: numerico_sistemas_numericos
- Estándar 1
- Estándar 2
```
**Resultado**: Cada item → 1 competency unit

#### Lenguaje
```
FACTOR: comprension_interpretacion_textual
STANDARD: Comprendo e interpreto...
- Subproceso 1
- Subproceso 2
```
**Resultado**: Cada subproceso → 1 competency unit (con referencia al standard padre)

#### Ciencias
```
AXIS: manejo_conocimientos_de_ciencias_naturales
SUBAXIS: entorno_vivo
- Estándar 1
- Estándar 2
```

**Caso especial (Naturales 10-11)**:
```
SUBAXIS: entorno_vivo
PROCESS: biologicos
- Estándar específico
```

**Caso especial (Sociales 10-11)**:
```
AXIS: me_aproximo_como_cientifico_social

Formulo proyectos:
- Item específico

Desarrollo las investigaciones:
- Item específico

Presento los resultados:
- Item específico
```

**Resultado**: Cada item → 1 competency unit (con metadata de process/división)

#### Inglés
```
HABILIDAD: reading
- Estándar 1
- Estándar 2
```
**Resultado**: Cada item → 1 competency unit

---

## 📊 Resultados Globales

### Distribución por Fuente

| Fuente | Unidades | Archivos | Cobertura |
|--------|----------|----------|-----------|
| DBAs | 410 | 55 | 11 grados × 5 materias |
| Estándares | 1,158 | 25 | 5 grupos × 5 materias |
| **TOTAL** | **1,568** | **80** | - |

### Por Materia (Total)

| Materia | DBAs | Estándares | Total |
|---------|------|------------|-------|
| Matemáticas | 119 | 172 | 291 |
| Lenguaje | 88 | 177 | 265 |
| Ciencias | 54 | 341 | 395 |
| Sociales | 82 | 250 | 332 |
| Inglés | 67 | 218 | 285 |

---

## 🔜 Próximos Pasos

1. ✅ Parser DBAs - COMPLETO
2. ✅ Parser Estándares - COMPLETO
3. 🔄 Generar embeddings (OpenAI text-embedding-3-small)
4. 🔄 Subir a Supabase (`kuneo.competency_units` con pgvector)
5. ⏳ Parser Lineamientos Curriculares
6. ⏳ Integración con generación de módulos

---

## 💡 Notas Técnicas

- **Encoding**: UTF-8 para soporte de caracteres especiales
- **IDs**: UUIDs generados con `uuid.uuid4()`
- **Formato JSON**: Pretty-printed con indent=2 y `ensure_ascii=False`
- **Manejo de errores**: Try-catch en cada archivo, continúa con siguiente si falla
- **Validación**: Filtros para líneas muy cortas o bloques vacíos
- **Detección automática**: El parser de estándares detecta la estructura por materia
- **Jerarquías**: Los estándares preservan la jerarquía completa (Axis→Subaxis→Process)

---

## 🐛 Troubleshooting

### DBAs

#### Error: "Carpeta no encontrada"
Verifica que existan los archivos TXT en `data/clean/dba/{subject}/dba_grades/`

#### Error al parsear un grado específico
Revisa el formato del archivo TXT, asegúrate que tenga:
- Separadores DBA: N
- Secciones ENUNCIADO, EVIDENCES/SKILL, EXAMPLE
- Formato correcto en tipos de contenido [TIPO: xxx]

#### Archivo consolidado vacío
Ejecuta primero el parsing completo antes de la normalización

### Estándares

#### Error: "No se detectó estructura"
Verifica que el archivo TXT tenga los marcadores correctos:
- Matemáticas: `PENSAMIENTO:`
- Lenguaje: `FACTOR:` y `STANDARD:`
- Ciencias: `AXIS:` y `SUBAXIS:`
- Inglés: `HABILIDAD:`

#### Falta jerarquía en el output
Asegúrate que los niveles de indentación están correctos en el TXT

#### No se fusionaron DBAs y Estándares
Ejecuta ambos pipelines completos, el archivo consolidado se genera al final del pipeline de estándares

---

## 📚 Documentación Completa

- **README Principal**: Este archivo
- **Resumen Consolidado**: [data/processed/CURRICULUM_PROCESSING_SUMMARY.md](../../data/processed/CURRICULUM_PROCESSING_SUMMARY.md)
- **Resumen DBAs**: [data/processed/DBA_PROCESSING_SUMMARY.md](../../data/processed/DBA_PROCESSING_SUMMARY.md)

---

**Versión**: 1.0  
**Última actualización**: 11 de mayo, 2026  
**Tasa de éxito**: 100% (80/80 archivos procesados sin errores)
