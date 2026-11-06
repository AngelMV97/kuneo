# SISTEMA DE PROGRESIÓN Y DE EVALUACIÓN PARA ADAPTIVE ENGINE

Acordamos que progresión, evaluación, desbloqueos, recomendaciones y dificultad adaptativa pertenecen al Adaptive Engine, entonces recordemos el Sistema de Progresión y el Sistema de Evaluación Cognitiva que diseñamos en etapas iniciales de Kuneo.

Algunos de los criterios ya están hechos completa o parcialmente. 

## SISTEMA DE PROGRESIÓN

### PRINCIPIO DEL SISTEMA DE PROGRESIÓN 

❌ NO progresas por: 
- temas
- unidades
- contenido cubierto

✔ SÍ progresas por:
👉 capacidades cognitivas 


🎯 Dimensiones base: 
- Comprensión 
- Representación 
- Razonamiento 
- Transferencia 
- Metacognición 


### ESTRUCTURA DE PROGRESIÓN

🎯 Nivel macro

🎓 ETAPAS DEL USUARIO

🟢 Nivel 1 — Explorador 
responde intuitivamente
necesita guía constante

🟡 Nivel 2 — Constructor 
empieza a explicar
usa representaciones

🔵 Nivel 3 — Analista 
conecta ideas
detecta errores

🟣 Nivel 4 — Aplicador 
transfiere a nuevos contextos

🔴 Nivel 5 — Autónomo 
razona sin guía
explica con claridad

Lo correcto es que el usuario avance un grado por cada año, lo más alineado posible con el año escolar (el LLM debería encargarse de que eso se cumpla, claramente siguiendo las instrucciones y principios de pedagogical foundations), por lo tanto tenemos dos opciones: 

- Opción A: Al inicio de un grado empiece en Nivel 1 y el objetivo sea terminar en Nivel 5 (repite por cada año, al siguiente año retoma el nivel 1).

- Opción B: Al registrarse un nuevo usuario, empieza en Nivel 1 y, al final del grado 11, debe alcanzar o superar el Nivel 5.

### PROGRESIÓN DENTRO DE CADA ASIGNATURA

📚 Ejemplo: Matemáticas

Ruta interna:
Fenómenos → Modelos → Problemas → Aplicación → Transferencia

Cada módulo trabaja:
1 concepto central
1 error típico
1 transferencia


### ESTRUCTURA DE LOS MÓDULOS

🎯 Cada módulo tiene:

✔ Fase 1 → Exploración
✔ Fase 2 → Representación
✔ Fase 3 → Refinamiento
✔ Fase 4 → Aplicación
✔ Fase 5 → Metacognición

👉 exactamente lo que ya diseñaste


### SISTEMA DE DESBLOQUEO

❗ No uses:
- puntos
- estrellas
- gamificación superficial

✔ Usa:
👉 dominio cognitivo

🎯 Ejemplo 
El sistema desbloquea cuando el usuario:
explica correctamente
transfiere idea
mejora modelo


### MAPA DE ASIGNATURAS

🎯 No mostrar como lista plana

✔ Mostrar como:
👉 mapa de dominios

Ejemplo: 
Matemáticas → pensamiento cuantitativo
Ciencias → explicación del mundo
Lengua → comprensión y expresión
Sociales → interpretación

👉 eleva el nivel percibido


### PROGRESO VISIBLE (CLAVE)

❗ No mostrar:
“completaste 3 módulos”

✔ Mostrar:

🧠 Perfil cognitivo

Ejemplo:
Comprensión → 70%
Razonamiento → 55%
Transferencia → 40%

👉 esto es diferenciador brutal


### INTEGRACIÓN CON ICFES

🎯 Rol correcto:

❌ NO:
“practicar preguntas”

✔ SÍ:
👉 validar transferencia

Flujo ideal:

Usuario entrena (módulos)
Va a simulacro
Sistema detecta debilidad
Recomienda módulo

Ejemplo:
“Tuviste dificultad en interpretación de gráficos”
👉 módulo recomendado


### PERSONALIZACIÓN

🎯 Motor básico:

Entrada:
respuestas del usuario
errores
tiempo

Salida:
ruta sugerida
nivel cognitivo


### EXPERIENCIA COMPLETA

Onboarding
↓
Módulo 1
↓
Elección (seguir / cambiar / evaluar)
↓
Ruta personalizada
↓
Simulacro
↓
Ajuste de ruta


### DIFERENCIADOR FINAL

Tu sistema no es:
❌ plataforma educativa

Es:
👉 sistema de entrenamiento del pensamiento 

---

## SISTEMA DE EVALUACIÓN COGNITIVA

### PRINCIPIO DEL SISTEMA DE EVALUACIÓN

❗ Qué NO es evaluación aquí: 
- no es calificación
- no es puntaje
- no es “correcto / incorrecto”

✔ Qué SÍ es: 
👉 medición del proceso de pensamiento

🎯 Traducción
No evaluas:
“¿llegó al resultado?”
Evalúas:
“¿cómo está pensando?”


### DIMENSIONES COGNITIVAS (BASE DEL SISTEMA)

