# Test Completo del Flujo Multi-Step del Adaptive Engine
# Simula un estudiante progresando a través de múltiples steps de un módulo

$baseUrl = "http://localhost:3001"
$userId = "b5d08d8c-2c8a-47aa-85e5-3cd58751f35d"
$moduleId = "0b0f4668-d41e-42b7-a51c-97c5842566b0"  # Fracciones (8 steps enriquecidos)

# Steps del módulo que ya validamos (usaremos solo estos 2 para el test)
$steps = @(
    @{ id = "698b6f8b-015f-48c6-85cb-d50d9ca84ac4"; type = "question"; order = 1; answer_type = "option" },
    @{ id = "60f7f5e0-ccf2-4a87-8fcd-f74df8758677"; type = "error_analysis"; order = 7; answer_type = "option" }
)

Write-Host "`n=== TEST DE FLUJO COMPLETO ADAPTIVE ENGINE ===" -ForegroundColor Cyan
Write-Host "Modulo: Fracciones" -ForegroundColor White
Write-Host "Total steps: $($steps.Count)`n" -ForegroundColor White

$totalCorrect = 0
$totalIncorrect = 0
$totalHints = 0
$interventions = @()

# Simular progreso a través de los steps
foreach ($step in $steps) {  # Todos los steps disponibles
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "STEP $($step.order): $($step.type)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    
    $attemptNumber = 1
    $stepCompleted = $false
    
    # Simular hasta 3 intentos por step
    while (-not $stepCompleted -and $attemptNumber -le 3) {
        Write-Host "`n--- Intento $attemptNumber ---" -ForegroundColor White
        
        # Simular diferentes tipos de respuestas según el intento
        $answer = switch ($attemptNumber) {
            1 { 
                # Primer intento: a veces correcto, a veces incorrecto
                if ($step.order % 2 -eq 0) { "1" } else { "0" }  # Alternar
            }
            2 { "0" }  # Segundo intento: siempre correcto
            3 { "0" }  # Tercer intento: siempre correcto
        }
        
        $timeSpent = 15 + ($attemptNumber * 5)  # Más tiempo en intentos posteriores
        
        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" -Method Post -ContentType "application/json" -Body (@{
                user_id = $userId
                module_id = $moduleId
                step_id = $step.id
                answer = $answer
                attempt_number = $attemptNumber
                time_on_task = $timeSpent
            } | ConvertTo-Json) -ErrorAction Stop
            
            # Mostrar resultado
            $resultColor = if ($response.evaluation.result -eq "correct") { "Green" } elseif ($response.evaluation.result -eq "incorrect") { "Red" } else { "Yellow" }
            Write-Host "  Answer: $answer" -ForegroundColor White
            Write-Host "  Result: $($response.evaluation.result)" -ForegroundColor $resultColor
            Write-Host "  Dimension: $($response.evaluation.cognitive_dimension)" -ForegroundColor Cyan
            Write-Host "  Confidence: $($response.evaluation.confidence)" -ForegroundColor Gray
            
            # Tracking
            if ($response.evaluation.result -eq "correct") {
                $totalCorrect++
                $stepCompleted = $true
            } else {
                $totalIncorrect++
            }
            
            # Mostrar misconception si existe
            if ($response.evaluation.misconception_key) {
                Write-Host "  [!] Misconception detectado: $($response.evaluation.misconception_key)" -ForegroundColor Magenta
            }
            
            # Mostrar intervención
            if ($response.intervention) {
                Write-Host "  Intervention: $($response.intervention.type)" -ForegroundColor Yellow
                
                if ($response.intervention.type -ne "silence" -and $response.intervention.type -ne "none") {
                    $interventions += @{
                        step = $step.order
                        type = $response.intervention.type
                        level = $response.intervention.level
                    }
                    
                    if ($response.intervention.feedback_text) {
                        Write-Host "  Feedback: $($response.intervention.feedback_text.Substring(0, [Math]::Min(80, $response.intervention.feedback_text.Length)))..." -ForegroundColor Gray
                    }
                }
            }
            
            # Mostrar next action
            Write-Host "  Next action: $($response.nextAction.type)" -ForegroundColor Cyan
            
            # Si no completó el step y puede pedir hint
            if (-not $stepCompleted -and $attemptNumber -eq 2) {
                Write-Host "`n  [?] Solicitando hint..." -ForegroundColor Cyan
                
                try {
                    $hint = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/request-hint" -Method Post -ContentType "application/json" -Body (@{
                        user_id = $userId
                        module_id = $moduleId
                        step_id = $step.id
                        current_hint_level = 0
                    } | ConvertTo-Json) -ErrorAction Stop
                    
                    Write-Host "  Hint type: $($hint.hint.type)" -ForegroundColor Magenta
                    if ($hint.hint.content) {
                        Write-Host "  Hint: $($hint.hint.content.Substring(0, [Math]::Min(60, $hint.hint.content.Length)))..." -ForegroundColor Gray
                    }
                    $totalHints++
                } catch {
                    Write-Host "  Error obteniendo hint: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
            
        } catch {
            Write-Host "  [ERROR] $($_.Exception.Message)" -ForegroundColor Red
            break
        }
        
        $attemptNumber++
        Start-Sleep -Milliseconds 500  # Pequeño delay entre intentos
    }
    
    if ($stepCompleted) {
        Write-Host "`n[OK] Step completado!" -ForegroundColor Green
    } else {
        Write-Host "`n[!] Step no completado después de 3 intentos" -ForegroundColor Yellow
    }
}

