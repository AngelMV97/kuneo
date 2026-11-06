# ✅ Normalizador Universal - Completado

**Fecha**: 11 de mayo, 2026  
**Versión**: 1.0  

---

## 📊 Resultados

### Totales Procesados
- **1,426 competency units** generados
  - **410 DBAs** (Derechos Básicos de Aprendizaje)  
  - **1,016 Estándares** (Estándares Básicos de Competencias)
- **80 archivos JSON** procesados (parsed → normalized)
- **0 errores** durante normalización

---

## 🏗️ Arquitectura del Flujo

```
data/clean/*.txt
   ↓ parsers específicos (dba_parser.py, standards_parser.py)
data/processed/parsed/*.json
   ↓ normalizador universal (universal_normalizer.py)
data/processed/normalized/competency_units/*.json
   ↓ embeddings generator / Supabase upload
```

### Ventajas de esta arquitectura:
✅ **Separación de responsabilidades**: Cada parser maneja su formato específico  
✅ **Normalización unificada**: Un solo formato final para ambos tipos  
✅ **Iteración independiente**: Puedes mejorar un parser sin tocar el normalizador  
✅ **Formato simple**: Estructura plana y directa para embeddings/DB

---

## 📋 Formato Universal

### Estructura Simplificada

```json
{
  "id": "uuid",
  "type": "competency_unit",
  "source": "dba" | "standard",
  "subject": "matematicas",
  "grade_range": "5",
  "difficulty": 3,
  "content": {
    "competency": "...",
    "evidence": [],
    "example": "",
    "concepts": [],
    "misconceptions": [],
    "metadata": {}
  }
}
```

### Cambios vs Versión Anterior

**Eliminado**:
- ❌ `source_id`
- ❌ `curriculum` (subject y grade_range ahora están en nivel superior)
- ❌ `cognitive_analysis` (reemplazado por `difficulty` simple)
- ❌ `embedding_metadata`
- ❌ `processing`

**Agregado/Simplificado**:
- ✅ `subject` y `grade_range` en nivel superior
- ✅ `difficulty` (1-5) en lugar de `complexity_level` con análisis cognitivo
- ✅ `content.metadata` para información específica del tipo (dba_number, axis, etc.)

---

## 🎯 Ejemplos por Tipo

### DBA (Matemáticas Grado 5)

```json
{
  "id": "fd262357-08f9-4c17-af52-315a170d6ba8",
  "type": "competency_unit",
  "source": "dba",
  "subject": "mathematics",
  "grade_range": "5",
  "difficulty": 2,
  "content": {
    "competency": "Interpreta y utiliza los números naturales y racionales...",
    "evidence": [
      "Interpreta la relación parte - todo y la representa por medio de fracciones...",
      "Interpreta y utiliza números naturales y racionales..."
    ],
    "example": "Don Marcos, el dueño de una finca...",
    "concepts": ["reading", "fracciones", "lectura_inferencial", "potenciacion"],
    "misconceptions": ["pensar que una fracción solo representa una parte de un objeto..."],
    "metadata": {
      "dba_number": 1
    }
  }
}
```

### Standard (Lenguaje Grados 6-7)

```json
{
  "id": "bad05e7b-5c74-4932-8acd-d1342b4863a5",
  "type": "competency_unit",
  "source": "standard",
  "subject": "language",
  "grade_range": "6-7",
  "difficulty": 3,
  "content": {
    "competency": "Conozco y utilizo algunas estrategias argumentativas...",
    "evidence": [
      "Defino una temática para la elaboración de un texto oral...",
      "Formulo una hipótesis para demostrarla en un texto oral...",
      "Llevo a cabo procedimientos de búsqueda..."
    ],
    "example": "",
    "concepts": ["reading", "lectura_inferencial", "argumentacion"],
    "misconceptions": ["creer que la interpretación de un texto es única"],
    "metadata": {
      "structure_mode": "language",
      "axis": "produccion_textual",
      "axis_name": "produccion_textual"
    }
  }
}
```

---

## 🔍 Tratamiento por Estructura

### DBAs
- **Input**: Lista de DBAs con `content.competency`, `content.evidence`, `content.examples`
- **Output**: 1 competency unit por DBA
- **Evidence**: Evidencias del DBA
- **Metadata**: `dba_number`

### Estándares - Language Mode
- **Input**: FACTOR → STANDARD → subprocesses
- **Output**: 1 competency unit por STANDARD (no por subprocess)
- **Evidence**: Subprocesses como array de evidence
- **Metadata**: `structure_mode: "language"`, `axis`, `axis_name`

**Ejemplo**:
```
FACTOR: produccion_textual
  STANDARD: "Conozco y utilizo estrategias..."
    - Subprocess 1
    - Subprocess 2
    - Subprocess 3
```
↓
```json
{
  "competency": "Conozco y utilizo estrategias...",
  "evidence": ["Subprocess 1", "Subprocess 2", "Subprocess 3"]
}
```

### Estándares - Math/English Mode
- **Input**: PENSAMIENTO/HABILIDAD → items
- **Output**: 1 competency unit por item
- **Evidence**: Array vacío
- **Metadata**: `structure_mode: "math"/"english"`, `axis`, `axis_name`

### Estándares - Science Mode
- **Input**: AXIS → SUBAXIS → items/processes/divisions
- **Output**: 1 competency unit por item
- **Evidence**: Array vacío
- **Metadata**: `structure_mode: "science"`, `axis`, `subaxis`, `process`/`division` (si aplica)

---

## 🧠 Características Inteligentes

### 1. Estimación de Dificultad (1-5)

