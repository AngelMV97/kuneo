# 🏗️ Module Generator - Sistema de Generación de Módulos

## 📚 Resumen Ejecutivo

El **Module Generator** es el sistema que convierte las taxonomías curriculares en módulos educativos concretos. Implementa la transformación de:

```
curriculum_taxonomy (estructura) + competency_units (contenido) → modules (experiencias de aprendizaje)
```

**Principios arquitectónicos:**
- ❌ **NO 1:1 mapping** de DBA → módulo
- ✅ **Módulos = unidades cognitivas autónomas**
- ✅ **5 fases cognitivas obligatorias** por módulo
- ✅ **Progresión tipo Duolingo**: sesiones → problemas → ejercicios

---

## 🎯 Arquitectura del Módulo

### Estructura de un Módulo

Cada módulo generado tiene la siguiente estructura en la base de datos:

```sql
CREATE TABLE kuneo.modules (
    id UUID PRIMARY KEY,
    subject kuneo.subject_enum NOT NULL,  -- matematicas, ciencias, etc.
    title TEXT NOT NULL,
    description TEXT,
    difficulty INTEGER (1-5),  -- Nivel cognitivo
    grade_level INTEGER (1-11),  -- Grado objetivo
    structure JSONB NOT NULL,  -- Ver estructura detallada abajo
    order_index INTEGER,
    is_active BOOLEAN
)
```

### Estructura JSONB del Campo `structure`

```json
{
  "phases": [
    {
      "id": "comprension",
      "name": "Comprensión",
      "dimension": "comprension",
      "goal": "Entender conceptos fundamentales",
      "activities": ["conceptual_cards", "examples", "guided_reading"]
    },
    {
      "id": "representacion",
      "name": "Representación",
      "dimension": "representacion",
      "goal": "Modelar y representar ideas",
      "activities": ["visual_models", "diagrams", "symbolic_notation"]
    },
    {
      "id": "razonamiento",
      "name": "Razonamiento",
      "dimension": "razonamiento",
      "goal": "Aplicar lógica y estrategias",
      "activities": ["problem_solving", "logical_reasoning", "pattern_recognition"]
    },
    {
      "id": "transferencia",
      "name": "Transferencia",
      "dimension": "transferencia",
      "goal": "Aplicar en nuevos contextos",
      "activities": ["real_world_problems", "novel_situations", "cross_domain"]
    },
    {
      "id": "metacognicion",
      "name": "Metacognición",
      "dimension": "metacognicion",
      "goal": "Reflexionar sobre el aprendizaje",
      "activities": ["self_assessment", "strategy_reflection", "error_analysis"]
    }
  ],
  "content_tags": ["aritmetica", "numeros_fraccionarios", "fraccion_parte_todo"],
  "linked_standards": ["MEN-MAT-5-1", "MEN-MAT-5-2"],
  "expected_outcomes": [
    "Comprender representación visual de fracciones",
    "Aplicar partición de unidades",
    "Analizar fracciones equivalentes visuales"
  ],
  "taxonomy_reference": {
    "discipline": "aritmetica",
    "thematic": "numeros_fraccionarios",
    "subthematic": "fraccion_parte_todo",
    "microtopics": ["representacion_visual_fracciones", "particion_de_unidades"]
  }
}
```

---

## 🔧 Uso del Module Generator

### 1. Generación de Prueba (5 módulos)

```bash
python scripts/generators/module_generator.py
```

Genera 5 módulos de matemáticas (grados 4-5) para testing.

### 2. Generación por Lotes

```python
from scripts.generators.module_generator import ModuleGenerator

generator = ModuleGenerator()

# Generar todos los módulos de matemáticas para grados 4-5
modules = generator.generate_modules_for_subject(
    subject="matematicas",
    grade_range="4-5"
)

print(f"Creados {len(modules)} módulos")
```

### 3. Generación Masiva

```bash
python scripts/generators/generate_all_modules.py
```

Menú interactivo:
1. **Catálogo completo** (~1,570 módulos, 5-10 minutos)
2. **Subset de prueba** (~100 módulos, 1-2 minutos)

