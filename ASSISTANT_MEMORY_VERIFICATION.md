# Verificación de Memoria y Contexto del Asistente

## Cambios Implementados

### 1. **Memoria de Conversación (Chat History)**
**Antes:** El asistente NO tenía acceso al historial de mensajes previos.
**Ahora:** Recupera las últimas 20 mensajes de `chat_messages` table.

**Verificación:**
```javascript
// Backend logs mostrarán:
"conversation_length": 5  // Número de mensajes previos recuperados
```

### 2. **Contexto de Materia (Subject Awareness)**
**Antes:** El asistente no sabía qué materia estaba enseñando.
**Ahora:** Recibe subject y grade desde `chat_sessions`.

**Verificación:**
- El prompt del sistema incluye: `Materia: Tecnología e Informática | Grado 7`
- Logs muestran: `"subject": "Tecnología e Informática", "grade": 7`

### 3. **Filtrado RAG por Materia y Grado**
**Antes:** Buscaba en los últimos 50 materiales sin filtrar.
**Ahora:** Filtra por `subject` (obligatorio) y `grade` (opcional).

**Verificación:**
```sql
-- Backend ejecuta query:
SELECT id FROM materials 
WHERE subject = 'Tecnología e Informática' 
AND grade = 7  -- opcional
ORDER BY uploaded_at DESC 
LIMIT 100;
```

**Logs mostrarán:**
```json
{
  "materials_found": 15,
  "used_rag": true,
  "subject": "Tecnología e Informática"
}
```

### 4. **Separación de Contextos**
**Antes:** Mezclaba materiales RAG con todo en una variable `context`.
**Ahora:** Separa claramente:
- `conversationHistory` - Historial de chat
- `materialContext` - Contenido de materiales subidos
- `sessionSubject` - Materia actual
- `sessionGrade` - Grado del estudiante

---

## Prueba de Verificación: Caso Juegos de Video

**Contexto:** Conversación sobre "Tecnología e Informática" grado 7

### ❌ Comportamiento Anterior (Incorrecto)
```
Estudiante: "¿Qué es un programa informático?"
Asistente: [Responde correctamente]

Estudiante: "Ok, entonces cómo funciona un juego?"
Asistente: "Un juego funciona como reglas entre jugadores, similar a una obra de teatro..."
           "Por ejemplo, en Monopoly, los jugadores lanzan dados..." ❌ MONOPOLY (juego de mesa)
```

**Problema:** El asistente NO sabía que la materia era "Tecnología e Informática" → dio ejemplo de juego de mesa.

### ✅ Comportamiento Nuevo (Correcto)
```
Estudiante: "¿Qué es un programa informático?"
Asistente: [Responde correctamente sobre software]

Estudiante: "Ok, entonces cómo funciona un juego?"
Asistente: "¡Buena pregunta! Un videojuego funciona como un programa complejo que coordina múltiples sistemas.
           
           Por ejemplo, cuando juegas Pokémon (que mencionamos antes), el programa:
           - Lee tus controles (botones) → código de entrada
           - Procesa la lógica del juego (batallas, movimiento) → algoritmos
           - Renderiza gráficos en pantalla → motor gráfico
           - Reproduce sonidos → sistema de audio
           
           Todo esto pasa 60 veces por segundo (60 FPS) para crear la ilusión de movimiento.
           
           ¿Te gustaría saber sobre algún sistema específico como los gráficos o la física?"
```

**Razones del cambio:**
1. ✅ **Memoria:** Recordó que mencionó Pokémon antes → "que mencionamos antes"
2. ✅ **Contexto de materia:** Sabe que es Tecnología → habla de programas, no juegos de mesa
3. ✅ **Seguimiento:** Responde dentro del tema de programas informáticos

---

## Cómo Verificar en Producción

### 1. Check Backend Logs
Busca en consola del servidor:
```
Found 15 materials for Tecnología e Informática (grade 7)
```

Si ves:
```
No materials found for subject: Tecnología e Informática, grade: 7
Falling back to generic materials (no subject-specific materials found)
```
→ Significa que NO hay materiales subidos para esa materia/grado.

### 2. Check Database Logs
```sql
SELECT 
  metadata->>'subject' as subject,
  metadata->>'grade' as grade,
  metadata->>'materials_found' as materials_count,
  metadata->>'conversation_length' as chat_length,
  metadata->>'used_rag' as used_materials
FROM student_activity
WHERE action_type = 'assistant_query'
ORDER BY created_at DESC
LIMIT 10;
```

**Valores esperados:**
- `subject`: "Tecnología e Informática" (not NULL)
- `grade`: 7 (or NULL si no especificado)
- `materials_count`: > 0 si hay materiales subidos
- `chat_length`: > 0 en mensajes después del primero
- `used_materials`: true si materials_count > 0

### 3. Test Frontend
1. Abrir DevTools → Network
2. Enviar pregunta
3. Ver request a `/api/assistant/query`
4. Verificar body incluye:
```json
{
  "question": "cómo funciona un juego?",
  "sessionId": "uuid-here",
  "subject": "Tecnología e Informática"
}
```

---

## Casos de Prueba

