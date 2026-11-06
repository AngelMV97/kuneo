# Test Cross-Subject Journey - Fase 2
# Simula estudiante usando multiples asignaturas

$baseUrl = "http://localhost:3001"
$userId = "b5d08d8c-2c8a-47aa-85e5-3cd58751f35d"

$mathModuleId = "0b0f4668-d41e-42b7-a51c-97c5842566b0"
$mathStep1 = "698b6f8b-015f-48c6-85cb-d50d9ca84ac4"
$mathStep2 = "60f7f5e0-ccf2-4a87-8fcd-f74df8758677"

$langModuleId = "ccec3bf2-66e2-427d-90b4-b8d8f09171cf"
$langStep1 = "d3980057-e4cf-4f3f-8e74-4a665c705217"

Write-Host "`n========================================"
Write-Host "TEST CROSS-SUBJECT JOURNEY"
Write-Host "========================================`n"

$passedTests = 0
$failedTests = 0
$totalTests = 0

# Initial profile
Write-Host "Initial Profile"
try {
    $initialProfile = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/progress/$userId" -Method Get
    Write-Host "  Attempts: $($initialProfile.cognitive_profile.total_attempts)"
    Write-Host "  Comprension: $($initialProfile.cognitive_profile.comprension_score)`n"
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)`n" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Math session
Write-Host "`n=== MATHEMATICS SESSION ===" -ForegroundColor Yellow

Write-Host "`nMath Q1 (correct)"
$totalTests++
try {
    $body = @{
        user_id = $userId
        module_id = $mathModuleId
        step_id = $mathStep1
        answer = "0"
        attempt_number = 100
        response_time_seconds = 30
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" -Method Post -ContentType "application/json" -Body $body
    
    Write-Host "  Result: $($response.evaluation.result)"
    Write-Host "  Delta: $($response.progress_update.mastery_delta)"
    
    if ($response.evaluation.result -eq "correct") {
        Write-Host "  PASS" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  FAIL" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    $failedTests++
}

Start-Sleep -Seconds 1

Write-Host "`nMath Q2 (incorrect)"
$totalTests++
try {
    $body = @{
        user_id = $userId
        module_id = $mathModuleId
        step_id = $mathStep2
        answer = "3"
        attempt_number = 1
        response_time_seconds = 35
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" -Method Post -ContentType "application/json" -Body $body
    
    Write-Host "  Result: $($response.evaluation.result)"
    Write-Host "  Delta: $($response.progress_update.mastery_delta)"
    
    if ($response.evaluation.result -eq "incorrect") {
        Write-Host "  PASS" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  FAIL" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    $failedTests++
}

Start-Sleep -Seconds 1

# Language session
Write-Host "`n=== LANGUAGE SESSION ===" -ForegroundColor Yellow

Write-Host "`nLanguage Q1 (correct)"
$totalTests++
try {
    $body = @{
        user_id = $userId
        module_id = $langModuleId
        step_id = $langStep1
        answer = "0"
        attempt_number = 100
        response_time_seconds = 40
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" -Method Post -ContentType "application/json" -Body $body
    
    Write-Host "  Result: $($response.evaluation.result)"
    Write-Host "  Delta: $($response.progress_update.mastery_delta)"
    
    if ($response.evaluation.result -eq "correct") {
        Write-Host "  PASS" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  FAIL" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    $failedTests++
}

Start-Sleep -Seconds 1

Write-Host "`nLanguage Q2 (fast correct)"
$totalTests++
try {
    $body = @{
        user_id = $userId
        module_id = $langModuleId
        step_id = $langStep1
        answer = "0"
        attempt_number = 101
        response_time_seconds = 10
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" -Method Post -ContentType "application/json" -Body $body
    
    Write-Host "  Result: $($response.evaluation.result)"
    Write-Host "  Time: 10s (fast)"
    
    if ($response.evaluation.result -eq "correct") {
        Write-Host "  PASS" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  FAIL" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    $failedTests++
}

Start-Sleep -Seconds 1

# Final profile
Write-Host "`n=== FINAL PROFILE ===" -ForegroundColor Cyan
$totalTests++
try {
    $finalProfile = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/progress/$userId" -Method Get
    
    Write-Host "  Attempts: $($finalProfile.cognitive_profile.total_attempts)"
    Write-Host "  Comprension: $($finalProfile.cognitive_profile.comprension_score)"
    Write-Host "  Razonamiento: $($finalProfile.cognitive_profile.razonamiento_score)"
    
    if ($finalProfile.cognitive_profile.total_attempts -gt $initialProfile.cognitive_profile.total_attempts) {
        Write-Host "  Profile evolved - PASS" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  Profile not evolved - FAIL" -ForegroundColor Red
        $failedTests++
    }
    
    # Module progress
    Write-Host "`n  Module Progress:"
    $mathProgress = $finalProfile.module_progress | Where-Object { $_.module_id -eq $mathModuleId }
    $langProgress = $finalProfile.module_progress | Where-Object { $_.module_id -eq $langModuleId }
    
    if ($mathProgress) {
        Write-Host "    Math: $($mathProgress.steps_completed) steps, mastery $($mathProgress.mastery_level)"
    }
    if ($langProgress) {
        Write-Host "    Lang: $($langProgress.steps_completed) steps, mastery $($langProgress.mastery_level)"
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    $failedTests++
}

Write-Host "`n========================================"
Write-Host "RESUMEN"
Write-Host "========================================`n"

Write-Host "Total: $totalTests"
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red

if ($failedTests -eq 0) {
    Write-Host "`nCROSS-SUBJECT JOURNEY - VALIDADO`n" -ForegroundColor Green
} else {
    Write-Host "`nAlgunos tests fallaron`n" -ForegroundColor Yellow
}
