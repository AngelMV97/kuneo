# 🐻 Tuko - Animaciones Lottie

Esta carpeta contiene las 7 animaciones del personaje **Tuko** (oso de anteojos colombiano).

## 📁 Archivos Requeridos

Coloca los siguientes archivos JSON de Lottie en esta carpeta:

```
tuko/
├── idle.json           # Estado neutral, esperando interacción
├── thinking.json       # Procesando respuesta del estudiante
├── encouraging.json    # Motivando al estudiante
├── reflection.json     # Invitando a pensar más profundo
├── hint.json           # Dando una pista útil
├── correct.json        # Celebrando respuesta correcta
└── incorrect.json      # Reconfortando tras error
```

## 🎨 Especificaciones Técnicas

- **Formato**: JSON (Lottie)
- **Dimensiones recomendadas**: 500x500px
- **FPS**: 30
- **Duración**:
  - `idle`: Loop infinito (2-3 segundos)
  - `thinking`: 1.5-2 segundos
  - `encouraging`: 2-3 segundos
  - `reflection`: 2-3 segundos
  - `hint`: 2 segundos
  - `correct`: 2-3 segundos
  - `incorrect`: 2-3 segundos

## 🎭 Diseño del Personaje

**Tuko** es un oso de anteojos (Tremarctos ornatus), especie endémica de Colombia y otros países andinos.

**Características:**
- Pelaje negro con marcas claras alrededor de los ojos (como anteojos)
- Expresiones amables y pacientes
- Gestos pedagógicos (señalar, explicar, acompañar)

**Personalidad:**
- Sabio pero accesible
- Paciente y alentador
- Celebra logros sin infantilizar
- Acompaña en momentos difíciles

## 🔗 Integración

Estos archivos son referenciados en:
- `shared/ui-schema/characterStates.js` - Mapeo de estados
- `apps/mobile/src/components/TukoCharacter.jsx` - Componente React Native

## 📝 Notas

Si los archivos Lottie no están disponibles aún, puedes:
1. Usar placeholders temporales
2. Exportar desde Adobe After Effects con plugin Bodymovin
3. Crear en [LottieFiles Creator](https://lottiefiles.com/create)
4. Contratar diseñador en [LottieFiles Marketplace](https://lottiefiles.com/marketplace)