🎯 Las 5 dimensiones definitivas

1. Comprensión
👉 ¿entiende el concepto?

2. Representación
👉 ¿puede modelarlo (diagramas, palabras, ejemplos)?

3. Razonamiento
👉 ¿puede justificar?

4. Transferencia
👉 ¿aplica en contexto nuevo?

5. Metacognición
👉 ¿reflexiona sobre su propio proceso?

🧠 Esto se alinea con:
investigación educativa


### UNIDAD DE EVALUACIÓN

🎯 Se evalúa por micro-evidencias
No al final del módulo.

✔ Ejemplo:

Durante el módulo:

Usuario responde:
“cae porque pesa más”

Sistema detecta:
comprensión parcial
error conceptual

👉 Esto es una evidencia


### MOTOR DE EVALUACIÓN

🔩 COMPONENTES

1. Clasificador de respuesta
Puede ser:
LLM (ideal)

Detecta:
tipo de respuesta
nivel conceptual
errores típicos

2. Rubricas internas

🎯 Ejemplo (Comprensión)

Nivel  Descripción 
  1    intuición sin base 
  2    idea parcial 
  3    concepto correcto básico 
  4    explicación clara 
  5    explicación profunda 


👉 Esto existe para cada dimensión

3. Acumulador de evidencias

Cada interacción suma:
{
  "comprension": +0.2,
  "razonamiento": +0.1,
  "transferencia": 0,
}


### CÁLCULO DEL PERFIL

🎯 Perfil dinámico

Ejemplo:

Usuario:
Comprensión → 68
Representación → 52
Razonamiento → 47
Transferencia → 35
Metacognición → 28

👉 Este es el corazón del sistema


### CÓMO SE EVALÚA CADA DIMENSIÓN

🟢 Comprensión

Señales:
define concepto
identifica relaciones

🟡 Representación

Señales:
usa ejemplos
crea modelos
explica con palabras propias

🔵 Razonamiento

Señales:
justifica
argumenta

🔴 Transferencia

Señales:
responde en contexto nuevo
generaliza

🟣 Metacognición

Señales:
reconoce errores
explica cómo aprendió


### EVALUACIÓN INVISIBLE (UX CLAVE)

❗ El usuario NO debe sentir que está siendo evaluado

✔ Cómo hacerlo:

En vez de:
“Evalúa tu respuesta”

Usas:
“Explícalo con tus palabras”
“¿Por qué crees eso?”
“¿Cambiarías algo?”

👉 Esto es evaluación disfrazada de aprendizaje


### FEEDBACK (MUY IMPORTANTE)

❌ NO dar:
puntajes
notas
porcentajes inmediatos

✔ SÍ dar:

Feedback cualitativo

Ejemplo:
“Ya estás identificando la idea principal.”
“Ahora intenta explicarla con más precisión.”


### MOMENTOS DE VISIBILIDAD

🎯 Cuándo mostrar progreso

✔ Al final del módulo

UI:
ANTES vs AHORA

✔ En dashboard

Perfil cognitivo
(no tipo videojuego)

 
### INTEGRACIÓN CON PROGRESIÓN 

🎯 El sistema decide:

✔ Qué módulo recomendar
✔ Qué dificultad usar
✔ Cuándo pasar de nivel


### INTEGRACIÓN CON ICFES

🎯 Aquí se valida transferencia

Resultado:

Sistema detecta:
falla en interpretación
error conceptual

Acción:

“Te recomendamos trabajar este módulo”

👉 circuito cerrado


### DIFERENCIADOR REAL

El sistema no mide: 
❌ rendimiento

Mide:
👉 desarrollo del pensamiento

---
 
**MUY IMPORTANTE:** Estos dos sistemas fueron definidos en una etapa muy temprana del proyecto cuando simplemente teníamos datos de prueba (un módulo ejemplo sin el rigor de los DBA y Estándares), no existían las taxonomías que creamos, ni los ficheros limpios de los DBA y Estándares (así como sus parsers y el nomalizador universal), ni habíamos definido las disciplinas, tampoco habíamos creado los módulos, ni el module generator, ni los 8 steps del module steps system y todo lo más reciente. 

En ese entonces, se pensó este flujo: 
Usuario responde
↓
API Gateway
↓
Tutor Engine
↓
Evaluation Service
↓
Progress Service (update)
↓
Content / Recommendation
↓
LLM (si aplica)
↓
Respuesta estructurada
↓
App renderiza

COMPONENTES CLAVE

🧩 A. Tutor Engine (Orchestrator)

🎯 Responsabilidad
Controlar la experiencia.

Funciones:
leer contexto del usuario
decidir siguiente acción
invocar servicios
estructurar prompts

Entrada:
{
  "user_id": "123",
  "module_id": "physics_gravity_01",
  "step": "exploration",
  "user_response": "porque pesa"
}


Salida:
{
  "character_state": "thinking",
  "message": "Interesante... ¿qué fuerza crees que está actuando?",
  "ui_elements": ["options", "card"]
}


🧩 B. Content Service

