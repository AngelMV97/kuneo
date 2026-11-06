-- =====================================================
-- KUNEO MOBILE APP - DATABASE SCHEMA
-- Supabase PostgreSQL with pgvector
-- Schema: kuneo (separate from Aula Nativa)
-- =====================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS kuneo;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- For gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;    -- For semantic search

-- Set search path
SET search_path TO kuneo, public;

-- =====================================================
-- ENUMS
-- =====================================================

-- Subject enum to prevent inconsistencies
CREATE TYPE kuneo.subject_enum AS ENUM (
    'matematicas',
    'lenguaje',
    'ciencias',
    'sociales',
    'ingles'
);

-- Cognitive dimension enum
CREATE TYPE kuneo.dimension_enum AS ENUM (
    'comprension',
    'representacion',
    'razonamiento',
    'transferencia',
    'metacognicion'
);

-- User cognitive level (1-5)
CREATE TYPE kuneo.cognitive_level_enum AS ENUM (
    'explorador',     -- Nivel 1: responde intuitivamente, necesita guía
    'constructor',    -- Nivel 2: empieza a explicar, usa representaciones
    'analista',       -- Nivel 3: conecta ideas, detecta errores
    'aplicador',      -- Nivel 4: transfiere a nuevos contextos
    'autonomo'        -- Nivel 5: razona sin guía, explica con claridad
);

-- =====================================================
-- 1. PROFILES TABLE
-- User profiles with basic information
-- =====================================================
CREATE TABLE kuneo.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 11),
    character_preference TEXT DEFAULT 'tuko',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar campo username
ALTER TABLE kuneo.profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Función RPC para actualizar username
CREATE OR REPLACE FUNCTION public.kuneo_update_username(
  p_user_id UUID,
  p_username TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE kuneo.profiles
  SET username = p_username,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'username', p_username
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.kuneo_update_username(UUID, TEXT) TO authenticated;

-- Drop existing function first (to allow changing return type)
DROP FUNCTION IF EXISTS public.kuneo_get_user_profile(UUID);

-- Función RPC para obtener el perfil del usuario
CREATE FUNCTION public.kuneo_get_user_profile(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  grade_level INTEGER,
  character_preference TEXT,
  onboarding_completed BOOLEAN,
  username TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.grade_level,
    p.character_preference,
    p.onboarding_completed,
    p.username,
    p.created_at,
    p.updated_at
  FROM kuneo.profiles p
  WHERE p.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kuneo_get_user_profile(UUID) TO authenticated;

COMMENT ON FUNCTION public.kuneo_get_user_profile IS 'Returns the complete Kuneo user profile including username';

-- RLS Policies for profiles
ALTER TABLE kuneo.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON kuneo.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON kuneo.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON kuneo.profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_profiles_user_id ON kuneo.profiles(user_id);

-- =====================================================
-- 2. MODULES TABLE
-- Learning modules (admin-loaded, student read-only)
-- =====================================================
CREATE TABLE kuneo.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject kuneo.subject_enum NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5), -- Nivel cognitivo
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 11), -- Contexto curricular
    structure JSONB NOT NULL, -- {phases: [], expected_outcomes: [], linked_standards: [], content_tags: []}
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for modules (read-only for students)
ALTER TABLE kuneo.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view active modules"
    ON kuneo.modules FOR SELECT
    USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- Indexes
CREATE INDEX idx_modules_subject ON kuneo.modules(subject);
CREATE INDEX idx_modules_grade_level ON kuneo.modules(grade_level);
CREATE INDEX idx_modules_difficulty ON kuneo.modules(difficulty);

-- =====================================================
-- 3. SESSIONS TABLE
-- Learning sessions (conversations with tutor)
-- =====================================================
CREATE TABLE kuneo.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES kuneo.modules(id) ON DELETE CASCADE NOT NULL,
    state JSONB DEFAULT '{}', -- {current_phase: "", steps_completed: [], context: {}}
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for sessions
ALTER TABLE kuneo.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
    ON kuneo.sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
    ON kuneo.sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON kuneo.sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_sessions_user_id ON kuneo.sessions(user_id);
CREATE INDEX idx_sessions_module_id ON kuneo.sessions(module_id);
CREATE INDEX idx_sessions_status ON kuneo.sessions(status);