---

## 📊 Proceso de Generación

### Flujo Paso a Paso

1. **Leer entrada de taxonomía**
   ```python
   taxonomy_entry = {
       "subject": "matematicas",
       "grade_range": "4-5",
       "discipline": "aritmetica",
       "thematic": "numeros_fraccionarios",
       "subthematic": "fraccion_parte_todo",
       "microtopics": ["representacion_visual_fracciones", "particion_de_unidades"]
   }
   ```

2. **Buscar competencias relacionadas**
   - Query a `competency_units` usando subthematic + microtopics
   - Extrae `competency_code` para vincular estándares MEN
   - Máximo 5 competencias por módulo

3. **Calcular dificultad**
   - Base: por rango de grado (1-3 → 1, 4-5 → 2, etc.)
   - Ajustes: +1 si tiene >6 microtopics

4. **Generar estructura JSONB**
   - 5 fases cognitivas (siempre las mismas)
   - Content tags: discipline + thematic + subthematic + top 3 microtopics
   - Expected outcomes: basados en primeros 3 microtopics
   - Taxonomy reference: enlace completo a la entrada de taxonomía

5. **Crear título y descripción**
   - Título: subthematic convertido a Title Case
   - Descripción: "Explora {subthematic}, incluyendo {microtopics}"

6. **Insertar en base de datos**
   ```python
   module = {
       "subject": "matematicas",
       "title": "Fracción Parte Todo",
       "description": "Explora fracción parte todo, incluyendo representación visual...",
       "difficulty": 2,
       "grade_level": 5,
       "structure": json.dumps(structure),
       "order_index": 1,
       "is_active": True
   }
   ```

---

## 🎨 5 Dimensiones Cognitivas

### 1. Comprensión
**Objetivo:** Entender conceptos fundamentales  
**Actividades:**
- Tarjetas conceptuales
- Ejemplos guiados
- Lectura dirigida

**Ejemplo:** "¿Qué es una fracción? Una fracción representa una parte de un todo..."

### 2. Representación
**Objetivo:** Modelar y representar ideas  
**Actividades:**
- Modelos visuales
- Diagramas
- Notación simbólica

**Ejemplo:** Dibujar 3/4 usando círculos divididos

### 3. Razonamiento
**Objetivo:** Aplicar lógica y estrategias  
**Actividades:**
- Resolución de problemas
- Razonamiento lógico
- Reconocimiento de patrones

**Ejemplo:** "¿Por qué 2/4 = 1/2? Razona usando equivalencia..."

### 4. Transferencia
**Objetivo:** Aplicar en nuevos contextos  
**Actividades:**
- Problemas del mundo real
- Situaciones novedosas
- Transferencia entre dominios

**Ejemplo:** "María comió 3/8 de una pizza. Si la pizza costó $16,000, ¿cuánto pagó?"

### 5. Metacognición
**Objetivo:** Reflexionar sobre el aprendizaje  
**Actividades:**
- Autoevaluación
- Reflexión de estrategias
- Análisis de errores

**Ejemplo:** "¿Qué estrategia usaste? ¿Qué dificultades encontraste?"

---

## 📈 Estadísticas de Generación

### Esperadas (Catálogo Completo)

| Materia | Entradas Taxonomy | Módulos Esperados |
|---------|-------------------|-------------------|
| Matemáticas | 300 | ~300 |
| Ciencias Naturales | 446 | ~446 |
| Ciencias Sociales | 305 | ~305 |
| Lenguaje | 302 | ~302 |
| Inglés | 217 | ~217 |
| **TOTAL** | **1,570** | **~1,570** |

### Distribución por Dificultad

| Dificultad | Rangos de Grado | Módulos Esperados |
|------------|-----------------|-------------------|
| ⭐ (1) | 1-3 | ~298 |
| ⭐⭐ (2) | 4-5 | ~328 |
| ⭐⭐⭐ (3) | 6-7 | ~318 |
| ⭐⭐⭐⭐ (4) | 8-9 | ~297 |
| ⭐⭐⭐⭐⭐ (5) | 10-11 | ~329 |

