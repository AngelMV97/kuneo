# Test Comprehensivo - Mathematics: Fracciones
# Según TESTING_PLAN.md - Fase 1.1

$baseUrl = "http://localhost:3001"
$userId = "b5d08d8c-2c8a-47aa-85e5-3cd58751f35d"
$moduleId = "0b0f4668-d41e-42b7-a51c-97c5842566b0"  # Fracciones

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST COMPREHENSIVO - MATHEMATICS: FRACCIONES" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Obtener todos los steps del módulo
$stepsUrl = "$baseUrl/api/modules/$moduleId"
$moduleData = Invoke-RestMethod -Uri $stepsUrl -Method Get
$steps = $moduleData.steps | Sort-Object step_order

Write-Host "📊 Módulo: $($moduleData.title)" -ForegroundColor White
Write-Host "   Steps disponibles: $($steps.Count)" -ForegroundColor Gray
Write-Host "   Concepto: $($moduleData.core_concept)`n" -ForegroundColor Gray

# Variables para tracking
$totalTests = 0
$passedTests = 0
$failedTests = 0
$scenarios = @()

# Función para testear un escenario
function Test-Scenario {
    param(
        [string]$name,
        [string]$stepId,
        [string]$answer,
        [string]$expectedResult,
        [int]$attemptNumber = 1
    )
    
    $script:totalTests++
    Write-Host "🧪 Escenario: $name" -ForegroundColor Cyan
    
    $body = @{
        user_id = $userId
        module_id = $moduleId
        step_id = $stepId
        answer = $answer
        attempt_number = $attemptNumber
        response_time_seconds = if ($name -like "*rápida*") { 10 } else { 30 }
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body
        
        if ($response.result -eq $expectedResult) {
            Write-Host "   ✅ PASS: Result = $($response.result)" -ForegroundColor Green
            Write-Host "      Dimension: $($response.evaluation.cognitive_dimension)" -ForegroundColor Gray
            Write-Host "      Confidence: $($response.evaluation.confidence)" -ForegroundColor Gray
            if ($response.evaluation.misconception_key) {
                Write-Host "      Misconception detected: $($response.evaluation.misconception_key)" -ForegroundColor Yellow
            }
            $script:passedTests++
            return @{ success = $true; response = $response }
        } else {
            Write-Host "   ❌ FAIL: Expected $expectedResult but got $($response.result)" -ForegroundColor Red
            $script:failedTests++
            return @{ success = $false; response = $response }
        }
    } catch {
        Write-Host "   ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $script:failedTests++
        return @{ success = $false; error = $_.Exception.Message }
    }
}

