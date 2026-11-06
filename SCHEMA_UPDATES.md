# 📋 Actualizaciones del Schema - Kuneo

Este documento resume las correcciones críticas y mejoras aplicadas a `schema.sql` antes de la ejecución en Supabase.

## 🚨 Problemas Críticos Corregidos

### 1. **Extensión pgcrypto Faltante**
**Problema**: `gen_random_uuid()` requiere la extensión `pgcrypto` que no estaba declarada.

**Corrección**:
```sql
-- Añadido en línea 6
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- For gen_random_uuid()
```

### 2. **RLS Policies con auth.role() Incorrecto**
**Problema**: Las políticas RLS usaban `auth.role() = 'authenticated'` que es un patrón deprecated/incorrecto.

**Corrección**: Reemplazado por `auth.uid() IS NOT NULL` en:
- `modules` (línea ~90)
- `content_nodes` (línea ~430)

**Antes**:
```sql
USING (auth.role() = 'authenticated' AND is_active = TRUE);
```

**Después**:
```sql
USING (auth.uid() IS NOT NULL AND is_active = TRUE);
```

### 3. **Policy Faltante para embeddings (service_role)**
**Problema**: La tabla `embeddings` no tenía política explícita para `service_role`, solo comentarios.

**Corrección** (línea ~460):
```sql
CREATE POLICY "Service role full access"
    ON kuneo.embeddings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
```

### 4. **Triggers de updated_at Faltantes**
**Problema**: Solo `DEFAULT NOW()` en `updated_at`, sin actualización automática en `UPDATE`.

**Corrección** (línea ~800):
```sql
-- Función reutilizable
CREATE OR REPLACE FUNCTION kuneo.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers en 6 tablas
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON kuneo.profiles
    FOR EACH ROW
    EXECUTE FUNCTION kuneo.update_updated_at();

CREATE TRIGGER update_modules_updated_at...
CREATE TRIGGER update_sessions_updated_at...
CREATE TRIGGER update_module_progress_updated_at...
CREATE TRIGGER update_cognitive_profile_updated_at...
CREATE TRIGGER update_content_nodes_updated_at...
```

---

## ✨ Mejoras Aplicadas

### 5. **ENUMs para Tipos de Datos**
**Mejora**: Creados 3 ENUMs para prevenir inconsistencias:

```sql
-- Subject enum (en vez de TEXT)
CREATE TYPE kuneo.subject_enum AS ENUM (
    'matematicas',
    'lenguaje',
    'ciencias',
    'sociales',
    'ingles'
);

-- Dimension enum (para evaluaciones)
CREATE TYPE kuneo.dimension_enum AS ENUM (
    'comprension',
    'representacion',
    'razonamiento',
    'transferencia',
    'metacognicion'
);

-- Cognitive level enum (5 niveles de progresión)
CREATE TYPE kuneo.cognitive_level_enum AS ENUM (
    'explorador',     -- Nivel 1
    'constructor',    -- Nivel 2
    'analista',       -- Nivel 3
    'aplicador',      -- Nivel 4
    'autonomo'        -- Nivel 5
);
```

### 6. **Cognitive Profile Mejorado**
**Mejora**: Añadidos campos para sistema de niveles cognitivos:

```sql
CREATE TABLE kuneo.cognitive_profile (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- 5 dimensiones cognitivas (0-100)
    comprension INTEGER DEFAULT 50,
    representacion INTEGER DEFAULT 50,
    razonamiento INTEGER DEFAULT 50,
    transferencia INTEGER DEFAULT 50,
    metacognicion INTEGER DEFAULT 50,
    -- Nivel cognitivo general (1-5)
    cognitive_level kuneo.cognitive_level_enum DEFAULT 'explorador',
    -- Métricas
    total_evaluations INTEGER DEFAULT 0,
    total_modules_completed INTEGER DEFAULT 0,
    -- Historial de niveles (para ver progresión)
    level_history JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. **Evaluations con Rubric Levels**
**Mejora**: Sistema de micro-evidencias con niveles de rúbrica:

```sql
CREATE TABLE kuneo.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES kuneo.sessions(id) ON DELETE CASCADE,
    module_id UUID REFERENCES kuneo.modules(id) ON DELETE CASCADE NOT NULL,
    dimension kuneo.dimension_enum NOT NULL,
    -- Score por nivel de rubrica (1-5)
    rubric_level INTEGER NOT NULL CHECK (rubric_level BETWEEN 1 AND 5),
    score NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    -- Evidencia de la evaluación
    evidence JSONB DEFAULT '{}', -- {user_response, expected, error_type, signals, feedback}
    -- Contexto de la pregunta
    question_context JSONB DEFAULT '{}', -- {phase, difficulty, type}
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. **Estructura content_nodes Normalizada**
**Mejora**: JSONB con esquema consistente para integración con MEN/Colombia Aprende:

