# Test Language - Comprension Lectora
# Fase 1.2 del TESTING_PLAN.md

$baseUrl = "http://localhost:3001"
$userId = "b5d08d8c-2c8a-47aa-85e5-3cd58751f35d"
$moduleId = "ccec3bf2-66e2-427d-90b4-b8d8f09171cf"
$step1 = "d3980057-e4cf-4f3f-8e74-4a665c705217"

Write-Host "`n========================================"
Write-Host "TEST LANGUAGE - COMPRENSION LECTORA"
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
        response_time_seconds = 40
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
        answer = "2"
        attempt_number = 2
        response_time_seconds = 45
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
    Write-Host "`nLANGUAGE: COMPRENSION - VALIDADO`n" -ForegroundColor Green
} else {
    Write-Host "`nAlgunos tests fallaron`n" -ForegroundColor Yellow
}
