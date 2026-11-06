# 📚 Sistema de Taxonomías Curriculares - Guía de Implementación

## 🎯 Resumen Ejecutivo

Este sistema implementa la **CAPA 1 (Currículo)** de la arquitectura de Kuneo: la estructura pedagógica estática que define cómo se organiza el aprendizaje.

**Datos procesados:**
- **1,570 entradas** de taxonomía
- **7,086 microtopics** en total
- **5 materias**: Matemáticas, Ciencias Naturales, Ciencias Sociales, Inglés, Lenguaje
- **5 rangos de grado**: 1-3, 4-5, 6-7, 8-9, 10-11

---

## 📁 Archivos Creados

### 1. Script SQL de Base de Datos
**Ubicación:** `scripts/database/create_curriculum_taxonomy_table.sql`

Crea la tabla `kuneo.curriculum_taxonomy` con:
- Jerarquía de 4 niveles: disciplina → temática → subtemática → microtopics
- Soporte especial para metadatos de Inglés (MCER, core_model, cognitive_layer)
- Índices optimizados para búsquedas jerárquicas y por arrays
- Triggers para actualización automática de timestamps
- Permisos para roles de Supabase (service_role, anon, authenticated)

### 2. Parser de Taxonomías
**Ubicación:** `scripts/parsers/taxonomy_parser.py`

Parser robusto que:
- Lee archivos `.txt` del directorio `data/clean/curriculum_map/`
- Extrae la estructura jerárquica usando regex
- Maneja metadatos especiales de Inglés
- Genera estadísticas detalladas
- Exporta a JSON limpio y estructurado

**Salida:** `data/clean/curriculum_taxonomy.json` (636.6 KB)

### 3. Script de Carga a Supabase
**Ubicación:** `scripts/parsers/upload_taxonomy_to_supabase.py`

Script de carga que:
- Lee el JSON generado por el parser
- Verifica la existencia de la tabla
- Limpia datos existentes (opcional)
- Carga en lotes de 100 registros
- Valida la integridad de la carga
- Genera estadísticas de validación

---

## 🚀 Proceso de Implementación

### **PASO 1: Crear la Tabla en Supabase** ✅ COMPLETADO

La tabla `kuneo.curriculum_taxonomy` fue creada exitosamente en Supabase con:
- 6 índices optimizados (incluido GIN para búsquedas en arrays)
- Permisos configurados para service_role, anon, authenticated
- Trigger automático para actualización de timestamps
- Constraints para validación de datos

---

### **PASO 2: Parsear los Archivos de Taxonomía** ✅ COMPLETADO

El parser se ejecutó exitosamente:

```bash
python scripts/parsers/taxonomy_parser.py
```

**Resultado:**
- ✅ 1,570 entradas parseadas de 25 archivos
- ✅ 7,086 microtopics extraídos
- ✅ JSON generado en `data/clean/curriculum_taxonomy.json` (636.6 KB)

---

### **PASO 3: Cargar Taxonomías a Supabase** ✅ COMPLETADO

Carga exitosa en Supabase:

```bash
python scripts/parsers/upload_taxonomy_to_supabase.py
```

**Resultado:**
- ✅ 1,570 registros insertados en 16 lotes
- ✅ 0 errores durante la carga
- ✅ Validación exitosa de integridad
- ✅ Base de datos lista para uso

---

## 📊 Estadísticas del Dataset

### Por Materia

| Materia | Entradas | Porcentaje |
|---------|----------|------------|
| Ciencias Naturales | 446 | 28.4% |
| Ciencias Sociales | 305 | 19.4% |
| Inglés | 217 | 13.8% |
| Lenguaje | 302 | 19.2% |
| Matemáticas | 300 | 19.1% |

### Por Rango de Grado

| Grado | Entradas |
|-------|----------|
| 1-3 | 298 |
| 4-5 | 328 |
| 6-7 | 318 |
| 8-9 | 297 |
| 10-11 | 329 |

### Microtopics

- **Total:** 7,086 microtopics
- **Promedio por entrada:** 4.5 microtopics
- **Granularidad:** Nivel más fino de la jerarquía curricular

---

## 🔍 Ejemplos de Consultas SQL

### Ver todas las disciplinas de Matemáticas (grados 4-5)

```sql
SELECT discipline, COUNT(*) as num_thematics 
FROM kuneo.curriculum_taxonomy 
WHERE subject = 'matematicas' AND grade_range = '4-5' 
GROUP BY discipline;
```

### Buscar todas las subtemáticas de fracciones

```sql
SELECT * FROM kuneo.curriculum_taxonomy 
WHERE subject = 'matematicas' AND thematic LIKE '%fraccion%';
```

### Ver estructura completa de Aritmética