-- =====================================================
-- 4. MESSAGES TABLE
-- Conversation history between user and tutor
-- =====================================================
CREATE TABLE kuneo.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES kuneo.sessions(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'tutor')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- {character_state: "", ui_elements: [], evaluation: {}}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for messages
ALTER TABLE kuneo.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their sessions"
    ON kuneo.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM kuneo.sessions
            WHERE sessions.id = messages.session_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to their sessions"
    ON kuneo.messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM kuneo.sessions
            WHERE sessions.id = messages.session_id
            AND sessions.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_messages_session_id ON kuneo.messages(session_id);
CREATE INDEX idx_messages_created_at ON kuneo.messages(created_at);

-- =====================================================
-- 5. MODULE_PROGRESS TABLE
-- Track user progress through modules
-- =====================================================
CREATE TABLE kuneo.module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES kuneo.modules(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    score NUMERIC(5,2), -- 0.00 to 100.00
    current_phase TEXT DEFAULT 'exploracion',
    time_spent_seconds INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

-- RLS Policies for module_progress
ALTER TABLE kuneo.module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
    ON kuneo.module_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
    ON kuneo.module_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON kuneo.module_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_module_progress_user_id ON kuneo.module_progress(user_id);
CREATE INDEX idx_module_progress_module_id ON kuneo.module_progress(module_id);
CREATE INDEX idx_module_progress_status ON kuneo.module_progress(status);

-- =====================================================
-- 6. COGNITIVE_PROFILE TABLE ⭐
-- User's cognitive dimensions (core differentiation)
-- Sistema de medición del proceso de pensamiento
-- =====================================================
CREATE TABLE kuneo.cognitive_profile (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- 5 dimensiones cognitivas (0-100)
    comprension INTEGER DEFAULT 50 CHECK (comprension BETWEEN 0 AND 100),
    representacion INTEGER DEFAULT 50 CHECK (representacion BETWEEN 0 AND 100),
    razonamiento INTEGER DEFAULT 50 CHECK (razonamiento BETWEEN 0 AND 100),
    transferencia INTEGER DEFAULT 50 CHECK (transferencia BETWEEN 0 AND 100),
    metacognicion INTEGER DEFAULT 50 CHECK (metacognicion BETWEEN 0 AND 100),
    -- Nivel cognitivo general (1-5)
    cognitive_level kuneo.cognitive_level_enum DEFAULT 'explorador',
    -- Métricas
    total_evaluations INTEGER DEFAULT 0,
    total_modules_completed INTEGER DEFAULT 0,
    -- Historial de niveles (para ver progresión)
    level_history JSONB DEFAULT '[]', -- [{level: 'explorador', achieved_at: '...'}]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for cognitive_profile
ALTER TABLE kuneo.cognitive_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cognitive profile"
    ON kuneo.cognitive_profile FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cognitive profile"
    ON kuneo.cognitive_profile FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cognitive profile"
    ON kuneo.cognitive_profile FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. EVALUATIONS TABLE ⭐
-- Micro-evidencias de evaluación por dimensión cognitiva
-- Evaluación invisible durante el proceso de aprendizaje
-- =====================================================
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
    evidence JSONB DEFAULT '{}', -- {user_response: "", expected: "", error_type: "", signals: [], feedback: ""}
    -- Contexto de la pregunta
    question_context JSONB DEFAULT '{}', -- {phase: "", difficulty: 0, type: ""}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for evaluations
ALTER TABLE kuneo.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own evaluations"
    ON kuneo.evaluations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evaluations"
    ON kuneo.evaluations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_evaluations_user_id ON kuneo.evaluations(user_id);
CREATE INDEX idx_evaluations_module_id ON kuneo.evaluations(module_id);
CREATE INDEX idx_evaluations_dimension ON kuneo.evaluations(dimension);
CREATE INDEX idx_evaluations_rubric_level ON kuneo.evaluations(rubric_level);
CREATE INDEX idx_evaluations_created_at ON kuneo.evaluations(created_at);

-- =====================================================
-- 8. RECOMMENDATIONS TABLE
-- System-generated recommendations for next steps
-- =====================================================
CREATE TABLE kuneo.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('module', 'icfes', 'review')),
    target_id UUID, -- module_id or other reference
    reason TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for recommendations
ALTER TABLE kuneo.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations"
    ON kuneo.recommendations FOR SELECT
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_recommendations_user_id ON kuneo.recommendations(user_id);
CREATE INDEX idx_recommendations_is_active ON kuneo.recommendations(is_active);

-- =====================================================
-- 9. ICFES_ATTEMPTS TABLE
-- ICFES mock test attempts and results
-- =====================================================
CREATE TABLE kuneo.icfes_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject kuneo.subject_enum NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    breakdown JSONB DEFAULT '{}', -- {by_competency: {}, by_difficulty: {}, time_per_question: [], cognitive_dimensions: {}}
    duration_seconds INTEGER,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for icfes_attempts
ALTER TABLE kuneo.icfes_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ICFES attempts"
    ON kuneo.icfes_attempts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ICFES attempts"
    ON kuneo.icfes_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_icfes_attempts_user_id ON kuneo.icfes_attempts(user_id);
CREATE INDEX idx_icfes_attempts_subject ON kuneo.icfes_attempts(subject);
CREATE INDEX idx_icfes_attempts_created_at ON kuneo.icfes_attempts(created_at);

-- =====================================================
-- 10. CONTENT_NODES TABLE
-- Educational content (admin-loaded MEN/Colombia Aprende)
-- Estructura normalizada para contenido del MEN
-- =====================================================
CREATE TABLE kuneo.content_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject kuneo.subject_enum NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 11),
    type TEXT NOT NULL CHECK (type IN ('concept', 'example', 'exercise', 'standard')),
    title TEXT NOT NULL,
    -- Estructura consistente del contenido
    content JSONB NOT NULL, -- {
    --   text: "Explicación del concepto",
    --   definition: "Definición formal si aplica",
    --   examples: [{description: "", solution: "", steps: []}],
    --   exercises: [{question: "", expected_answer: "", hints: [], difficulty: 0}],
    --   competencies: [{standard_code: "MEN-MAT-6-2", description: ""}],
    --   metadata: {source_url: "", topic: "", subtopic: ""}
    -- }
    source TEXT, -- 'MEN', 'Colombia Aprende', etc.
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for content_nodes (read-only for authenticated users)
ALTER TABLE kuneo.content_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active content"
    ON kuneo.content_nodes FOR SELECT
    USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- Indexes
