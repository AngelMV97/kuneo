-- ============================================
-- ADAPTIVE ENGINE MVP - DATABASE SCHEMA
-- ============================================
-- Tablas para Sistema de Progresión y Evaluación Cognitiva
-- Fecha: 2026-05-18
-- ============================================

-- Deshabilitar RLS temporalmente
ALTER TABLE IF EXISTS kuneo.student_step_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kuneo.student_module_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kuneo.student_cognitive_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kuneo.student_taxonomy_mastery DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kuneo.student_recommendations DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. STUDENT_STEP_ATTEMPTS
-- ============================================
-- Registro de cada intento del usuario en un step
-- Esto es la evidencia más granular de aprendizaje

DROP TABLE IF EXISTS kuneo.student_step_attempts CASCADE;

CREATE TABLE kuneo.student_step_attempts (
  attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES kuneo.modules(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES kuneo.module_steps(id) ON DELETE CASCADE,
  
  -- Respuesta del usuario
  answer TEXT NOT NULL,
  answer_type TEXT CHECK (answer_type IN ('text', 'option', 'numeric', 'drawing', 'reflection')),
  
  -- Evaluación
  result TEXT NOT NULL CHECK (result IN ('correct', 'incorrect', 'partial', 'skipped')),
  misconception_key TEXT, -- ej: 'confunde_numerador_denominador'
  cognitive_dimension TEXT NOT NULL CHECK (cognitive_dimension IN ('comprension', 'representacion', 'razonamiento', 'transferencia', 'metacognicion')),
  
  -- Contexto del intento
  attempt_number INT NOT NULL DEFAULT 1 CHECK (attempt_number > 0),
  time_on_task INT CHECK (time_on_task >= 0), -- segundos
  hint_requests INT DEFAULT 0 CHECK (hint_requests >= 0),
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  
  -- Intervención aplicada por Adaptive Engine
  intervention_type TEXT CHECK (intervention_type IN ('none', 'hint', 'card', 'visual', 'remedial', 'silence')),
  card_variant TEXT CHECK (card_variant IN ('basic', 'hint', 'corrective', 'reflective', 'deepening')),
  visual_overlay TEXT, -- 'hint', 'corrective', misconception-specific, null
  tuko_showed BOOLEAN DEFAULT false,
  tuko_state TEXT CHECK (tuko_state IN ('neutral', 'hint', 'encourage', 'correct', 'thinking')),
  
  -- Mastery delta aplicado
  mastery_delta DECIMAL(4,2) DEFAULT 0 CHECK (mastery_delta BETWEEN -1 AND 1), -- -0.10 a +0.12
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, step_id, attempt_number)
);

-- Índices para performance
CREATE INDEX idx_attempts_user_module ON kuneo.student_step_attempts(user_id, module_id);
CREATE INDEX idx_attempts_step ON kuneo.student_step_attempts(step_id);
CREATE INDEX idx_attempts_result ON kuneo.student_step_attempts(result);
CREATE INDEX idx_attempts_misconception ON kuneo.student_step_attempts(misconception_key) WHERE misconception_key IS NOT NULL;
CREATE INDEX idx_attempts_created ON kuneo.student_step_attempts(created_at DESC);

COMMENT ON TABLE kuneo.student_step_attempts IS 'Registro de cada intento de respuesta del usuario en module_steps. Base para evaluación cognitiva.';
COMMENT ON COLUMN kuneo.student_step_attempts.mastery_delta IS 'Delta aplicado a la dimensión cognitiva correspondiente (-0.10 a +0.12)';

-- ============================================
-- 2. STUDENT_MODULE_PROGRESS
-- ============================================
-- Progreso del usuario en cada módulo
-- Vista agregada de todos los attempts en ese módulo

DROP TABLE IF EXISTS kuneo.student_module_progress CASCADE;