---

## 🔗 Integración con Otros Sistemas

### 1. Adaptive Engine (Próximo)
El adaptive engine usará los módulos para:
- Recomendar siguiente módulo basado en progreso
- Ajustar dificultad según desempeño
- Crear rutas de aprendizaje personalizadas

### 2. Content Generator (Futuro)
Usará la estructura del módulo para:
- Generar ejercicios por fase
- Crear hints contextuales
- Generar feedback adaptativo

### 3. Visual Engine
Mostrará:
- Mapa de progreso curricular
- Visualización de fases completadas
- Árbol de taxonomía navegable

### 4. Misconception Engine
Vinculará:
- Errores comunes por microtopic
- Retroalimentación específica
- Rutas de remediación

---

## 🔍 Consultas SQL Útiles

### Ver todos los módulos de matemáticas
```sql
SELECT title, grade_level, difficulty 
FROM kuneo.modules 
WHERE subject = 'matematicas' 
ORDER BY grade_level, order_index;
```

### Contar módulos por materia
```sql
SELECT subject, COUNT(*) as total 
FROM kuneo.modules 
GROUP BY subject 
ORDER BY total DESC;
```

### Ver estructura de un módulo específico
```sql
SELECT title, structure 
FROM kuneo.modules 
WHERE title = 'Fracción Parte Todo';
```

### Módulos por dificultad y grado
```sql
SELECT grade_level, difficulty, COUNT(*) as total 
FROM kuneo.modules 
GROUP BY grade_level, difficulty 
ORDER BY grade_level, difficulty;
```

---

## ⚠️ Consideraciones Importantes

### Duplicados
- Si ejecutas el generador múltiples veces, se crearán módulos duplicados
- Limpia la tabla antes de regenerar: `DELETE FROM kuneo.modules;`

### Performance
- Generación masiva toma ~5-10 minutos
- ~3 módulos/segundo (con búsqueda de competencias)
- Optimización futura: cache de competencias

### Competencias Relacionadas
- Actualmente búsqueda simple (no semántica)
- Futuro: usar embeddings para mejor matching
- Alternativa: mapeo manual taxonomy → competency

### Personalización
- Los titles y descriptions son generados automáticamente
- Pueden ser editados manualmente en Supabase después
- Futuro: usar LLM para generar mejores descripciones

---

## 🚀 Próximos Pasos

1. **Ejecutar generación masiva**
   ```bash
   python scripts/generators/generate_all_modules.py
   ```

2. **Validar módulos generados**
   - Revisar en Supabase dashboard
   - Verificar distribución por materias
   - Confirmar estructura JSONB correcta

3. **Implementar Content Generator**
   - Leer estructura del módulo
   - Generar ejercicios por fase
   - Usar LLM para crear contenido dinámico

4. **Integrar con Adaptive Engine**
   - Lógica de desbloqueo de módulos
   - Recomendaciones basadas en progreso
   - Ajuste de dificultad dinámico

5. **Crear API endpoints**
   - POST `/api/modules/generate` - Generar módulos por lote
   - GET `/api/modules/taxonomy/:id` - Obtener módulo por taxonomía
   - PATCH `/api/modules/:id/structure` - Actualizar estructura

---

## 📝 Notas Técnicas

### ¿Por qué 1:1 con Taxonomía?
- Cada subtemática es una unidad cognitiva autónoma
- Granularidad óptima para sesiones de 30-45 minutos
- Permite progresión gradual y medible

### ¿Por qué 5 Fases Siempre?
- Garantiza cobertura cognitiva completa
- Permite tracking uniforme de progreso
- Facilita análisis de datos de aprendizaje

### ¿Cómo se Vinculan los Contenidos?
```
Module (estructura) 
  → Session (instancia de aprendizaje)
    → Phase (fase cognitiva actual)
      → Problem (generado por LLM)
        → Exercise (generado por LLM)
```

---

**🎓 "Transformando estructura curricular en experiencias de aprendizaje"**