CREATE INDEX idx_content_nodes_subject ON kuneo.content_nodes(subject);
CREATE INDEX idx_content_nodes_grade_level ON kuneo.content_nodes(grade_level);
CREATE INDEX idx_content_nodes_type ON kuneo.content_nodes(type);
CREATE INDEX idx_content_nodes_tags ON kuneo.content_nodes USING GIN(tags);

-- =====================================================
-- 11. EMBEDDINGS TABLE (PRIVATE)
-- Vector embeddings for RAG (service_role access only)
-- =====================================================
CREATE TABLE kuneo.embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES kuneo.content_nodes(id) ON DELETE CASCADE NOT NULL,
    content_text TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for embeddings (NO user access, service_role only)
ALTER TABLE kuneo.embeddings ENABLE ROW LEVEL SECURITY;

-- Explicit policy for service_role
CREATE POLICY "Service role full access"
    ON kuneo.embeddings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- No policies for regular users - only service_role can access

-- Indexes for vector similarity search
CREATE INDEX idx_embeddings_content_id ON kuneo.embeddings(content_id);
CREATE INDEX idx_embeddings_vector ON kuneo.embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- =====================================================
-- 12. STUDENT_ACTIVITY TABLE
-- Analytics and event tracking
-- =====================================================
CREATE TABLE kuneo.student_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL, -- 'session_start', 'message_sent', 'module_complete', etc.
    payload JSONB DEFAULT '{}', -- {module_id: "", duration: 0, metadata: {}}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for student_activity
ALTER TABLE kuneo.student_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity"
    ON kuneo.student_activity FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
    ON kuneo.student_activity FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_student_activity_user_id ON kuneo.student_activity(user_id);
CREATE INDEX idx_student_activity_event_type ON kuneo.student_activity(event_type);
CREATE INDEX idx_student_activity_created_at ON kuneo.student_activity(created_at);