🎯 Maneja:
módulos
tarjetas
rutas

Fuente:
contenidos MEN (curados)
contenido propio estructurado

Formato:
{
  "module_id": "gravity_01",
  "phases": [...]
}


🧩 C. Evaluation Service

🎯 Evalúa respuestas

Implementación:
MVP:
reglas + keywords
Escala:
LLM + rúbricas

Salida:
{
  "comprension": 0.2,
  "error_type": "peso_vs_gravedad"
}


🧩 D. Progress Service

🎯 Mantiene perfil cognitivo

Modelo:
{
  "user_id": "123",
  "dimensions": {
    "comprension": 68,
    "razonamiento": 45
  }
}


🧩 E. Recommendation Service

🎯 Decide:
siguiente módulo
dificultad
ruta

Input:
perfil cognitivo
historial

🧩 F. ICFES Service

🎯 Simulación y diagnóstico

Funciones:
entregar preguntas
analizar desempeño
mapear a habilidades


**IMPORTANTE:** Quizás la mayoría de los puntos más relevantes permanezcan iguales (repito, algunos ya fueron hechos completa o parcialmente), pero, así como el sistema general de Kuneo ha ido evolucionando, estos dos sistemas deben evolucionar de forma alineada con el estado actual del proyecto. 

Por cierto, acá recordamos que la primera interacción del usario después de registrarse es completar el Onboarding (seguido por la elección del personaje tutor), pero eso lo construiremos después de tener listo Adaptive Engine. 

En lo que respecta al estado más actual del proyecto, esto tenemos planeado como pasos siguientes sobre Adaptive Engine: 

* MODULE GENERATOR: **Integrar con Adaptive Engine** 
   - Lógica de desbloqueo de módulos
   - Recomendaciones basadas en progreso
   - Ajuste de dificultad dinámico 

* MODULE STEPS SYSTEM: Fase 3 - Adaptive Engine
   - Implementar lógica de next_step_logic en backend 
   - Sistema de pasos remediales dinámicos 
   - Detección de patrones de error (stuck, exploración activa, flujo correcto) 
   - Inserción de pasos adicionales (remedial_representation, worked_example, etc.) 
   - Desbloqueo de módulos según progresión
Reglas de Diseño

HACER:
- Mantener secuencia fija de 8 steps por módulo
- Usar hint_policy para escalar apoyo gradualmente
- Implementar next_step_logic para adaptabilidad
- Vincular concept_cards según misconception detectada
- Permitir pasos remediales dinámicos (insertados por adaptive engine)
**🎯 "Cada step es una unidad ejecutable con políticas adaptativas que permiten al adaptive engine tomar decisiones inteligentes en tiempo real"**

* OPENAI ENRICHMENT SYSTEM: **Adaptive engine** - Usar enriched_content para adaptar runtime

* TAXONOMY SYSTEM: **Adaptive Engine**
   - Navegación jerárquica por taxonomía
   - Progresión basada en disciplinas y temáticas
   - Recomendaciones de siguiente microtopic

* VISUAL ENGINE RUNTIME: **🎨 "El visual NO decide qué mostrar. El Adaptive Engine decide. El Visual Engine solo ejecuta."** 
El Adaptive Engine necesitará usar visuales, overlays y animaciones para intervenir de forma adaptativa. Ahí sí el Adaptive Engine tendrá herramientas reales para decidir: 
qué tarjeta mostrar
qué overlay activar
qué animación reproducir
cuándo guardar silencio
cuándo reforzar
cuándo avanzar

* METACOGINITION RULES (pedagogical foundations): Integration with Adaptive Engine 

 **Use Reflection Responses To:**
✅ Detect confidence level  
✅ Identify which strategies work for this student  
✅ Personalize future hints based on stated preferences  
✅ Flag if student repeatedly says "I don't understand" → trigger remedial path

 **Do NOT Use Reflection To:**
❌ Grade or score the student  
❌ Require "correct" reflections  
❌ Penalize minimal responses

---

**Remember:** Reflection is a gift to the student, not a test. It makes thinking visible so they can become strategic learners.

* LINEAMIENTOS CURRICULARES: Son extremadamente valiosos para: 
   - LLM enrichment policies 
   - pedagogical alignment 
   - socioemotional tone 
   - feedback philosophy 
   - reflection systems 
   - metacognition 
   - adaptive engine ethics

Los lineamientos enfatizan cosas extremadamente alineadas con Kuneo: 
Formación integral 
Desarrollo socioemocional 
Currículo como experiencia viva 
Ciudadanía, ética y reflexión 
Evaluación formativa 
Formación desde la práctica 
Metacognición y convivencia

Y esto encaja PERFECTAMENTE con: 
module_steps,
reflection_cards,
adaptive_engine,
la arquitectura de silencio de Tuko.

Cómo actúa el adaptive engine 
Ejemplo: 
NO: 
penalizar errores 
SÍ: 
detectar momentos de necesidad conceptual 

Esto es todo lo que tendríamos en cuenta por cada sistema construido, en relación al Adaptive Engine, además de lo que ya definimos sobre el Adaptive Engine en sí.