CREATE TABLE kuneo.student_module_progress (
  progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES kuneo.modules(id) ON DELETE CASCADE,
  
  -- Estado del módulo
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered')),
  current_step_id UUID REFERENCES kuneo.module_steps(id),
  current_step_order INT,
  steps_completed INT DEFAULT 0 CHECK (steps_completed >= 0),
  total_steps INT NOT NULL CHECK (total_steps > 0),
  
  -- Progreso cognitivo en este módulo (0-100)
  comprension_score DECIMAL(5,2) DEFAULT 50 CHECK (comprension_score BETWEEN 0 AND 100),
  representacion_score DECIMAL(5,2) DEFAULT 50 CHECK (representacion_score BETWEEN 0 AND 100),
  razonamiento_score DECIMAL(5,2) DEFAULT 50 CHECK (razonamiento_score BETWEEN 0 AND 100),
  transferencia_score DECIMAL(5,2) DEFAULT 50 CHECK (transferencia_score BETWEEN 0 AND 100),
  metacognicion_score DECIMAL(5,2) DEFAULT 50 CHECK (metacognicion_score BETWEEN 0 AND 100),
  
  -- Métricas del módulo
  total_attempts INT DEFAULT 0 CHECK (total_attempts >= 0),
  correct_attempts INT DEFAULT 0 CHECK (correct_attempts >= 0),
  hints_used INT DEFAULT 0 CHECK (hints_used >= 0),
  avg_time_per_step INT, -- segundos promedio
  
  -- Misconceptions detectados en este módulo
  detected_misconceptions JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, module_id),
  
  CONSTRAINT check_correct_attempts CHECK (correct_attempts <= total_attempts),
  CONSTRAINT check_steps_completed CHECK (steps_completed <= total_steps)
);

-- Índices
CREATE INDEX idx_progress_user ON kuneo.student_module_progress(user_id);
CREATE INDEX idx_progress_status ON kuneo.student_module_progress(status);
CREATE INDEX idx_progress_module ON kuneo.student_module_progress(module_id);
CREATE INDEX idx_progress_last_activity ON kuneo.student_module_progress(last_activity_at DESC);

COMMENT ON TABLE kuneo.student_module_progress IS 'Progreso agregado del usuario en cada módulo. Calcula scores de 5 dimensiones cognitivas.';
COMMENT ON COLUMN kuneo.student_module_progress.detected_misconceptions IS 'Array de misconception_keys detectados durante el módulo';

-- ============================================
-- 3. STUDENT_COGNITIVE_PROFILE
-- ============================================
-- Perfil cognitivo global del usuario
-- Agregación de todos los módulos completados

DROP TABLE IF EXISTS kuneo.student_cognitive_profile CASCADE;

CREATE TABLE kuneo.student_cognitive_profile (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- 5 Dimensiones cognitivas globales (0-100)
  comprension DECIMAL(5,2) DEFAULT 50 CHECK (comprension BETWEEN 0 AND 100),
  representacion DECIMAL(5,2) DEFAULT 50 CHECK (representacion BETWEEN 0 AND 100),
  razonamiento DECIMAL(5,2) DEFAULT 50 CHECK (razonamiento BETWEEN 0 AND 100),
  transferencia DECIMAL(5,2) DEFAULT 50 CHECK (transferencia BETWEEN 0 AND 100),
  metacognicion DECIMAL(5,2) DEFAULT 50 CHECK (metacognicion BETWEEN 0 AND 100),
  
  -- Etapa del usuario (1-5)
  -- 1: Explorador, 2: Constructor, 3: Analista, 4: Aplicador, 5: Autónomo
  stage INT DEFAULT 1 CHECK (stage BETWEEN 1 AND 5),
  stage_progress DECIMAL(5,2) DEFAULT 0 CHECK (stage_progress BETWEEN 0 AND 100), -- progreso dentro de la etapa actual
  
  -- Métricas globales
  total_modules_started INT DEFAULT 0 CHECK (total_modules_started >= 0),
  total_modules_completed INT DEFAULT 0 CHECK (total_modules_completed >= 0),
  total_modules_mastered INT DEFAULT 0 CHECK (total_modules_mastered >= 0),
  total_steps_completed INT DEFAULT 0 CHECK (total_steps_completed >= 0),
  total_correct_responses INT DEFAULT 0 CHECK (total_correct_responses >= 0),
  total_attempts INT DEFAULT 0 CHECK (total_attempts >= 0),
  
  -- Accuracy global
  accuracy_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_attempts > 0 THEN (total_correct_responses::decimal / total_attempts * 100)
      ELSE 0
    END
  ) STORED,
  
  -- Patterns detectados (JSONB arrays)
  common_misconceptions JSONB DEFAULT '[]'::jsonb, -- misconceptions más frecuentes
  strong_topics JSONB DEFAULT '[]'::jsonb,         -- microtopic_codes con mastery > 75
  weak_topics JSONB DEFAULT '[]'::jsonb,           -- microtopic_codes con mastery < 40
  
  -- Preferencias de aprendizaje detectadas
  prefers_visual BOOLEAN DEFAULT true,
  prefers_textual BOOLEAN DEFAULT true,
  responds_to_hints BOOLEAN DEFAULT true, -- si los hints mejoran su performance
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_modules_completed CHECK (total_modules_completed <= total_modules_started),
  CONSTRAINT check_modules_mastered CHECK (total_modules_mastered <= total_modules_completed)
);

