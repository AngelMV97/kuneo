# Kuneo: progreso real y actividades personalizadas

Implementado el 2 de noviembre de 2026. La versión activa sigue siendo `client/` + `server/`.

## Ajustes de coherencia del 3 de noviembre

El usuario confirmó la ejecución del SQL de seguridad: las cuatro funciones devolvieron `owner_guard=true` y `search_path=pg_catalog, kuneo, pg_temp`.

### Interacciones de progreso y perfil

**Ajuste UX posterior:** las materias y habilidades ahora llevan directamente a la pestaña Actividad mediante parámetros de URL (`tab=actividad&subject=...` o `dimension=...`). Allí se muestran su resumen, un selector de filtro, el historial y «Cargar más». Se puede quitar el filtro, cambiarlo o volver mediante el historial del navegador. También se admite entrar desde Perfil. El diálogo queda reservado al intento individual y a la explicación informativa; su posición y margen de centrado son explícitos para evitar que el reset CSS global lo ubique en la esquina. Las tarjetas del historial declaran sus colores de texto para modo claro y oscuro. Este ajuste sustituye los diálogos de listados descritos en la primera implementación a continuación.

- Las tarjetas de materia y habilidades son botones accesibles que abren un diálogo compartido con resultados e historial filtrado. No hay nuevas pantallas completas duplicadas.
- Actividad reciente y el historial abren el detalle del intento: fecha, materia, habilidad, pregunta y respuesta cuando están guardadas, pistas, tiempo y feedback. Los intentos antiguos indican explícitamente la ausencia de enunciado o retroalimentación. «Abrir módulo» lleva al módulo correspondiente.
- El historial carga páginas de 15 intentos y deja de mostrar «Cargar más» al agotarse. Las consultas mantienen una fecha de corte para que los nuevos intentos no desplacen las páginas. Las API nuevas filtran por el usuario autenticado, validan filtros y no permiten leer intentos ajenos.
- La recomendación del perfil abre Explorar. El enlace desde el detalle de una materia abre su catálogo filtrado. Los botones informativos explican las métricas. El diálogo admite Escape, clic exterior, cierre explícito y navegación por teclado con el comportamiento nativo de `dialog`.

- Explorar ya no muestra el 64% ficticio ni un objetivo semanal inexistente. Consulta el mismo resumen que Progreso y muestra módulos consolidados entre módulos practicados, con carga, error y estado sin actividad. «Ver más» abre Progreso.
- Inicio distingue intentos guardados, objetivos consolidados y habilidades consolidadas. Un módulo puede ser reanudable con cero objetivos consolidados: sus intentos siguen guardados. La barra mide objetivos, y puede alcanzar 100% aunque falten habilidades para consolidar el módulo completo.
- Progreso identifica habilidades sin evidencia como «Sin evaluar» y el estado inicial sin módulos con un guion, no como una evaluación de 0%.
- Perfil llama al índice «Promedio evaluado» e indica cuántas habilidades tienen evidencia (por ejemplo, 1 de 5). No se infieren resultados para habilidades no practicadas. Las entradas sin evidencia se envían al radar como nulas.
- El desempeño por materia usa todos sus intentos; el desempeño de cada habilidad usa hasta 20 intentos recientes. Por tanto, ambos porcentajes pueden diferir legítimamente. Las etiquetas explican esa diferencia. No se modificaron intentos históricos, reglas de evaluación ni criterios de consolidación.

## Arranque

En dos terminales, desde la raíz:

```powershell
cd server
npm run dev
```

```powershell
cd client
npm run dev
```

Abre http://localhost:5173. No hacen falta nuevas dependencias ni tablas para el flujo de aprendizaje. Los valores actuales de `server/.env` se conservan; consulta `server/.env.example` para opciones nuevas. Las pruebas automatizadas se ejecutan con `npm test` desde `server/`.

## Qué cambió