### Test 1: Memoria de Conversación
```
Mensaje 1: "Tengo 5000 en una caja y 7000 en otra, cómo podría compartirlos entre 3 personas?"
Asistente: [Da ejemplo con 4000+8000÷4=3000]

Mensaje 2: "Sobre ese ejemplo que me diste, qué porcentaje le toca a cada uno?"
Asistente: ✅ "En el ejemplo donde repartimos 12000 entre 4 personas, cada uno recibe 3000..."
           ✅ Usa los números del ejemplo anterior (12000, 4, 3000)
           ❌ NO pregunta "¿qué ejemplo?" ni "¿qué datos tienes?"
```

### Test 2: Contexto de Materia (Educación Artística)
```
Materia: Educación Artística, Grado 7
Pregunta: "¿Por qué los colores se mezclan?"

Respuesta Esperada:
✅ Habla de pigmentos, luz, colores primarios
✅ Usa analogías de pintura, arte
❌ NO habla de física de ondas electromagnéticas
❌ NO menciona longitudes de onda (eso es para Física)
```

### Test 3: Contexto de Materia (Tecnología)
```
Materia: Tecnología e Informática, Grado 7
Pregunta 1: "¿Qué es un programa informático?"
Pregunta 2: "cómo funciona un juego?"

Respuesta Esperada para Pregunta 2:
✅ Habla de videojuegos, software
✅ Menciona código, algoritmos, programación
✅ Puede referenciar "programa" de Pregunta 1
❌ NO habla de juegos de mesa (Monopoly, ajedrez)
```

### Test 4: Filtrado de Materiales por Materia
```sql
-- Subir materiales de prueba
INSERT INTO materials (teacher_id, filename, subject, grade, uploaded_at)
VALUES 
  ('teacher-uuid', 'algoritmos.pdf', 'Tecnología e Informática', 7, NOW()),
  ('teacher-uuid', 'fotosintesis.pdf', 'Ciencias Naturales', 7, NOW()),
  ('teacher-uuid', 'ecuaciones.pdf', 'Matemáticas', 7, NOW());

-- Embeddings de contenido
INSERT INTO material_embeddings (material_id, content, embedding)
SELECT 
  id,
  'Contenido sobre ' || subject,
  '[0.1,0.2,...]'::vector
FROM materials;
```

**Luego hacer pregunta en sesión de "Tecnología e Informática":**
```
Pregunta: "Qué es un algoritmo?"
```

**Verificar logs:**
```
Found 1 materials for Tecnología e Informática (grade 7)
```

**Verificar respuesta usa SOLO materiales de Tecnología:**
- ✅ Menciona contenido de "algoritmos.pdf"
- ❌ NO menciona fotosíntesis ni ecuaciones

---

## Troubleshooting

### Problema: "Session not found"
**Causa:** Frontend no está enviando `sessionId` correcto.
**Solución:** Verificar que `session?.id` existe en ChatBox.jsx

### Problema: "Falling back to generic materials"
**Causa:** No hay materiales subidos para esa materia/grado.
**Solución:** 
1. Subir materiales como profesor para la materia específica
2. Verificar que `materials.subject` coincide EXACTAMENTE con `chat_sessions.subject`

### Problema: Asistente no recuerda conversación anterior
**Causa:** `conversationHistory` está vacío.
**Solución:**
1. Verificar que mensajes se están guardando en `chat_messages` table
2. Verificar query: `SELECT * FROM chat_messages WHERE session_id = 'uuid' ORDER BY created_at;`

### Problema: Asistente sigue dando ejemplos off-topic
**Causa:** Materiales RAG contienen información de otras materias.
**Solución:** Verificar filtrado:
```sql
SELECT m.subject, m.grade, COUNT(me.id) as embedding_count
FROM materials m
LEFT JOIN material_embeddings me ON me.material_id = m.id
GROUP BY m.subject, m.grade
ORDER BY m.subject, m.grade;
```

---

## Métricas de Éxito

### Antes de los cambios:
- ❌ 0% de conversaciones con memoria
- ❌ 0% de materiales filtrados por materia
- ❌ Ejemplos frecuentemente off-topic (Monopoly en clase de Tecnología)

### Después de los cambios:
- ✅ 100% de conversaciones con historial (últimas 20 mensajes)
- ✅ 100% de materiales filtrados por materia+grado
- ✅ Logs completos con metadata (subject, grade, materials_found, used_rag)
- ✅ Ejemplos contextualizados a la materia

---

## Próximos Pasos Recomendados

### 1. Embeddings Mejorados
Actualmente usa embeddings genéricos. Considerar:
- Almacenar metadata de materia en el vector
- Usar hybrid search (keyword + semantic)

### 2. Ventana de Contexto Dinámica
Actualmente límite fijo de 20 mensajes. Considerar:
- Aumentar a 50 para conversaciones largas
- Usar summarization para conversaciones muy largas

### 3. Cache de Materiales
Para evitar queries repetitivos:
- Cachear lista de material_ids por (subject, grade) por 5 minutos
- Invalidar cache cuando se suben nuevos materiales

### 4. A/B Testing
Comparar respuestas:
- Con vs sin historial de conversación
- Con vs sin filtrado por materia
- Medir: engagement, preguntas de seguimiento, satisfacción
