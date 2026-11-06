# Test Simplificado - Mathematics: Fracciones
# Fase 1.1 del TESTING_PLAN.md

$baseUrl = "http://localhost:3001"
$userId = "b5d08d8c-2c8a-47aa-85e5-3cd58751f35d"
$moduleId = "0b0f4668-d41e-42b7-a51c-97c5842566b0"

# Steps conocidos del módulo Fracciones
$step1 = "698b6f8b-015f-48c6-85cb-d50d9ca84ac4"
$step7 = "60f7f5e0-ccf2-4a87-8fcd-f74df8758677"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST MATHEMATICS - FRACCIONES" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$passedTests = 0
$failedTests = 0
$totalTests = 0

# Test 1`: Respuesta correcta
Write-Host "Test 1`: Respuesta correcta (answer=0)" -ForegroundColor Cyan
$totalTests++
try {
    $body = @{
        user_id = $userId
        module_id = $moduleId
        step_id = $step1
        answer = "0"
        attempt_number = 1
        response_time_seconds = 30
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "  Result`: $($response.evaluation.result)" -ForegroundColor White
    Write-Host "  Dimension`: $($response.evaluation.cognitive_dimension)" -ForegroundColor Gray
    Write-Host "  Confidence`: $($response.evaluation.confidence)" -ForegroundColor Gray
    
    if ($response.evaluation.result -eq "correct") {
        Write-Host "  ✅ PASS`n" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  ❌ FAIL - Expected correct`n" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ❌ ERROR`: $($_.Exception.Message)`n" -ForegroundColor Red
    $failedTests++
}

Start-Sleep -Seconds 1

# Test 2`: Respuesta incorrecta
Write-Host "Test 2`: Respuesta incorrecta (answer=3)" -ForegroundColor Cyan
$totalTests++
try {
    $body = @{
        user_id = $userId
        module_id = $moduleId
        step_id = $step1
        answer = "3"
        attempt_number = 2
        response_time_seconds = 35
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "  Result`: $($response.evaluation.result)" -ForegroundColor White
    Write-Host "  Dimension`: $($response.evaluation.cognitive_dimension)" -ForegroundColor Gray
    Write-Host "  Intervention type`: $($response.intervention.type)" -ForegroundColor Gray
    
    if ($response.evaluation.result -eq "incorrect") {
        Write-Host "  ✅ PASS`n" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  ❌ FAIL - Expected incorrect`n" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ❌ ERROR`: $($_.Exception.Message)`n" -ForegroundColor Red
    $failedTests++
}

Start-Sleep -Seconds 1

# Test 3`: Request hint level 1
Write-Host "Test 3`: Request hint level 1" -ForegroundColor Cyan
$totalTests++
try {
    $body = @{
        user_id = $userId
        step_id = $step1
        current_hint_level = 0
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/request-hint" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "  Hint type`: $($response.hint.type)" -ForegroundColor White
    
    if ($response.hint) {
        Write-Host "  ✅ PASS`n" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  ❌ FAIL - No hint returned`n" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ❌ ERROR`: $($_.Exception.Message)`n" -ForegroundColor Red
    $failedTests++
}

Start-Sleep -Seconds 1

# Test 4`: Respuesta rápida (silence rule)
Write-Host "Test 4`: Respuesta rápida - Silence rule" -ForegroundColor Cyan
$totalTests++
try {
    $body = @{
        user_id = $userId
        module_id = $moduleId
        step_id = $step7
        answer = "0"
        attempt_number = 1
        response_time_seconds = 8
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "  Result`: $($response.evaluation.result)" -ForegroundColor White
    Write-Host "  Response time`: 8s (fast)" -ForegroundColor Gray
    Write-Host "  Intervention`: $($response.intervention.type)" -ForegroundColor Gray
    
    if ($response.evaluation.result -eq "correct") {
        Write-Host "  ✅ PASS`n" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  ❌ FAIL`n" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ❌ ERROR`: $($_.Exception.Message)`n" -ForegroundColor Red
    $failedTests++
}

Start-Sleep -Seconds 1

# Test 5`: Verificar cognitive profile
Write-Host "Test 5`: Cognitive Profile" -ForegroundColor Cyan
$totalTests++
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/progress/$userId" -Method Get
    
    Write-Host "  Total attempts`: $($response.cognitive_profile.total_attempts)" -ForegroundColor White
    Write-Host "  Accuracy`: $([Math]::Round($response.cognitive_profile.overall_accuracy * 100, 2))%" -ForegroundColor White
    Write-Host "  Comprension`: $($response.cognitive_profile.comprension_score)" -ForegroundColor Gray
    Write-Host "  Representacion`: $($response.cognitive_profile.representacion_score)" -ForegroundColor Gray
    
    if ($response.cognitive_profile.total_attempts -gt 0) {
        Write-Host "  ✅ PASS`n" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  ❌ FAIL - No attempts recorded`n" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ❌ ERROR`: $($_.Exception.Message)`n" -ForegroundColor Red
    $failedTests++
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Total tests`: $totalTests" -ForegroundColor White
Write-Host "Passed`: $passedTests" -ForegroundColor Green
Write-Host "Failed`: $failedTests" -ForegroundColor Red

if ($failedTests -eq 0) {
    Write-Host "`n✅ MATHEMATICS: FRACCIONES - VALIDADO" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Algunos tests fallaron" -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
