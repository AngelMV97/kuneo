# Test simple del Adaptive Engine con modulo real

$baseUrl = "http://localhost:3001"
$userId = "b5d08d8c-2c8a-47aa-85e5-3cd58751f35d"
$moduleId = "0b0f4668-d41e-42b7-a51c-97c5842566b0"
$step1 = "698b6f8b-015f-48c6-85cb-d50d9ca84ac4"

Write-Host "`n=== TEST ADAPTIVE ENGINE ===" -ForegroundColor Cyan

# TEST 1: Submit respuesta correcta
Write-Host "`nTEST 1: Respuesta correcta..." -ForegroundColor Yellow

$body = @{
    user_id = $userId
    module_id = $moduleId
    step_id = $step1
    answer = "0"
    time_on_task = 45
    hint_requests = 0
    confidence = "high"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" -Method POST -Body $body -ContentType 'application/json'
    
    Write-Host "Result: $($response.evaluation.result)" -ForegroundColor Green
    Write-Host "Dimension: $($response.evaluation.cognitive_dimension)" -ForegroundColor Cyan
    Write-Host "Intervention: $($response.intervention.intervention_type)" -ForegroundColor Yellow
    Write-Host "Next action: $($response.next_action)" -ForegroundColor Magenta
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# TEST 2: Verificar progreso
Write-Host "`nTEST 2: Verificar progreso..." -ForegroundColor Yellow

try {
    $progress = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/progress/$userId" -Method GET
    
    Write-Host "Total attempts: $($progress.cognitive_profile.total_attempts)" -ForegroundColor White
    Write-Host "Accuracy: $($progress.cognitive_profile.accuracy_rate)%" -ForegroundColor Yellow
    Write-Host "Comprension: $($progress.cognitive_profile.dimension_comprension)" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n=== TESTING COMPLETADO ===" -ForegroundColor Green
