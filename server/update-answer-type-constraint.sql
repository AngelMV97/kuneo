-- Script SQL para actualizar el constraint de answer_type
-- Ejecutar esto en Supabase SQL Editor

-- Paso 1: Ver qué tipos de answer_type existen actualmente
SELECT DISTINCT answer_type, COUNT(*) as count
FROM kuneo.student_step_attempts
GROUP BY answer_type
ORDER BY answer_type;

-- Paso 2: Eliminar el constraint existente
ALTER TABLE kuneo.student_step_attempts 
DROP CONSTRAINT IF EXISTS student_step_attempts_answer_type_check;

-- Paso 3: Crear el nuevo constraint SIN VALIDAR las filas existentes
-- Esto permite que filas antiguas se mantengan, pero nuevas filas deben cumplir el constraint
ALTER TABLE kuneo.student_step_attempts 
ADD CONSTRAINT student_step_attempts_answer_type_check 
CHECK (answer_type IN (
  'option', 
  'text', 
  'numeric', 
  'keywords',
  'multiple_select',
  'matching',
  'ordering'
)) NOT VALID;

-- Paso 4: Validar el constraint para filas futuras (esto es opcional)
-- Solo descomenta esta línea si quieres que valide también las filas existentes
-- ALTER TABLE kuneo.student_step_attempts VALIDATE CONSTRAINT student_step_attempts_answer_type_check;

-- Paso 5: Verificar que se creó correctamente
SELECT conname, pg_get_constraintdef(oid), convalidated
FROM pg_constraint 
WHERE conrelid = 'kuneo.student_step_attempts'::regclass 
  AND conname = 'student_step_attempts_answer_type_check';