-- Índices
CREATE INDEX idx_profile_user ON kuneo.student_cognitive_profile(user_id);
CREATE INDEX idx_profile_stage ON kuneo.student_cognitive_profile(stage);
CREATE INDEX idx_profile_updated ON kuneo.student_cognitive_profile(updated_at DESC);

COMMENT ON TABLE kuneo.student_cognitive_profile IS 'Perfil cognitivo global del usuario. Representa desarrollo del pensamiento a través de 5 dimensiones.';
COMMENT ON COLUMN kuneo.student_cognitive_profile.stage IS '1: Explorador, 2: Constructor, 3: Analista, 4: Aplicador, 5: Autónomo';
COMMENT ON COLUMN kuneo.student_cognitive_profile.accuracy_rate IS 'Porcentaje de respuestas correctas (calculado automáticamente)';

-- ============================================
-- 4. STUDENT_TAXONOMY_MASTERY
-- ============================================
-- Mastery del usuario por microtopic
-- Conecta progreso con taxonomías

DROP TABLE IF EXISTS kuneo.student_taxonomy_mastery CASCADE;

CREATE TABLE kuneo.student_taxonomy_mastery (
  mastery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  microtopic_code TEXT NOT NULL, -- ej: 'MAT-NUM-001' (referencia a taxonomy.microtopics)
  
  -- Mastery score global del microtopic (0-100)
  mastery_level DECIMAL(5,2) DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 100),
  evidences_count INT DEFAULT 0 CHECK (evidences_count >= 0), -- cuántas veces trabajó este microtopic
  
  -- Dimensiones por microtopic (0-100)
  comprension_level DECIMAL(5,2) DEFAULT 0 CHECK (comprension_level BETWEEN 0 AND 100),
  representacion_level DECIMAL(5,2) DEFAULT 0 CHECK (representacion_level BETWEEN 0 AND 100),
  razonamiento_level DECIMAL(5,2) DEFAULT 0 CHECK (razonamiento_level BETWEEN 0 AND 100),
  transferencia_level DECIMAL(5,2) DEFAULT 0 CHECK (transferencia_level BETWEEN 0 AND 100),
  
  -- Status del microtopic
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'introduced', 'practicing', 'mastered')),
  
  -- Misconceptions asociados a este microtopic
  related_misconceptions JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_practiced_at TIMESTAMPTZ DEFAULT NOW(),
  mastered_at TIMESTAMPTZ, -- cuando alcanzó mastery >= 80
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, microtopic_code)
);

-- Índices
CREATE INDEX idx_mastery_user ON kuneo.student_taxonomy_mastery(user_id);
CREATE INDEX idx_mastery_microtopic ON kuneo.student_taxonomy_mastery(microtopic_code);
CREATE INDEX idx_mastery_level ON kuneo.student_taxonomy_mastery(mastery_level DESC);
CREATE INDEX idx_mastery_status ON kuneo.student_taxonomy_mastery(status);
CREATE INDEX idx_mastery_last_practiced ON kuneo.student_taxonomy_mastery(last_practiced_at DESC);

COMMENT ON TABLE kuneo.student_taxonomy_mastery IS 'Mastery del usuario por microtopic. Conecta progreso con sistema de taxonomías.';
COMMENT ON COLUMN kuneo.student_taxonomy_mastery.evidences_count IS 'Número de módulos/steps que trabajaron este microtopic';
COMMENT ON COLUMN kuneo.student_taxonomy_mastery.mastered_at IS 'Timestamp cuando mastery_level alcanzó 80% o más';

-- ============================================
-- 5. STUDENT_RECOMMENDATIONS
-- ============================================
-- Recomendaciones generadas por Adaptive Engine
-- Basadas en weak topics, patterns, progresión natural

DROP TABLE IF EXISTS kuneo.student_recommendations CASCADE;

CREATE TABLE kuneo.student_recommendations (
  recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Qué se recomienda
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('next_module', 'remedial_module', 'microtopic_review', 'skill_practice', 'transfer_challenge')),
  target_module_id UUID REFERENCES kuneo.modules(id),
  target_microtopic TEXT, -- código del microtopic
  target_discipline TEXT, -- 'matematicas', 'ciencias', etc.
  
  -- Por qué se recomienda
  reason TEXT NOT NULL, -- 'low_transferencia', 'weak_microtopic', 'natural_progression', 'misconception_remediation'
  reason_details JSONB, -- datos específicos que generaron la recomendación
  
  -- Prioridad (1: más alta, 5: más baja)
  priority INT DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  
  -- Metadata
  based_on_evidence JSONB, -- qué attempts/modules llevaron a esta recomendación
  expected_benefit TEXT, -- qué dimensión cognitiva se espera mejorar
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'dismissed', 'completed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'), -- recomendaciones caducan
  
  CONSTRAINT check_valid_target CHECK (
    (recommendation_type IN ('next_module', 'remedial_module') AND target_module_id IS NOT NULL)
    OR
    (recommendation_type IN ('microtopic_review', 'skill_practice') AND target_microtopic IS NOT NULL)
    OR
    (recommendation_type = 'transfer_challenge')
  )
);

