# 🧪 Comandos para Probar la API de Búsqueda Semántica

## 1️⃣ Búsqueda Semántica (POST /api/competencies/search)

### Matemáticas - Ecuaciones

**PowerShell** (copiar todo el bloque):
```powershell
$body = @{
    query = "resolver ecuaciones lineales"
    filters = @{
        subject = "mathematics"
        grade_range = "8-9"
    }
    match_count = 5
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/competencies/search" -Method POST -Body $body -ContentType "application/json" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**CMD/Git Bash**:
```bash
curl -X POST http://localhost:3001/api/competencies/search -H "Content-Type: application/json" -d "{\"query\": \"resolver ecuaciones lineales\", \"filters\": {\"subject\": \"mathematics\", \"grade_range\": \"8-9\"}, \"match_count\": 5}"
```

---

### Ciencias Naturales - Ecosistemas

**PowerShell**:
```powershell
$body = @{
    query = "ecosistemas y biodiversidad"
    filters = @{
        subject = "natural_sciences"
    }
    match_count = 5
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/competencies/search" -Method POST -Body $body -ContentType "application/json" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

### Ciencias Sociales - Historia

**PowerShell**:
```powershell
$body = @{
    query = "historia de Colombia"
    filters = @{
        subject = "social_studies"
    }
    match_count = 5
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/competencies/search" -Method POST -Body $body -ContentType "application/json" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

### Inglés - Gramática

**PowerShell**:
```powershell
$body = @{
    query = "present perfect tense grammar"
    filters = @{
        subject = "english"
    }
    match_count = 5
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/competencies/search" -Method POST -Body $body -ContentType "application/json" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

### Lenguaje - Lectura Crítica

**PowerShell**:
```powershell
$body = @{
    query = "comprensión de lectura crítica"
    filters = @{
        subject = "language"
    }
    match_count = 5
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/competencies/search" -Method POST -Body $body -ContentType "application/json" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## 2️⃣ Filtrado sin Embeddings (GET /api/competencies/filters)

### Por Materia y Grado

**PowerShell**:
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/competencies/filters?subject=mathematics&grade_range=1-3&limit=10" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**CMD/Git Bash**:
```bash
curl "http://localhost:3001/api/competencies/filters?subject=mathematics&grade_range=1-3&limit=10"
```

---

### Solo por Materia

**PowerShell**:
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/competencies/filters?subject=natural_sciences&limit=20" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

### Por Fuente (DBA o Standard)

**PowerShell**:
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/competencies/filters?source=dba&limit=15" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## 3️⃣ Obtener por ID (GET /api/competencies/:id)

Primero obtén un ID de cualquier query anterior, luego:

**PowerShell**:
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/competencies/06094f3a-c393-4df6-b1d0-35a9288023d7" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**CMD/Git Bash**:
```bash
curl "http://localhost:3001/api/competencies/06094f3a-c393-4df6-b1d0-35a9288023d7"
```

---

## 📊 Respuesta Esperada

```json
{
  "success": true,
  "results": [
    {
      "id": "06094f3a-c393-4df6-b1d0-35a9288023d7",
      "subject": "mathematics",
      "grade_range": "1-3",
      "difficulty": 2,
      "content": {
        "competency": "Reconozco significados del número...",
        "evidence": [...],
        "example": "...",
        "concepts": [...],
        "misconceptions": [...]
      },
      "similarity": 0.95
    }
  ],
  "count": 5
}
```

---

## ⚠️ Troubleshooting

### Error: Cannot find module 'openai'

```bash
cd server
npm install openai
```

### Error: OPENAI_API_KEY no definida

Verificar que `server/.env` tenga:

```
OPENAI_API_KEY=sk-...
```

### Error: Permission denied

Verificar que ejecutaste `fix_permissions_simple.sql` en Supabase.

---

## 🎯 Próximo Paso

Una vez que confirmes que el endpoint funciona, integra el componente en el frontend:

```jsx
// En src/pages/Dashboard.jsx o src/pages/Materials.jsx
import SemanticSearch from '../components/SemanticSearch';

function Dashboard() {
  const handleResultSelect = (result) => {
    console.log('Usuario seleccionó:', result);
    // Mostrar detalles de la competencia
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Búsqueda de Competencias</h1>
      <SemanticSearch onResultSelect={handleResultSelect} />
    </div>
  );
}
```

---

Fecha: 2026-05-11