# Función para test de hints
function Test-HintSystem {
    param([string]$stepId)
    
    Write-Host "`n🧪 Testing Hint System" -ForegroundColor Cyan
    
    foreach ($level in 1..3) {
        $script:totalTests++
        $body = @{
            user_id = $userId
            step_id = $stepId
            current_hint_level = $level - 1
        } | ConvertTo-Json
        
        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/request-hint" `
                -Method Post `
                -ContentType "application/json" `
                -Body $body
            
            Write-Host "   ✅ Hint Level $level`: $($response.hint.type)" -ForegroundColor Green
            Write-Host "      Content`: $($response.hint.content.Substring(0, [Math]::Min(50, $response.hint.content.Length)))..." -ForegroundColor Gray
            $script:passedTests++
        } catch {
            Write-Host "   ❌ Hint Level $level FAILED: $($_.Exception.Message)" -ForegroundColor Red
            $script:failedTests++
        }
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FASE 1: RESPUESTAS CORRECTAS CONSECUTIVAS" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1-3: Respuestas correctas en steps diferentes
$result1 = Test-Scenario -name "Respuesta correcta Step 1" `
    -stepId $steps[0].id `
    -answer "0" `
    -expectedResult "correct"

Start-Sleep -Seconds 1

$result2 = Test-Scenario -name "Respuesta correcta Step 2" `
    -stepId $steps[1].id `
    -answer "0" `
    -expectedResult "correct"

Start-Sleep -Seconds 1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FASE 2: RESPUESTAS INCORRECTAS" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 4: Respuesta incorrecta sin misconception
$result3 = Test-Scenario -name "Respuesta incorrecta (random)" `
    -stepId $steps[2].id `
    -answer "3" `
    -expectedResult "incorrect"

Start-Sleep -Seconds 1

# Test 5: Respuesta incorrecta con misconception (si existe)
$result4 = Test-Scenario -name "Respuesta incorrecta (misconception pattern)" `
    -stepId $steps[0].id `
    -answer "1" `
    -expectedResult "incorrect" `
    -attemptNumber 2

Start-Sleep -Seconds 1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FASE 3: SILENCE RULE (Respuesta rápida)" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 6: Respuesta correcta rápida (debería tener menos feedback)
$result5 = Test-Scenario -name "Respuesta correcta rápida" `
    -stepId $steps[3].id `
    -answer "0" `
    -expectedResult "correct"

if ($result5.response.intervention.type -eq "none" -or $result5.response.intervention.type -eq "") {
    Write-Host "   ✅ Silence rule aplicada correctamente" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Silence rule no aplicada (intervention: $($result5.response.intervention.type))" -ForegroundColor Yellow
}

Start-Sleep -Seconds 1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FASE 4: HINT SYSTEM" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Test-HintSystem -stepId $steps[0].id

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FASE 5: PROGRESO MULTI-DIMENSIONAL" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$script:totalTests++
try {
    $progressUrl = "$baseUrl/api/adaptive/progress/$userId"
    $progress = Invoke-RestMethod -Uri $progressUrl -Method Get
    
    Write-Host "✅ Cognitive Profile:" -ForegroundColor Green
    Write-Host "   Total attempts: $($progress.cognitive_profile.total_attempts)" -ForegroundColor White
    Write-Host "   Accuracy: $($progress.cognitive_profile.overall_accuracy * 100)%" -ForegroundColor White
    Write-Host "`n   Dimensiones:" -ForegroundColor Gray
    Write-Host "   - Comprension: $($progress.cognitive_profile.comprension_score)" -ForegroundColor White
    Write-Host "   - Representacion: $($progress.cognitive_profile.representacion_score)" -ForegroundColor White
    Write-Host "   - Razonamiento: $($progress.cognitive_profile.razonamiento_score)" -ForegroundColor White
    Write-Host "   - Transferencia: $($progress.cognitive_profile.transferencia_score)" -ForegroundColor White
    Write-Host "   - Metacognicion: $($progress.cognitive_profile.metacognicion_score)" -ForegroundColor White
    
    # Verificar que al menos una dimensión se actualizó
    $anyDimensionUpdated = $progress.cognitive_profile.comprension_score -gt 0 -or
                           $progress.cognitive_profile.representacion_score -gt 0 -or
                           $progress.cognitive_profile.razonamiento_score -gt 0
    
    if ($anyDimensionUpdated) {
        Write-Host "`n   ✅ Al menos una dimensión se actualizó" -ForegroundColor Green
        $script:passedTests++
    } else {
        Write-Host "`n   ⚠️  Ninguna dimensión se actualizó" -ForegroundColor Yellow
        $script:failedTests++
    }
} catch {
    Write-Host "❌ Error obteniendo progreso: $($_.Exception.Message)" -ForegroundColor Red
    $script:failedTests++
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FASE 6: MODULE PROGRESS" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$script:totalTests++
try {
    $moduleProgressUrl = "$baseUrl/api/adaptive/progress/$userId"
    $fullProgress = Invoke-RestMethod -Uri $moduleProgressUrl -Method Get
    
    $moduleProgress = $fullProgress.module_progress | Where-Object { $_.module_id -eq $moduleId }
    
    if ($moduleProgress) {
        Write-Host "✅ Module Progress encontrado:" -ForegroundColor Green
        Write-Host "   Steps completados: $($moduleProgress.steps_completed)" -ForegroundColor White
        Write-Host "   Mastery level: $($moduleProgress.mastery_level)" -ForegroundColor White
        Write-Host "   Struggle points: $($moduleProgress.struggle_points)" -ForegroundColor White
        $script:passedTests++
    } else {
        Write-Host "⚠️  Module Progress no encontrado" -ForegroundColor Yellow
        $script:failedTests++
    }
} catch {
    Write-Host "❌ Error obteniendo module progress: $($_.Exception.Message)" -ForegroundColor Red
    $script:failedTests++
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMEN FINAL" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📊 Total tests: $totalTests" -ForegroundColor White
Write-Host "✅ Passed: $passedTests ($([Math]::Round(($passedTests / $totalTests) * 100, 2))%)" -ForegroundColor Green
Write-Host "❌ Failed: $failedTests ($([Math]::Round(($failedTests / $totalTests) * 100, 2))%)" -ForegroundColor Red

if ($failedTests -eq 0) {
    Write-Host "`n🎉 TODOS LOS TESTS PASARON!" -ForegroundColor Green
    Write-Host "✅ Mathematics: Fracciones - VALIDADO" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Algunos tests fallaron - Revisar detalles arriba" -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