-- Índices
CREATE INDEX idx_recommendations_user ON kuneo.student_recommendations(user_id);
CREATE INDEX idx_recommendations_status ON kuneo.student_recommendations(status);
CREATE INDEX idx_recommendations_priority ON kuneo.student_recommendations(priority);
CREATE INDEX idx_recommendations_type ON kuneo.student_recommendations(recommendation_type);
CREATE INDEX idx_recommendations_expires ON kuneo.student_recommendations(expires_at);

COMMENT ON TABLE kuneo.student_recommendations IS 'Recomendaciones adaptativas generadas por el Adaptive Engine basadas en progreso y patrones detectados.';
COMMENT ON COLUMN kuneo.student_recommendations.priority IS '1: más urgente, 5: menos urgente';
COMMENT ON COLUMN kuneo.student_recommendations.expires_at IS 'Recomendaciones caducan después de 30 días si no se aceptan';

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- student_step_attempts
ALTER TABLE kuneo.student_step_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own attempts" ON kuneo.student_step_attempts;
CREATE POLICY "Users can view own attempts"
ON kuneo.student_step_attempts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own attempts" ON kuneo.student_step_attempts;
CREATE POLICY "Users can insert own attempts"
ON kuneo.student_step_attempts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- student_module_progress
ALTER TABLE kuneo.student_module_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON kuneo.student_module_progress;
CREATE POLICY "Users can view own progress"
ON kuneo.student_module_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own progress" ON kuneo.student_module_progress;
CREATE POLICY "Users can manage own progress"
ON kuneo.student_module_progress
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- student_cognitive_profile
ALTER TABLE kuneo.student_cognitive_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON kuneo.student_cognitive_profile;
CREATE POLICY "Users can view own profile"
ON kuneo.student_cognitive_profile
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own profile" ON kuneo.student_cognitive_profile;
CREATE POLICY "Users can manage own profile"
ON kuneo.student_cognitive_profile
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- student_taxonomy_mastery
ALTER TABLE kuneo.student_taxonomy_mastery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own mastery" ON kuneo.student_taxonomy_mastery;
CREATE POLICY "Users can view own mastery"
ON kuneo.student_taxonomy_mastery
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own mastery" ON kuneo.student_taxonomy_mastery;
CREATE POLICY "Users can manage own mastery"
ON kuneo.student_taxonomy_mastery
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- student_recommendations
ALTER TABLE kuneo.student_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recommendations" ON kuneo.student_recommendations;
CREATE POLICY "Users can view own recommendations"
ON kuneo.student_recommendations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recommendations" ON kuneo.student_recommendations;
CREATE POLICY "Users can update own recommendations"
ON kuneo.student_recommendations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCIONES HELPER
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION kuneo.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_module_progress_updated_at ON kuneo.student_module_progress;
CREATE TRIGGER update_module_progress_updated_at
BEFORE UPDATE ON kuneo.student_module_progress
FOR EACH ROW
EXECUTE FUNCTION kuneo.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cognitive_profile_updated_at ON kuneo.student_cognitive_profile;
CREATE TRIGGER update_cognitive_profile_updated_at
BEFORE UPDATE ON kuneo.student_cognitive_profile
FOR EACH ROW
EXECUTE FUNCTION kuneo.update_updated_at_column();

DROP TRIGGER IF EXISTS update_taxonomy_mastery_updated_at ON kuneo.student_taxonomy_mastery;
CREATE TRIGGER update_taxonomy_mastery_updated_at
BEFORE UPDATE ON kuneo.student_taxonomy_mastery
FOR EACH ROW
EXECUTE FUNCTION kuneo.update_updated_at_column();

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'kuneo' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'kuneo'
  AND table_name IN (
    'student_step_attempts',
    'student_module_progress',
    'student_cognitive_profile',
    'student_taxonomy_mastery',
    'student_recommendations'
  )
ORDER BY table_name;

-- Contar índices creados
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'kuneo'
  AND tablename IN (
    'student_step_attempts',
    'student_module_progress',
    'student_cognitive_profile',
    'student_taxonomy_mastery',
    'student_recommendations'
  )
ORDER BY tablename, indexname;
