# Instrucciones para activar el menú de opciones

## ⚠️ IMPORTANTE: ACTUALIZACIÓN CRÍTICA REQUERIDA

**El nombre de usuario no persistirá hasta que ejecutes el SQL actualizado en Supabase.**

La función `kuneo_get_user_profile` estaba faltante en la base de datos. Sin ella, el campo `username` no se retorna cuando se carga el perfil.

## ✅ Problemas Resueltos

### 1. Persistencia de Datos
- **Problema**: El nombre de usuario y las notificaciones no se mantenían al recargar
- **Solución**: 
  - Notificaciones ahora se guardan en `localStorage` (`kuneo_notifications`)
  - Nombre de usuario se guarda en Supabase mediante RPC `kuneo_update_username`
  - Al recargar, se recuperan desde sus respectivas fuentes

### 2. Tema Claro/Oscuro
- **Problema**: El toggle cambiaba pero la interfaz no
- **Solución**:
  - Agregado `darkMode: 'class'` en `tailwind.config.js`
  - Clases dinámicas `dark:` y `light:` funcionan correctamente
  - Tema persistido en `localStorage` (`kuneo_theme`)

### 3. Nombre "Sofía" Hardcodeado
- **Problema**: CourseCatalog mostraba "Sofía" en lugar del nombre dinámico
- **Solución**: Agregada función `getDisplayName()` que usa el perfil de Supabase

### 4. Iconos con Emojis
- **Problema**: Notificaciones y Settings usaban emojis en lugar de MinimalIcons
- **Solución**:
  - NotificationsDropdown ahora usa `TrendingUpIcon`, `BookOpenIcon`, `AlertCircleIcon`
  - Settings usa `SunIcon`, `MoonIcon`, `LogOutIcon`, `UserIcon`, `ArrowLeftIcon`
  - Eliminado archivo `ThemeIcons.jsx` duplicado

### 5. Settings No Funcional
- **Problema**: Sección Perfil no era clickeable, imagen de logout faltante
- **Solución**: Completamente reescrito con:
  - Integración con Supabase para cargar/guardar username
  - ThemeContext para cambiar tema
  - UserNameModal reutilizable
  - Modal de confirmación para logout

## 1. Actualizar la Base de Datos

Ejecuta el siguiente SQL en el SQL Editor de Supabase:

```sql
-- Add username field to kuneo.profiles table
ALTER TABLE kuneo.profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create or replace function to update username
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

-- Drop existing function first (it exists with different return type)
DROP FUNCTION IF EXISTS public.kuneo_get_user_profile(UUID);

-- Create function to get user profile with username
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.kuneo_update_username(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kuneo_get_user_profile(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.kuneo_update_username IS 'Updates username for Kuneo user profile';
COMMENT ON FUNCTION public.kuneo_get_user_profile IS 'Returns the complete Kuneo user profile including username';
```

## 2. Características Implementadas

### ✅ Menú de Opciones (tres puntos verticales)
- **Nombre de usuario**: Abre modal para definir/cambiar nombre personalizado
- **Apariencia**: Alterna entre modo Claro/Oscuro (persistido en localStorage)
- **Configuración**: Navega a /settings
- **Cerrar sesión**: Logout del usuario

### ✅ Sistema de Notificaciones
- Dropdown con lista de notificaciones
- Punto rojo dinámico (solo aparece cuando hay notificaciones sin leer)
- Marcar como leída individualmente o todas juntas
- Iconos y colores según tipo (logro, info, alerta)

### ✅ Nombre de Usuario Dinámico
- Si el usuario NO ha definido nombre: muestra **"Explorador"** (nombre por defecto)
- Si el usuario SÍ ha definido nombre: muestra el nombre personalizado
- Modal elegante para cambiar el nombre (límite 30 caracteres)

### ✅ Sistema de Temas
- Modo Oscuro (por defecto): Fondos oscuros #13172a, #1e2439
- Modo Claro: Fondos blancos y grises claros
- Persistido en localStorage
- Classes dinámicas: `dark:` y `light:`

## 3. Componentes Nuevos Creados

- `ThemeContext.jsx` - Context para manejar tema global
- `DropdownMenu.jsx` - Menú desplegable reutilizable con animaciones
- `UserNameModal.jsx` - Modal para cambiar nombre de usuario
- `NotificationsDropdown.jsx` - Dropdown de notificaciones

## 4. Íconos Nuevos Agregados

- `SettingsIcon` - Configuración
- `MoonIcon` - Modo oscuro
- `SunIcon` - Modo claro
- `LogOutIcon` - Cerrar sesión

## 5. Flujo de Usuario

1. Usuario abre la app → ve "Hola, Explorador" (nombre por defecto)
2. Click en menú (tres puntos) → "Nombre de usuario"
3. Ingresa su nombre en el modal → "Hola, Ana" (nombre personalizado)
4. Click en campana → ve notificaciones (si hay) con punto rojo
5. Click en "Modo Claro" → toda la interfaz cambia a tema claro
6. Preferencias guardadas en localStorage y base de datos

## 6. Notificaciones (Mock Data)

Actualmente usa datos de prueba:
- 🏆 "¡Felicitaciones!" - Completaste la Unidad 2
- 📚 "Nuevo contenido" - Nuevo módulo de Historia

TODO: Conectar con tabla real de notificaciones en la base de datos.

## 7. ¿Por qué "Explorador"?

Este nombre por defecto encaja perfectamente con la visión de Kuneo:
- Representa al estudiante que **explora** y **descubre** conocimiento
- Es inclusivo (no especifica género)
- Inspirador y aspiracional
- Corto y fácil de leer

Otras opciones consideradas: Aprendiz, Pensador, Navegante, Descubridor, Compañero.