```sql
SELECT discipline, thematic, subthematic, microtopics 
FROM kuneo.curriculum_taxonomy 
WHERE subject = 'matematicas' AND discipline = 'aritmetica' 
ORDER BY thematic, subthematic;
```

### Buscar por microtopic específico

```sql
SELECT * FROM kuneo.curriculum_taxonomy 
WHERE 'fracciones_equivalentes_visuales' = ANY(microtopics);
```

---

## 🔗 Integración con Otros Sistemas

### Próximos Pasos de Integración

1. **Module Generator**
   - Usar taxonomías para definir estructura de módulos
   - Mapear competency_units a curriculum_taxonomy
   - Generar sesiones basadas en microtopics

2. **Adaptive Engine**
   - Navegación jerárquica por taxonomía
   - Progresión basada en disciplinas y temáticas
   - Recomendaciones de siguiente microtopic

3. **Visual Engine**
   - Visualización del árbol curricular
   - Mapa de progreso del estudiante
   - Exploración interactiva de la jerarquía

4. **Misconception Engine**
   - Asociar misconceptions a microtopics específicos
   - Análisis de errores por nivel de la taxonomía

5. **ICFES Generator**
   - Mapeo de preguntas ICFES a taxonomía
   - Cobertura curricular de evaluaciones

---

## 🏗️ Arquitectura de Datos

### Relación entre Capas

```
curriculum_taxonomy (estructura pedagógica estática)
    ↓ define estructura de
competency_units (DBAs + Estándares)
    ↓ genera
module_blueprints (plantillas de módulos)
    ↓ LLM genera
exercises (contenido dinámico)
```

### Diferencias Clave

| Característica | curriculum_taxonomy | competency_units |
|----------------|---------------------|------------------|
| Propósito | Arquitectura curricular | Qué debe aprender |
| Fuente | Taxonomía interna | DBAs + Estándares MEN |
| Embeddings | ❌ No necesita | ✅ Sí (para búsqueda semántica) |
| Mutabilidad | Estática | Relativamente estática |
| Uso | Estructura de módulos | Búsqueda de competencias |

---

## ✅ Checklist de Validación

Estado actual de la implementación:

- [x] Tabla `curriculum_taxonomy` existe en Supabase (schema: kuneo)
- [x] 1,570 registros insertados correctamente
- [x] Índices creados (6 índices + 1 GIN para arrays)
- [x] Permisos configurados para service_role, anon, authenticated
- [x] Trigger de timestamp funcionando
- [x] Parser ejecutado exitosamente
- [x] Carga a Supabase completada sin errores
- [ ] Módulos de prueba eliminados (ejecutar `scripts/database/clean_test_modules.py`)
- [ ] Module Generator implementado (próximo paso)

---

## 🐛 Troubleshooting

### Error: "permission denied for table curriculum_taxonomy"

**Causa:** Permisos no configurados correctamente

**Solución:** Asegúrate de ejecutar la sección de GRANT al final del SQL:
```sql
GRANT ALL ON kuneo.curriculum_taxonomy TO service_role;
GRANT SELECT ON kuneo.curriculum_taxonomy TO anon;
```

### Error: "relation 'kuneo.curriculum_taxonomy' does not exist"

**Causa:** Tabla no creada o creada en schema incorrecto

**Solución:**
1. Verifica que el SQL se ejecutó sin errores
2. Confirma que estás usando `schema("kuneo")` en las consultas
3. Revisa que el schema `kuneo` existe en Supabase

### Error al cargar: "duplicate key value violates unique constraint"

**Causa:** Ya existen datos en la tabla

**Solución:** El script automáticamente limpia datos existentes. Si falla:
```sql
DELETE FROM kuneo.curriculum_taxonomy;
```

---

## 📝 Notas Técnicas

### ¿Por qué no usar embeddings?

Las taxonomías son **estructura**, no **contenido**. No necesitan búsqueda semántica porque:
- Son navegables jerárquicamente (disciplina → temática → subtemática)
- Se usan para organizar, no para buscar
- La búsqueda semántica se hace sobre `competency_units`, que **se mapean** a la taxonomía

### Diseño de Índices

- **B-tree** para búsquedas exactas (subject, grade_range, discipline)
- **Composite** para búsquedas jerárquicas multinivel
- **GIN** para búsquedas dentro del array de microtopics

### Escalabilidad

El diseño soporta:
- ✅ Adición de nuevas materias
- ✅ Expansión de rangos de grado
- ✅ Nuevas disciplinas dentro de materias existentes
- ✅ Refinamiento de microtopics sin reestructuración

---

## 👥 Contacto y Soporte

**Sistema:** Kuneo - Plataforma Educativa Adaptativa  
**Componente:** CAPA 1 - Taxonomías Curriculares  
**Fecha de Implementación:** Mayo 12, 2026  
**Versión:** 1.0.0

---

**🎓 "Construyendo el verdadero núcleo curricular de Kuneo"**