```python
1: Grados 1-3 (básico)
2: Grados 4-5 (intermedio bajo)
3: Grados 6-7 (intermedio)
4: Grados 8-9 (intermedio alto)
5: Grados 10-11 (avanzado)
```

### 2. Extracción de Conceptos

El normalizador identifica automáticamente conceptos clave:

**Matemáticas**: fracciones, proporcionalidad, potenciacion, area_perimetro, volumen, plano_cartesiano, estadistica, probabilidad

**Lenguaje**: lectura_inferencial, argumentacion, escritura, gramatica

**Ciencias**: electricidad, ecosistema, celula, movimiento

**Sociales**: sociedad, territorio, historia

**Inglés**: listening, speaking, reading, writing

### 3. Generación de Misconceptions

Basado en patrones comunes por concepto:

```python
{
  'fracción': 'pensar que una fracción solo representa una parte de un objeto y no una relación',
  'área': 'creer que figuras con igual área siempre tienen igual perímetro',
  'probabilidad': 'creer que un evento probable siempre ocurrirá',
  'célula': 'creer que todas las células son iguales',
  'texto': 'creer que la interpretación de un texto es única'
}
```

---

## 📁 Archivos Generados

### Estructura de Salida

```
data/processed/normalized/competency_units/
├── dba/
│   ├── matematicas/
│   │   ├── 1.json (10 unidades)
│   │   ├── 2.json (11 unidades)
│   │   └── ... (119 total)
│   ├── lenguaje/ (88 total)
│   ├── ciencias/ (54 total)
│   ├── sociales/ (82 total)
│   └── ingles/ (67 total)
├── standards/
│   ├── matematicas/
│   │   ├── 1-3.json (39 unidades)
│   │   ├── 4-5.json (39 unidades)
│   │   └── ... (172 total)
│   ├── lenguaje/ (35 total)
│   ├── ciencias/ (341 total)
│   ├── sociales/ (250 total)
│   └── ingles/ (218 total)
└── all_competency_units.json (1,426 unidades)
```

---

## 📊 Distribución Final

### Por Fuente

| Fuente | Unidades | % |
|--------|----------|---|
| DBAs | 410 | 28.8% |
| Estándares | 1,016 | 71.2% |
| **Total** | **1,426** | **100%** |

### Por Materia

| Materia | DBAs | Estándares | Total |
|---------|------|------------|-------|
| Matemáticas | 119 | 172 | 291 |
| Lenguaje | 88 | 35 | 123 |
| Ciencias | 54 | 341 | 395 |
| Sociales | 82 | 250 | 332 |
| Inglés | 67 | 218 | 285 |

**Nota**: Los estándares de lenguaje tienen menos unidades porque cada STANDARD completo (con sus subprocesses) se cuenta como 1 unidad, no como múltiples.

---

## 🚀 Uso del Normalizador

### Ejecutar Normalización Completa

```bash
python scripts/parsers/universal_normalizer.py
```

### Desde Código Python

```python
from universal_normalizer import UniversalNormalizer
import json

normalizer = UniversalNormalizer()

# Normalizar un documento
with open('parsed_document.json', 'r', encoding='utf-8') as f:
    parsed = json.load(f)

normalized_units = normalizer.normalize_parsed_document(parsed)

# Construir una unidad manualmente
unit = normalizer._build_competency_unit(
    source='dba',
    subject='matematicas',
    grade_range='5',
    competency='Interpreta fracciones...',
    evidence=['Evidencia 1', 'Evidencia 2'],
    example='Ejemplo...',
    metadata={'dba_number': 1}
)
```

---

## 🔜 Próximos Pasos

### 1. Generador de Embeddings

```bash
python scripts/embeddings/generate_embeddings.py
```

**Input**: `all_competency_units.json` (1,426 unidades)  
**Proceso**:
- Concatenar `competency + evidence + example` para cada unidad
- Generar embedding (OpenAI text-embedding-3-small, 1536 dims)
- Agregar campo `embedding` a cada unidad

### 2. Upload a Supabase

```bash
python scripts/database/upload_to_supabase.py
```

**Tabla**: `kuneo.competency_units`  
**Schema**:
```sql
CREATE TABLE kuneo.competency_units (
  id UUID PRIMARY KEY,
  type TEXT,
  source TEXT,
  subject TEXT,
  grade_range TEXT,
  difficulty INT,
  content JSONB,
  embedding VECTOR(1536)
);

CREATE INDEX ON kuneo.competency_units USING ivfflat (embedding vector_cosine_ops);
```

---

## 🎯 Lineamientos Curriculares

### Estado Actual

Los Lineamientos Curriculares disponibles en `data/raw/men/marco/`:
- Lineamientos Curriculares para Formación Ciudadana y Desarrollo Socioemocional
- Lineamientos Curriculares para Formación Integral

### Recomendación

❌ **No requieren parser inmediato**

**Razón**: Son documentos **marco generales** de alto nivel pedagógico, no contienen competencias específicas por grado/materia como DBAs y Estándares.

**Uso potencial**:
- Contexto para enriquecimiento semántico
- Metadata de alto nivel para competency units
- Documentación de referencia para tutores/profesores

**Si en el futuro se necesita parsear**: Requeriría OCR + NLP para extraer principios pedagógicos y relacionarlos con competency units existentes.

---

## ✨ Conclusión

El normalizador universal simplifica y unifica:
- ✅ 2 tipos de documentos curriculares
- ✅ 5 estructuras diferentes (language, math, english, science con variaciones)
- ✅ 80 archivos parseados
- ✅ 1,426 competency units listas para embeddings y Supabase

**Listo para embeddings y carga a base de datos**.

---

**Versión**: 1.0  
**Procesamiento**: ~3 segundos  
**Tasa de éxito**: 100% (80/80 archivos)