-- =====================================================
-- 13. COMPETENCY_UNITS TABLE
-- Normalized curriculum units (DBAs + Standards) with embeddings
-- =====================================================
CREATE TABLE kuneo.competency_units (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'competency_unit',
    source TEXT NOT NULL CHECK (source IN ('dba', 'standard')),
    subject TEXT NOT NULL,
    grade_range TEXT NOT NULL,
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    content JSONB NOT NULL DEFAULT '{}',
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- JSONB structure for content field:
-- {
--   "competency": "...",
--   "evidence": ["...", "..."],
--   "example": "...",
--   "concepts": ["...", "..."],
--   "misconceptions": ["...", "..."],
--   "metadata": {
--     "dba_number": 1,           // for DBAs
--     "structure_mode": "math",  // for standards
--     "axis": "...",             // for standards
--     "axis_name": "...",        // for standards
--     "subaxis": "...",          // for standards (science mode)
--     "process": "...",          // for standards (science mode, naturales 10-11)
--     "division": "..."          // for standards (science mode, sociales 10-11)
--   }
-- }

-- RLS Policies for competency_units
ALTER TABLE kuneo.competency_units ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all competency units (for semantic search)
CREATE POLICY "Authenticated users can view all competency units"
    ON kuneo.competency_units FOR SELECT
    TO authenticated
    USING (true);

-- Service role has full access (for bulk operations)
CREATE POLICY "Service role full access"
    ON kuneo.competency_units
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- No INSERT/UPDATE/DELETE for regular users - only service role

-- Indexes for efficient queries
CREATE INDEX idx_competency_units_source ON kuneo.competency_units(source);
CREATE INDEX idx_competency_units_subject ON kuneo.competency_units(subject);
CREATE INDEX idx_competency_units_grade_range ON kuneo.competency_units(grade_range);
CREATE INDEX idx_competency_units_difficulty ON kuneo.competency_units(difficulty);

-- JSONB indexes for content queries
CREATE INDEX idx_competency_units_content_gin ON kuneo.competency_units USING gin(content);
CREATE INDEX idx_competency_units_concepts ON kuneo.competency_units USING gin((content->'concepts'));
CREATE INDEX idx_competency_units_metadata ON kuneo.competency_units USING gin((content->'metadata'));

-- Vector similarity search index (HNSW is faster than IVFFlat for most workloads)
CREATE INDEX idx_competency_units_embedding_hnsw ON kuneo.competency_units 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Alternative: IVFFlat index (uncomment if you prefer IVFFlat)
-- CREATE INDEX idx_competency_units_embedding_ivfflat ON kuneo.competency_units 
--     USING ivfflat (embedding vector_cosine_ops)
--     WITH (lists = 100);

-- =====================================================
-- RPC FUNCTION: Search competency units by semantic similarity
-- =====================================================
CREATE OR REPLACE FUNCTION kuneo.search_competency_units(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 10,
    filter_subject TEXT DEFAULT NULL,
    filter_grade_range TEXT DEFAULT NULL,
    filter_difficulty INT DEFAULT NULL,
    filter_source TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    source TEXT,
    subject TEXT,
    grade_range TEXT,
    difficulty INT,
    content JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cu.id,
        cu.type,
        cu.source,
        cu.subject,
        cu.grade_range,
        cu.difficulty,
        cu.content,
        1 - (cu.embedding <=> query_embedding) AS similarity
    FROM kuneo.competency_units cu
    WHERE
        (cu.embedding IS NOT NULL)
        AND (1 - (cu.embedding <=> query_embedding) > match_threshold)
        AND (filter_subject IS NULL OR cu.subject = filter_subject)
        AND (filter_grade_range IS NULL OR cu.grade_range = filter_grade_range)
        AND (filter_difficulty IS NULL OR cu.difficulty = filter_difficulty)
        AND (filter_source IS NULL OR cu.source = filter_source)
    ORDER BY cu.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION kuneo.search_competency_units(vector, FLOAT, INT, TEXT, TEXT, INT, TEXT) TO authenticated;

-- =====================================================
-- RPC FUNCTION: Get competency units by filters (without semantic search)
-- =====================================================
CREATE OR REPLACE FUNCTION kuneo.get_competency_units(
    filter_subject TEXT DEFAULT NULL,
    filter_grade_range TEXT DEFAULT NULL,
    filter_difficulty INT DEFAULT NULL,
    filter_source TEXT DEFAULT NULL,
    limit_count INT DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    source TEXT,
    subject TEXT,
    grade_range TEXT,
    difficulty INT,
    content JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cu.id,
        cu.type,
        cu.source,
        cu.subject,
        cu.grade_range,
        cu.difficulty,
        cu.content
    FROM kuneo.competency_units cu
    WHERE
        (filter_subject IS NULL OR cu.subject = filter_subject)
        AND (filter_grade_range IS NULL OR cu.grade_range = filter_grade_range)
        AND (filter_difficulty IS NULL OR cu.difficulty = filter_difficulty)
        AND (filter_source IS NULL OR cu.source = filter_source)
    ORDER BY cu.created_at DESC
    LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION kuneo.get_competency_units(TEXT, TEXT, INT, TEXT, INT) TO authenticated;

-- =====================================================
-- UPDATED_AT TRIGGERS
-- Actualiza automáticamente updated_at en cada UPDATE
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION kuneo.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON kuneo.profiles
    FOR EACH ROW
    EXECUTE FUNCTION kuneo.update_updated_at();

CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON kuneo.modules
    FOR EACH ROW
    EXECUTE FUNCTION kuneo.update_updated_at();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON kuneo.sessions
    FOR EACH ROW
    EXECUTE FUNCTION kuneo.update_updated_at();

CREATE TRIGGER update_module_progress_updated_at
    BEFORE UPDATE ON kuneo.module_progress
    FOR EACH ROW
    EXECUTE FUNCTION kuneo.update_updated_at();

CREATE TRIGGER update_cognitive_profile_updated_at
    BEFORE UPDATE ON kuneo.cognitive_profile
    FOR EACH ROW
    EXECUTE FUNCTION kuneo.update_updated_at();

CREATE TRIGGER update_content_nodes_updated_at
    BEFORE UPDATE ON kuneo.content_nodes
    FOR EACH ROW
    EXECUTE FUNCTION kuneo.update_updated_at();

-- =====================================================
-- FUNCTIONS
-- Helper functions for common operations
-- =====================================================

-- Function to update cognitive profile based on evaluations
CREATE OR REPLACE FUNCTION kuneo.update_cognitive_dimension(
    p_user_id UUID,
    p_dimension kuneo.dimension_enum,
    p_score NUMERIC,
    p_rubric_level INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_current_value INTEGER;
    v_total_evals INTEGER;
    v_new_value INTEGER;
    v_avg_score NUMERIC;
    v_new_level kuneo.cognitive_level_enum;
BEGIN
    -- Get current values
    SELECT 
        CASE p_dimension
            WHEN 'comprension' THEN comprension
            WHEN 'representacion' THEN representacion
            WHEN 'razonamiento' THEN razonamiento
            WHEN 'transferencia' THEN transferencia
            WHEN 'metacognicion' THEN metacognicion
        END,
        total_evaluations
    INTO v_current_value, v_total_evals
    FROM kuneo.cognitive_profile
    WHERE user_id = p_user_id;

    -- Calculate weighted average (current weight: 70%, new score: 30%)
    v_new_value := ROUND((v_current_value * 0.7) + (p_score * 0.3));

    -- Update the specific dimension
    UPDATE kuneo.cognitive_profile
    SET 
        comprension = CASE WHEN p_dimension = 'comprension' THEN v_new_value ELSE comprension END,
        representacion = CASE WHEN p_dimension = 'representacion' THEN v_new_value ELSE representacion END,
        razonamiento = CASE WHEN p_dimension = 'razonamiento' THEN v_new_value ELSE razonamiento END,
        transferencia = CASE WHEN p_dimension = 'transferencia' THEN v_new_value ELSE transferencia END,
        metacognicion = CASE WHEN p_dimension = 'metacognicion' THEN v_new_value ELSE metacognicion END,
        total_evaluations = v_total_evals + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Calculate overall average and update cognitive level
    SELECT 
        (comprension + representacion + razonamiento + transferencia + metacognicion) / 5.0
    INTO v_avg_score
    FROM kuneo.cognitive_profile
    WHERE user_id = p_user_id;

    -- Determine cognitive level based on average score
    v_new_level := CASE
        WHEN v_avg_score < 40 THEN 'explorador'
        WHEN v_avg_score < 55 THEN 'constructor'
        WHEN v_avg_score < 70 THEN 'analista'
        WHEN v_avg_score < 85 THEN 'aplicador'
        ELSE 'autonomo'
    END;

    -- Update cognitive level if changed
    UPDATE kuneo.cognitive_profile
    SET cognitive_level = v_new_level
    WHERE user_id = p_user_id AND cognitive_level != v_new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- Insert sample module (Gravity basics) con 5 fases del sistema
INSERT INTO kuneo.modules (subject, title, description, difficulty, grade_level, structure, order_index) VALUES
(
    'ciencias',
    'Gravedad: Conceptos Básicos',
    'Explora qué es la gravedad y cómo afecta a los objetos en la Tierra',
    2,
    6,
    '{
        "phases": [
            {"id": "exploracion", "name": "Exploración", "goal": "Entender qué es la gravedad", "dimension": "comprension"},
            {"id": "representacion", "name": "Representación", "goal": "Modelar fenómenos gravitacionales", "dimension": "representacion"},
            {"id": "refinamiento", "name": "Refinamiento", "goal": "Razonar sobre la gravedad", "dimension": "razonamiento"},
            {"id": "aplicacion", "name": "Aplicación", "goal": "Transferir a nuevos contextos", "dimension": "transferencia"},
            {"id": "metacognicion", "name": "Metacognición", "goal": "Reflexionar sobre lo aprendido", "dimension": "metacognicion"}
        ],
        "expected_outcomes": [
            "Definir gravedad con sus propias palabras",
            "Explicar por qué los objetos caen",
            "Relacionar masa y fuerza de gravedad",
            "Aplicar concepto en situaciones reales"
        ],
        "linked_standards": ["MEN-CN-6-1"],
        "content_tags": ["fisica", "gravedad", "fuerzas"],
        "prerequisites": []
    }',
    1
);

-- Insert sample content node con estructura MEN normalizada
INSERT INTO kuneo.content_nodes (subject, grade_level, type, title, content, source, tags) VALUES
(
    'ciencias',
    6,
    'concept',
    'La Gravedad',
    '{
        "text": "La gravedad es la fuerza de atracción que ejerce la Tierra sobre todos los objetos. Es la razón por la cual las cosas caen al suelo cuando las soltamos. La gravedad depende de la masa: mientras más masa tiene un objeto, mayor es su fuerza de gravedad.",
        "definition": "Fuerza de atracción universal que actúa entre todos los objetos con masa.",
        "examples": [
            {
                "description": "Cuando sueltas una pelota, cae al suelo por la gravedad",
                "solution": "La Tierra atrae la pelota hacia su centro",
                "steps": ["Sueltas la pelota", "La gravedad actúa", "La pelota acelera hacia el suelo"]
            },
            {
                "description": "La Luna orbita la Tierra debido a la gravedad terrestre",
                "solution": "La gravedad mantiene a la Luna en órbita",
                "steps": []
            }
        ],
        "exercises": [
            {
                "question": "¿Por qué los objetos caen al suelo?",
                "expected_answer": "Por la fuerza de gravedad que ejerce la Tierra",
                "hints": ["Piensa en qué fuerza actúa sobre los objetos", "¿Qué tiene la Tierra que atrae los objetos?"],
                "difficulty": 2
            }
        ],
        "competencies": [
            {
                "standard_code": "MEN-CN-6-1",
                "description": "Explica la acción de fuerzas en sistemas físicos"
            }
        ],
        "metadata": {
            "source_url": "https://colombiaaprende.edu.co",
            "topic": "Física",
            "subtopic": "Fuerzas y movimiento",
            "difficulty": 2,
            "reading_time_minutes": 3
        }
    }',
    'MEN',
    ARRAY['fisica', 'gravedad', 'fuerzas']
);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA kuneo TO authenticated;
GRANT ALL ON SCHEMA kuneo TO service_role;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA kuneo TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kuneo TO service_role;

-- Grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA kuneo TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kuneo TO service_role;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify the schema was created correctly
-- =====================================================

/*
-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'kuneo' 
ORDER BY table_name;

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'kuneo'
ORDER BY tablename, policyname;

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'kuneo'
ORDER BY tablename, indexname;

-- Verify extensions
SELECT * FROM pg_extension WHERE extname IN ('pgcrypto', 'vector');

-- Verify triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'kuneo';
*/

-- =====================================================
-- END OF SCHEMA
-- =====================================================