# Verificar progreso final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VERIFICACION DE PROGRESO FINAL" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

try {
    $progress = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/progress/$userId" -Method Get
    
    Write-Host "`nPerfil Cognitivo:" -ForegroundColor Cyan
    Write-Host "  Total attempts: $($progress.cognitiveProfile.total_attempts)"
    Write-Host "  Accuracy: $([math]::Round($progress.cognitiveProfile.overall_accuracy * 100, 1))%"
    Write-Host "  Comprension: $($progress.cognitiveProfile.comprension_score)"
    Write-Host "  Representacion: $($progress.cognitiveProfile.representacion_score)"
    Write-Host "  Razonamiento: $($progress.cognitiveProfile.razonamiento_score)"
    Write-Host "  Transferencia: $($progress.cognitiveProfile.transferencia_score)"
    Write-Host "  Metacognicion: $($progress.cognitiveProfile.metacognicion_score)"
    
    Write-Host "`nProgreso del Modulo:" -ForegroundColor Cyan
    if ($progress.moduleProgress -and $progress.moduleProgress.Count -gt 0) {
        $modProg = $progress.moduleProgress[0]
        Write-Host "  Steps completados: $($modProg.steps_completed)"
        Write-Host "  Accuracy: $([math]::Round($modProg.overall_accuracy * 100, 1))%"
        Write-Host "  Tiempo total: $($modProg.total_time_seconds)s"
    }
} catch {
    Write-Host "[ERROR] No se pudo obtener el progreso: $($_.Exception.Message)" -ForegroundColor Red
}

# Resumen final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMEN DEL TEST" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Steps testeados: $($steps.Count)" -ForegroundColor White
Write-Host "Respuestas correctas: $totalCorrect" -ForegroundColor Green
Write-Host "Respuestas incorrectas: $totalIncorrect" -ForegroundColor Red
Write-Host "Hints solicitados: $totalHints" -ForegroundColor Cyan
Write-Host "Intervenciones recibidas: $($interventions.Count)" -ForegroundColor Yellow

if ($interventions.Count -gt 0) {
    Write-Host "`nIntervenciones detalladas:" -ForegroundColor Yellow
    foreach ($int in $interventions) {
        Write-Host "  Step $($int.step): $($int.type) (nivel $($int.level))" -ForegroundColor Gray
    }
}

Write-Host "`n[OK] TEST COMPLETADO" -ForegroundColor Green