```sql
-- Estructura consistente del contenido
content JSONB NOT NULL, -- {
--   text: "Explicación del concepto",
--   definition: "Definición formal si aplica",
--   examples: [{description, solution, steps}],
--   exercises: [{question, expected_answer, hints, difficulty}],
--   competencies: [{standard_code: "MEN-MAT-6-2", description}],
--   metadata: {source_url, topic, subtopic, difficulty, reading_time_minutes}
-- }
```

### 9. **Módulos con 5 Fases Cognitivas**
**Mejora**: Sistema de módulos basado en 5 fases del desarrollo cognitivo:

```sql
structure JSONB NOT NULL, -- {
--   phases: [
--     {id: "exploracion", name, goal, dimension: "comprension"},
--     {id: "representacion", name, goal, dimension: "representacion"},
--     {id: "refinamiento", name, goal, dimension: "razonamiento"},
--     {id: "aplicacion", name, goal, dimension: "transferencia"},
--     {id: "metacognicion", name, goal, dimension: "metacognicion"}
--   ],
--   expected_outcomes: [],
--   linked_standards: ["MEN-CN-6-1"],
--   content_tags: [],
--   prerequisites: []
-- }
```

---

## 📦 Archivos Backend Actualizados

### **evaluationService.js**
- Sistema de micro-evidencias
- Evaluación por rúbrica (niveles 1-5)
- Feedback cualitativo sin calificaciones explícitas
- Agregación de evidencias por dimensión

### **progressService.js**
- 5 niveles cognitivos (Explorador → Autónomo)
- Cálculo de nivel basado en promedio de dimensiones
- Desbloqueo de módulos por dominio cognitivo
- Historial de niveles

### **decisionEngine.js**
- 5 fases del módulo (en vez de 3)
- Decisiones basadas en rubric_level y señales
- Progresión por dominio, no por puntos
- Estado del personaje por fase

### **promptBuilder.js**
- Evaluación invisible (sin "correcto"/"incorrecto")
- Preguntas socráticas por dimensión
- Adaptación por nivel cognitivo del estudiante
- Feedback cualitativo: "Veo que...", "Noté que..."

---

## 🔧 Estructura de Personajes Reorganizada

**Antes**: `public/lottie/tuko/idle.json`  
**Después**: `public/lottie/characters/tuko/idle.json`

**Archivos actualizados**:
- `shared/ui-schema/characterStates.js` - Rutas con parámetro `character`
- `apps/mobile/src/components/TukoCharacter.jsx` - Soporte extensible de personajes

**Documentación**: `public/lottie/characters/tuko/README.md`

---

## ✅ Checklist Pre-Ejecución

Antes de ejecutar en Supabase:

- [x] Extensión `pgcrypto` añadida
- [x] RLS policies corregidas (`auth.uid() IS NOT NULL`)
- [x] Policy de `service_role` para embeddings
- [x] Triggers de `updated_at` en 6 tablas
- [x] ENUMs creados (subject, dimension, cognitive_level)
- [x] `cognitive_profile` con nivel y historial
- [x] `evaluations` con `rubric_level` y micro-evidencias
- [x] `content_nodes` con estructura MEN normalizada
- [x] `modules` con 5 fases cognitivas
- [x] Función `update_cognitive_dimension` actualizada con niveles
- [x] Sample data actualizado con nueva estructura

---

## 🚀 Próximos Pasos

1. **Ejecutar schema.sql en Supabase**
   ```bash
   # Desde Supabase Dashboard → SQL Editor
   # Pegar contenido de schema.sql y ejecutar
   ```

2. **Verificar extensiones**
   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('pgcrypto', 'vector');
   ```

3. **Verificar políticas RLS**
   ```sql
   SELECT schemaname, tablename, policyname, roles
   FROM pg_policies
   WHERE schemaname = 'kuneo';
   ```

4. **Verificar triggers**
   ```sql
   SELECT trigger_name, event_manipulation, event_object_table
   FROM information_schema.triggers
   WHERE trigger_schema = 'kuneo';
   ```

5. **Probar backend con datos de ejemplo**
   ```bash
   cd backend
   npm run dev
   ```

---

## 📚 Referencias

- **Sistema de Evaluación**: Basado en investigación de Wiggins & McTighe (Understanding by Design)
- **Niveles Cognitivos**: Adaptado de taxonomía de Bloom revisada
- **Micro-evidencias**: Inspirado en sistemas de evaluación formativa invisible
- **Estándares MEN**: [Colombia Aprende](https://colombiaaprende.edu.co)

---

**Documento creado**: 2024  
**Versión schema**: 1.0.0 (con correcciones críticas)  
**Estado**: ✅ Listo para ejecución en Supabase