- Inicio, Progreso, Perfil, el resumen del módulo y la ruta alternativa `/cognitive-profile` usan los intentos reales del usuario autenticado. No hay historial ficticio, notificaciones de ejemplo, porcentajes de demostración ni respaldo a un UUID de prueba.
- El radar muestra evidencia de las cinco habilidades. Una habilidad sin intentos se indica sin evaluar. El porcentaje es el promedio de hasta 20 intentos recientes: correcto=1, parcial=0.4, incorrecto=0; las pistas reducen el peso de un acierto en 0.15 hasta un mínimo de 0.5. Es un indicador de práctica, no una medición psicométrica validada.
- El resumen general mide módulos consolidados entre módulos practicados. El tiempo suma segundos registrados en intentos, no tiempo total con la página abierta.
- Las actividades se generan por objetivo curricular, materia, grado real del perfil, grupo 1–3/4–5/6–7/8–9/10–11, dimensión y evidencia reciente. Materias: mathematics, language, natural_sciences, social_studies, english.
- El prompt recibe preguntas recientes para evitar repetición literal y variar contexto. Esto no garantiza variedad infinita ni detecta todas las paráfrasis. Se generan preguntas de opción única y respuestas abiertas con rúbrica; estas últimas admiten explicaciones equivalentes.
- Dos aciertos consecutivos sin pistas consolidan cada objetivo. Para completar un módulo también se requieren dos aciertos consecutivos sin pistas en cada habilidad. Es una regla inicial ajustable, no un diagnóstico del estudiante.
- Se conservan los módulos, pasos y contenido enriquecido. Sirven como objetivos y reserva evaluable; no se sobrescriben ni se insertan preguntas personales en el catálogo compartido.
- Si falla la generación, se prefiere una pregunta de reserva aún no presentada. Si la reserva se agota puede repetirse y la interfaz lo identifica como contenido de reserva. Si no existe una pregunta evaluable, se informa del problema. Si falla la evaluación de una respuesta abierta generada, no se inventa una nota: se conserva la actividad para reintentar.

## Persistencia y compatibilidad

`kuneo.student_step_attempts` es la fuente de verdad. El campo TEXT `answer` conserva un sobre JSON versionado para intentos nuevos: pregunta, opciones, respuesta enviada, origen, grado y feedback. Los intentos históricos de texto siguen leyéndose. No se borraron ni migraron datos históricos.

`student_module_progress` y `student_cognitive_profile` se crean/actualizan al responder. Si falla un agregado después de guardar el intento, la interfaz lo informa; el resumen sigue calculándose desde los intentos. Reenviar el mismo token reintenta sincronizar sin volver a premiar la respuesta.

La solución se mantiene cifrada en un token de actividad ligado al usuario y con caducidad de 24 horas. No se envía una solución legible al navegador. SessionStorage mantiene la actividad pendiente por usuario y módulo durante 45 minutos. El servidor conserva una caché acotada de actividades pendientes. El serializado de escrituras y generación está diseñado para una instancia de API; antes de escalar a varios procesos conviene trasladar la idempotencia a una transacción de base de datos.

La reserva requiere que el navegador pueda contactar con el backend y Supabase. No implementa un modo offline completo ni sincronización offline. `LEARNING_CONTENT_MODE=stored` fuerza reserva; no se implementaron cuotas de prueba gratuita ni suscripciones.

## Seguridad y SQL pendiente

Todas las rutas `/api` validan un token de Supabase. Las llamadas del frontend incluyen ese token. La API rechaza identificadores de otro usuario y verifica propiedad de sesiones y recomendaciones. `/health` sigue siendo público y solo informa de que el proceso está activo.

**Ejecuta en el SQL Editor de Supabase `scripts/database/secure_kuneo_profile_functions.sql`** para proteger también las cuatro funciones RPC de perfiles que el frontend invoca directamente. Es una transacción que conserva firmas y tipos instalados, añade validación de propietario, fija search_path y retira ejecución anónima. También retira la escritura directa del navegador sobre las cinco tablas adaptativas; el backend conserva su acceso privilegiado. Si las definiciones instaladas son inesperadas, aborta sin aplicar cambios. No modifica las funciones de Aula Nativa ni su tabla material_embeddings. Esta migración está preparada, pero no fue ejecutada desde el entorno de desarrollo.

RLS debe permanecer activado en las cinco tablas adaptativas. No vuelvas a ejecutar `scripts/fix-adaptive-rls.sql`: contiene una desactivación insegura de desarrollo. Tampoco ejecutes el esquema adaptativo completo sobre datos existentes: contiene DROP TABLE.

## Validación y límites

- Pruebas de métricas, grupos de grado, 25 combinaciones materia/grupo, cifrado, separación de usuarios, pistas, persistencia, idempotencia y errores con base de datos y OpenAI simulados.
- Prueba real de lectura de formatos en Supabase y una generación/evaluación sintética con OpenAI, sin crear usuarios ni guardar intentos reales.
- Compilación de producción del frontend. Queda la comprobación visual y el recorrido con tus dos cuentas en el navegador.
- Los avisos de tamaño de bundle y datos Browserslist antiguos siguen pendientes. SMTP, recuperación de contraseña y políticas de Aula Nativa no se modificaron.
- Respaldo de las tres pantallas originales, el módulo original, la retroalimentación anterior y el cliente API original en `recovery/learning-ui-before-2026-11-02.zip`. No incluye credenciales.
