# 🎓 Parsers de Referentes Curriculares - Resumen Completo

**Sistema**: Kuneo - Plataforma de Tutoría Cognitiva  
**Fecha**: 11 de mayo, 2026  

---

## ✅ Resultados Globales

### Total Procesado
- **1,568 competency units** generados exitosamente
  - **410 DBAs** (Derechos Básicos de Aprendizaje)
  - **1,158 Estándares** (Estándares Básicos de Competencias)
- **80 archivos TXT** procesados
- **0 errores** durante el procesamiento

---

## 📊 Distribución por Fuente

### DBAs (410 unidades)
| Materia | Unidades | % |
|---------|----------|---|
| Matemáticas | 119 | 29.0% |
| Lenguaje | 88 | 21.5% |
| Sociales | 82 | 20.0% |
| Inglés | 67 | 16.3% |
| Ciencias | 54 | 13.2% |

**Cobertura**: 11 grados × 5 materias = 55 archivos

### Estándares (1,158 unidades)
| Materia | Unidades | % |
|---------|----------|---|
| Ciencias Naturales | 341 | 29.4% |
| Sociales | 250 | 21.6% |
| Inglés | 218 | 18.8% |
| Lenguaje | 177 | 15.3% |
| Matemáticas | 172 | 14.9% |

**Cobertura**: 5 grupos de grados × 5 materias = 25 archivos

---

## 📁 Arquitectura de Archivos

### Entrada (Clean Data)
```
data/clean/
├── dba/
│   ├── matematicas/dba_grades/    # 11 archivos (1.txt - 11.txt)
│   ├── ciencias/dba_grades/
│   ├── lenguaje/dba_grades/
│   ├── sociales/dba_grades/
│   └── ingles/dba_grades/
└── standards/
    ├── matematicas/standard_grades/    # 5 archivos (1-3, 4-5, 6-7, 8-9, 10-11)
    ├── ciencias/standard_grades/
    ├── lenguaje/standard_grades/
    ├── sociales/standard_grades/
    └── ingles/standard_grades/
```

### Salida (Processed Data)
```
data/processed/
├── parsed/
│   ├── dba/{subject}/{grade}.json
│   └── standards/{subject}/{grade_range}.json
└── normalized/competency_units/
    ├── dba/{subject}/{grade}.json
    ├── standards/{subject}/{grade_range}.json
    └── all_competency_units.json    # ⭐ Archivo consolidado
```

---

## 🔄 Pipelines

### Pipeline DBA
```bash
python scripts/parsers/run_dba_pipeline.py
```

**Resultado**: 410 competency units  
**Tiempo**: ~2 segundos

### Pipeline Estándares
```bash
python scripts/parsers/run_standards_pipeline.py
```

**Resultado**: 1,158 competency units  
**Tiempo**: ~3 segundos

---

## 📋 Estructuras por Materia

### 1. Matemáticas

#### DBAs
```
DBA: N
SUBJECT: matematicas
GRADE: N
ENUNCIADO: ...
EVIDENCES: [bullets]
EXAMPLE: [TIPO: xxx] contenido
```

**Resultado**: 1 DBA → 1 competency unit

#### Estándares
```
PENSAMIENTO: numerico_sistemas_numericos
- Estándar 1
- Estándar 2
```

**Resultado**: Cada item → 1 competency unit

---

### 2. Lenguaje

#### DBAs
```
DBA: N
SUBJECT: lenguaje
GRADE: N
ENUNCIADO: ...
EVIDENCES: [bullets]
EXAMPLE: [tipos mixtos]
```

#### Estándares
```
FACTOR: comprension_interpretacion_textual
STANDARD: Comprendo e interpreto...
- Subproceso 1
- Subproceso 2
```

**Resultado**: Cada subproceso → 1 competency unit

---

### 3. Ciencias Naturales

#### DBAs
Igual estructura que matemáticas

#### Estándares (Grupos 1-9)
```
AXIS: manejo_conocimientos_de_ciencias_naturales
SUBAXIS: entorno_vivo
- Estándar 1
- Estándar 2
```

#### Estándares (Grupo 10-11) ⚠️ Especial
```
AXIS: manejo_conocimientos_de_ciencias_naturales
SUBAXIS: entorno_vivo
PROCESS: biologicos
- Estándar 1
- Estándar 2
```

**Resultado**: Cada item → 1 competency unit (con metadata de process)

---

### 4. Ciencias Sociales

#### DBAs
Igual estructura que matemáticas

#### Estándares (Grupo 10-11) ⚠️ Especial
```
AXIS: me_aproximo_como_cientifico_social
- Item general

Formulo proyectos:
- Item específico

Desarrollo las investigaciones:
- Item específico

Presento los resultados:
- Item específico
```

**Resultado**: Cada item → 1 competency unit (con metadata de división)

---

### 5. Inglés

#### DBAs ⚠️ Especial
Usa `SKILL` en lugar de `EVIDENCES`

```
DBA: N
SUBJECT: ingles
GRADE: N
ENUNCIADO: ...
SKILL:
- Lectura
- Escritura
EXAMPLE: [conversacion/monologo]
```

#### Estándares
```
HABILIDAD: reading
- Estándar 1
- Estándar 2
```

**Resultado**: Cada item → 1 competency unit

---

## 🧠 Enriquecimiento Cognitivo

Cada competency unit incluye:

### 1. Dimensiones Cognitivas
```json
"cognitive_analysis": {
  "dimensions": {
    "comprension": 0.25,
    "representacion": 0.0,
    "razonamiento": 0.33,
    "transferencia": 0.25,
    "metacognicion": 0.0
  },
  "primary_dimension": "razonamiento",
  "complexity_level": 3,
  "keywords": ["fraccion", "razon"]
}
```

