# Test Natural Sciences - Ciencias Naturales
# Fase 1.3 del TESTING_PLAN.md

$baseUrl = "http://localhost:3001"
$userId = "b5d08d8c-2c8a-47aa-85e5-3cd58751f35d"

# Modulo con step enriched (correct_options: [0])
$moduleId = "438c8d24-b8ee-45b1-b10d-64361e4a6f7f"
$step1 = "8c53004c-8811-4e0f-97b5-f1a8d1124bb9"

Write-Host "`n========================================"
Write-Host "TEST NATURAL SCIENCES - CIENCIAS NATURALES"
Write-Host "========================================`n"

$passedTests = 0
$failedTests = 0
$totalTests = 0

# Test 1
Write-Host "Test 1: Respuesta correcta"
$totalTests++
try {
    $body = @{
        user_id = $userId
        module_id = $moduleId
        step_id = $step1
        answer = "0"
        attempt_number = 1
        response_time_seconds = 35
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" -Method Post -ContentType "application/json" -Body $body
    
    Write-Host "  Result: $($response.evaluation.result)"
    Write-Host "  Dimension: $($response.evaluation.cognitive_dimension)"
    
    if ($response.evaluation.result -eq "correct") {
        Write-Host "  PASS`n" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  FAIL`n" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)`n" -ForegroundColor Red
    $failedTests++
}

Start-Sleep -Seconds 1

# Test 2
Write-Host "Test 2: Respuesta incorrecta"
$totalTests++
try {
    $body = @{
        user_id = $userId
        module_id = $moduleId
        step_id = $step1
        answer = "3"
        attempt_number = 2
        response_time_seconds = 40
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" -Method Post -ContentType "application/json" -Body $body
    
    Write-Host "  Result: $($response.evaluation.result)"
    
    if ($response.evaluation.result -eq "incorrect") {
        Write-Host "  PASS`n" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  FAIL`n" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)`n" -ForegroundColor Red
    $failedTests++
}

Start-Sleep -Seconds 1

# Test 3
Write-Host "Test 3: Request hint"
$totalTests++
try {
    $body = @{
        user_id = $userId
        step_id = $step1
        current_hint_level = 0
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/request-hint" -Method Post -ContentType "application/json" -Body $body
    
    Write-Host "  Hint type: $($response.hint.type)"
    
    if ($response.hint) {
        Write-Host "  PASS`n" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  FAIL`n" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)`n" -ForegroundColor Red
    $failedTests++
}

Start-Sleep -Seconds 1

# Test 4
Write-Host "Test 4: Cognitive Profile"
$totalTests++
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/progress/$userId" -Method Get
    
    Write-Host "  Total attempts: $($response.cognitive_profile.total_attempts)"
    Write-Host "  Comprension: $($response.cognitive_profile.comprension_score)"
    Write-Host "  Razonamiento: $($response.cognitive_profile.razonamiento_score)"
    
    if ($response.cognitive_profile.total_attempts -gt 0) {
        Write-Host "  PASS`n" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  FAIL`n" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)`n" -ForegroundColor Red
    $failedTests++
}

Write-Host "========================================"
Write-Host "RESUMEN"
Write-Host "========================================`n"

Write-Host "Total tests: $totalTests"
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red

if ($failedTests -eq 0) {
    Write-Host "`nNATURAL SCIENCES - VALIDADO`n" -ForegroundColor Green
} else {
    Write-Host "`nAlgunos tests fallaron`n" -ForegroundColor Yellow
}
