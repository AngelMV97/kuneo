# ============================================
# PRUEBA DE ADAPTIVE ENGINE CON MÓDULO REAL
# ============================================
# Probar el módulo de fracciones 0b0f4668-d41e-42b7-a51c-97c5842566b0
# ============================================

# Configuración
$baseUrl = "http://localhost:3001"
$userId = "b5d08d8c-2c8a-47aa-85e5-3cd58751f35d"
$moduleId = "0b0f4668-d41e-42b7-a51c-97c5842566b0"

Write-Host "`n🧪 TESTING ADAPTIVE ENGINE CON MÓDULO REAL: Fracciones" -ForegroundColor Cyan
Write-Host "=" * 60

# Primero, obtener los steps del módulo
Write-Host "`n📋 Obteniendo steps del módulo..." -ForegroundColor Yellow

# Necesitamos ejecutar la query SQL para obtener los step IDs
# Por ahora, vamos a asumir que ejecutaste test-real-module.sql y tienes los IDs
# Este script se puede completar después de ver los resultados de la query

Write-Host "`n⚠️  INSTRUCCIONES:" -ForegroundColor Magenta
Write-Host "1. Ejecuta scripts/test-real-module.sql en Supabase" -ForegroundColor White
Write-Host "2. Copia el ID del primer step (step_order = 1)" -ForegroundColor White
Write-Host "3. Actualiza la variable `$firstStepId en este script" -ForegroundColor White
Write-Host "4. Ejecuta este script nuevamente" -ForegroundColor White

# PLACEHOLDER - Reemplazar con el ID real del primer step
$firstStepId = "REEMPLAZAR_CON_ID_REAL"

if ($firstStepId -eq "REEMPLAZAR_CON_ID_REAL") {
    Write-Host "`n❌ Por favor, ejecuta test-real-module.sql primero y actualiza `$firstStepId" -ForegroundColor Red
    exit
}

# TEST 1: Submit respuesta correcta
Write-Host "`n🧪 TEST 1: Respuesta correcta en módulo real" -ForegroundColor Green

$body = @{
    user_id = $userId
    module_id = $moduleId
    step_id = $firstStepId
    answer = "respuesta de ejemplo"  # Actualizar según el tipo de pregunta
    time_on_task = 45
    hint_requests = 0
    confidence = "high"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" -Method POST -Body $body -ContentType 'application/json'
    
    Write-Host "✅ Evaluación: $($response.evaluation.result)" -ForegroundColor Green
    Write-Host "   Dimensión: $($response.evaluation.cognitive_dimension)" -ForegroundColor Cyan
    Write-Host "   Intervención: $($response.intervention.intervention_type)" -ForegroundColor Yellow
    Write-Host "   Next action: $($response.next_action)" -ForegroundColor Magenta
    
    if ($response.intervention.message) {
        Write-Host "   Mensaje: $($response.intervention.message)" -ForegroundColor White
    }
    
    Write-Host "`n📊 Response completo:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# TEST 2: Verificar progreso
Write-Host "`n🧪 TEST 2: Verificar progreso actualizado" -ForegroundColor Green

try {
    $progress = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/progress/$userId" -Method GET
    
    Write-Host "✅ Progreso obtenido" -ForegroundColor Green
    Write-Host "   Total attempts: $($progress.cognitive_profile.total_attempts)" -ForegroundColor Cyan
    Write-Host "   Accuracy: $($progress.cognitive_profile.accuracy_rate)%" -ForegroundColor Yellow
    
    if ($progress.module_progress.Count -gt 0) {
        Write-Host "`n   Módulos en progreso:" -ForegroundColor Magenta
        foreach ($mod in $progress.module_progress) {
            if ($mod.module_id -eq $moduleId) {
                Write-Host "     - Fracciones: $($mod.completed_steps)/$($mod.total_steps) steps" -ForegroundColor White
                Write-Host "       Comprensión: $($mod.dimension_comprension)" -ForegroundColor Cyan
                Write-Host "       Representación: $($mod.dimension_representacion)" -ForegroundColor Cyan
                Write-Host "       Razonamiento: $($mod.dimension_razonamiento)" -ForegroundColor Cyan
            }
        }
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "✅ Testing completado" -ForegroundColor Green