### 2. Metadata Jerárquica (Estándares)
```json
"curriculum": {
  "subject": "mathematics",
  "grade_range": "4-5",
  "structure_mode": "math",
  "hierarchy": {
    "axis_key": "numerico_sistemas_numericos",
    "axis_name": "numerico_sistemas_numericos",
    "axis_type": "math_thought"
  }
}
```

### 3. Preparación para Embeddings
```json
"embedding_metadata": {
  "text_for_embedding": "[Eje] [Subeje] Competencia completa...",
  "chunk_size": 14,
  "requires_chunking": false
}
```

---

## 🎯 Diferencias: DBAs vs Estándares

| Aspecto | DBAs | Estándares |
|---------|------|------------|
| **Granularidad** | 1 DBA completo | 1 item/subproceso individual |
| **Evidencias** | ✅ Explícitas | ❌ No incluidas |
| **Ejemplos** | ✅ Múltiples tipos | ❌ No incluidos |
| **Jerarquía** | Plana (por grado) | Jerárquica (Axis→Subaxis→Process) |
| **Cobertura** | Por grado (1-11) | Por grupos (1-3, 4-5, 6-7, 8-9, 10-11) |
| **Complejidad** | Alta (texto largo) | Media (items específicos) |

---

## 📊 Estadísticas Detalladas

### Por Grado (DBAs)
| Grado | DBAs | Promedio/Materia |
|-------|------|------------------|
| 1° | 35 | 7.0 |
| 2° | 35 | 7.0 |
| 3° | 37 | 7.4 |
| 4° | 38 | 7.6 |
| 5° | 36 | 7.2 |
| 6° | 41 | 8.2 |
| 7° | 36 | 7.2 |
| 8° | 41 | 8.2 |
| 9° | 41 | 8.2 |
| 10° | 34 | 6.8 |
| 11° | 36 | 7.2 |

### Por Grupo de Grados (Estándares)
| Grupo | Estándares | Promedio/Materia |
|-------|------------|------------------|
| 1-3 | 221 | 44.2 |
| 4-5 | 222 | 44.4 |
| 6-7 | 242 | 48.4 |
| 8-9 | 238 | 47.6 |
| 10-11 | 235 | 47.0 |

---

## 🚀 Scripts Disponibles

### Validación
```bash
python scripts/parsers/validate_structure.py
```

### DBAs
```bash
# Pipeline completo
python scripts/parsers/run_dba_pipeline.py

# Solo parsing
python scripts/parsers/run_dba_pipeline.py parse

# Solo normalización
python scripts/parsers/run_dba_pipeline.py normalize
```

### Estándares
```bash
# Pipeline completo
python scripts/parsers/run_standards_pipeline.py

# Solo parsing
python scripts/parsers/run_standards_pipeline.py parse

# Solo normalización
python scripts/parsers/run_standards_pipeline.py normalize
```

---

## 📚 Documentación

- **README Principal**: [scripts/parsers/README.md](scripts/parsers/README.md)
- **Resumen DBAs**: [data/processed/DBA_PROCESSING_SUMMARY.md](data/processed/DBA_PROCESSING_SUMMARY.md)
- **Este archivo**: Resumen consolidado de ambos parsers

---

## 🔜 Próximos Pasos

### 1. Generación de Embeddings
```bash
python scripts/embeddings/generate_embeddings.py
```
- Input: `all_competency_units.json` (1,568 unidades)
- Modelo: OpenAI text-embedding-3-small
- Output: Vectores de 1536 dimensiones

### 2. Carga a Supabase
```bash
python scripts/database/upload_to_supabase.py
```
- Tabla: `kuneo.competency_units`
- Vectores → `pgvector` para búsqueda semántica

### 3. Parsers Adicionales
- **Lineamientos Curriculares**: Estructura más compleja, requiere OCR
- **Mallas Curriculares**: Si se dispone de datos estructurados
- **Banco de Preguntas ICFES**: Para práctica

---

## ✨ Calidad y Robustez

### Validaciones Implementadas
- ✅ Detección automática de estructura por materia
- ✅ Manejo de casos especiales (inglés, ciencias 10-11, sociales 10-11)
- ✅ Preservación de jerarquía (Axis → Subaxis → Process)
- ✅ Try-catch por archivo (un error no detiene el proceso)
- ✅ Logs detallados en cada paso

### Formatos Soportados
- ✅ UTF-8 con caracteres especiales (tildes, ñ)
- ✅ Multiple estructuras jerárquicas
- ✅ Bullets con diferentes formatos (-, •)
- ✅ Divisiones especiales y procesos

---

## 💡 Ejemplo Completo

### Input (Estándar)
```
SUBJECT: matematicas
GRADE_RANGE: 4-5
STRUCTURE: math

PENSAMIENTO: numerico_sistemas_numericos
- Interpreto las fracciones en diferentes contextos.
- Utilizo la notación decimal para expresar fracciones.
```

### Output (Competency Unit)
```json
{
  "id": "uuid",
  "type": "competency_unit",
  "source": "standard",
  "curriculum": {
    "subject": "mathematics",
    "grade_range": "4-5",
    "structure_mode": "math",
    "hierarchy": {
      "axis_key": "numerico_sistemas_numericos",
      "axis_type": "math_thought"
    }
  },
  "content": {
    "competency": "Interpreto las fracciones en diferentes contextos.",
    "concepts": ["fraccion"],
    ...
  },
  "cognitive_analysis": {
    "dimensions": {...},
    "complexity_level": 2
  }
}
```

---

**Sistema**: Kuneo v1.0  
**Parsers**: DBA Parser v1.0 + Standards Parser v1.0  
**Tiempo total de procesamiento**: ~5 segundos  
**Tasa de éxito**: 100% (80/80 archivos)
