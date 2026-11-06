# 🚀 QUICK START - Kuneo Clean Edition

## ✅ Todo listo para probar

**Estado**: Proyecto limpio, sin código de Aula Nativa, 0 errores.

---

## 📦 PASO 1: Reinstalar Dependencias Limpias

El `package.json` de server/ fue actualizado, necesitas reinstalar:

```powershell
# En PowerShell
cd "d:\USER EAT\ANGEL MOTTA\Ángel Motta\kuneo\server"

# Eliminar node_modules antiguo
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue

# Reinstalar con dependencias limpias
npm install

Write-Host "`n✅ Dependencias limpias instaladas" -ForegroundColor Green
```

---

## 🗄️ PASO 2: Poblar Base de Datos

Ejecuta esto en el **SQL Editor de Supabase**:

1. Ve a tu proyecto en Supabase
2. Abre "SQL Editor"
3. Copia y pega el contenido de `seed_data.sql`
4. Click "Run"

Esto creará **10 módulos de ejemplo** en 5 asignaturas.

**Verificación**:
```sql
SELECT COUNT(*) FROM modules;
-- Debería mostrar: 10
```

---

## 🚀 PASO 3: Iniciar Servidores

### Terminal 1: Backend
```powershell
cd "d:\USER EAT\ANGEL MOTTA\Ángel Motta\kuneo\server"
npm run dev
```

**Deberías ver**:
```
🚀 Montando routers de Kuneo...

✅ Orchestrator router mounted
✅ Modules router mounted
✅ Progress router mounted
✅ Profiles router mounted

🎓 KUNEO API Server
📍 http://localhost:3000
🏥 Health check: http://localhost:3000/health
```

### Terminal 2: Frontend
```powershell
cd "d:\USER EAT\ANGEL MOTTA\Ángel Motta\kuneo\client"
npm run dev
```

**Deberías ver**:
```
VITE ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 🧪 PASO 4: Flujo de Prueba Completo

### 1. Abrir app
```
http://localhost:5173
```

### 2. Registrarse
- Email: `test@kuneo.com`
- Contraseña: `Test123!`
- Grado: 8

### 3. Seleccionar personaje
- Click en **Tuko** (el oso)
- Click "Continuar con Tuko"
- Debería navegar a `/home`

### 4. Explorar catálogo
- Click en tab "Explorar" (segundo ícono abajo)
- Click en "Ciencias" 🔬
- Debería cargar módulos desde la API:
  - Gravedad: Conceptos Básicos
  - Fuerzas y Movimiento
  - Energía y Transformación

### 5. Iniciar módulo
- Click en "Gravedad: Conceptos Básicos"
- Debería:
  - Navegar a `/module/:id`
  - Iniciar sesión con orchestrator
  - Mostrar a Tuko saludando
  - Poder escribir y enviar respuestas

### 6. Ver progreso
- Click en tab "Progreso" (tercer ícono abajo)
- Debería mostrar:
  - Nivel cognitivo
  - Módulos completados
  - Racha de días
  - Radar de habilidades (si hay evaluaciones)

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Backend inicia sin errores
- [ ] Frontend inicia sin errores
- [ ] Health check responde: `http://localhost:3000/health`
- [ ] Registro de usuario funciona
- [ ] Selección de personaje guarda correctamente
- [ ] Catálogo muestra 3 módulos de Ciencias
- [ ] Al hacer click en módulo, navega a `/module/:id`
- [ ] Tuko aparece y saluda
- [ ] Puedes escribir y enviar respuestas
- [ ] TabBar navega entre Inicio/Explorar/Progreso/Perfil

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Backend no inicia
```powershell
# Verificar puerto 3000 libre
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

# Si está ocupado, matar proceso
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

### Frontend no carga módulos
**Verificar que VITE_API_URL esté configurado**:
```bash
# En client/.env
VITE_API_URL=http://localhost:3000
```

### Error "orchestrator is not defined"
**Causa**: El orchestrator necesita embeddings inicializado.  
**Solución**: Verificar que `OPENAI_API_KEY` esté en `server/.env`.

### No aparecen módulos en catálogo
**Causa**: Seed data no ejecutado o DB vacía.  
**Solución**:
```sql
-- En Supabase SQL Editor
SELECT * FROM modules;
-- Si está vacío, ejecutar seed_data.sql
```

---

## 📊 ENDPOINTS DISPONIBLES

### Orchestrator
- `POST /api/orchestrator/start-session`
- `POST /api/orchestrator/decide`
- `POST /api/orchestrator/end-session`

### Modules
- `GET /api/modules?subject=ciencias&userId=xxx`
- `GET /api/modules/:moduleId`
- `GET /api/subjects`

### Progress
- `GET /api/progress/:userId`
- `GET /api/cognitive-profile/:userId`
- `GET /api/sessions/:sessionId/feedback`

### Profiles
- `GET /api/profiles/:userId`
- `PUT /api/profiles/:userId`
- `POST /api/profiles/character-preference`
- `POST /api/profiles/initialize`
- `GET /api/profiles/:userId/continue-learning`

---

## 📞 SOPORTE

Si algo no funciona:

1. **Revisar logs de consola** en backend y frontend
2. **Verificar variables de entorno** en `.env` files
3. **Verificar errores de compilación**: `get_errors(client/src, server/)`
4. **Leer documentación completa**: [CLEANUP_REPORT.md](./CLEANUP_REPORT.md)

---

## 🎯 SIGUIENTE FASE

Una vez validado que todo funciona:

1. **Conectar páginas restantes** (CognitiveProfile, SessionFeedback, Home)
2. **Integración LLM** en orchestrator para análisis pedagógico
3. **Generación dinámica** de tarjetas conceptuales
4. **Motor de visuales** (Mermaid, Recharts)

---

**¡Listo para probar!** 🚀
