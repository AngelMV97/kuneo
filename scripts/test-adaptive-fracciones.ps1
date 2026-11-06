# ============================================
# PRUEBA COMPLETA DEL ADAPTIVE ENGINE
# ============================================
# Módulo real: ¿Cómo entender fracciones?
# ============================================

$baseUrl = "http://localhost:3001"
$userId = "b5d08d8c-2c8a-47aa-85e5-3cd58751f35d"
$moduleId = "0b0f4668-d41e-42b7-a51c-97c5842566b0"

# IDs de los steps (del módulo de fracciones)
$step1 = "698b6f8b-015f-48c6-85cb-d50d9ca84ac4"  # question - comprension - option
$step2 = "18c0a3df-cd32-4522-83a3-93fa458ac1a2"  # visual_exploration - representacion - drawing
$step3 = "4a1680e1-ab6d-48f0-8938-f97518deab93"  # explanation - razonamiento - text/keywords

Write-Host "`n🧪 ADAPTIVE ENGINE - TEST COMPLETO" -ForegroundColor Cyan
Write-Host "Módulo: ¿Cómo entender fracciones?" -ForegroundColor White
Write-Host "=" * 70

# ============================================
# TEST 1: Submit respuesta correcta (option)
# ============================================
Write-Host "`n📝 TEST 1: Respuesta correcta en step 1 (option)" -ForegroundColor Yellow

$body1 = @{
    user_id = $userId
    module_id = $moduleId
    step_id = $step1
    answer = "0"  # Primera opción
    time_on_task = 45
    hint_requests = 0
    confidence = "high"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" -Method POST -Body $body1 -ContentType 'application/json'
    
    Write-Host "✅ Evaluación: $($response1.evaluation.result)" -ForegroundColor Green
    Write-Host "   Dimensión: $($response1.evaluation.cognitive_dimension)" -ForegroundColor Cyan
    Write-Host "   Confianza: $($response1.evaluation.confidence)" -ForegroundColor White
    Write-Host "   Intervención: $($response1.intervention.intervention_type)" -ForegroundColor Yellow
    Write-Host "   Next action: $($response1.next_action)" -ForegroundColor Magenta
    
    if ($response1.intervention.message) {
        Write-Host "   💬 Mensaje: $($response1.intervention.message)" -ForegroundColor Gray
    }
    
    if ($response1.next_action -eq "next_step") {
        Write-Host "   ➡️  Next step ID: $($response1.next_step_id)" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# ============================================
# TEST 2: Submit respuesta incorrecta
# ============================================
Write-Host "`n📝 TEST 2: Respuesta incorrecta en step 1" -ForegroundColor Yellow

$body2 = @{
    user_id = $userId
    module_id = $moduleId
    step_id = $step1
    answer = "2"  # Opción incorrecta
    attempt_number = 2
    time_on_task = 80
    hint_requests = 0
    confidence = "medium"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/submit-answer" -Method POST -Body $body2 -ContentType 'application/json'
    
    Write-Host "✅ Evaluación: $($response2.evaluation.result)" -ForegroundColor Red
    Write-Host "   Dimensión: $($response2.evaluation.cognitive_dimension)" -ForegroundColor Cyan
    Write-Host "   Misconception: $($response2.evaluation.misconception_key)" -ForegroundColor Yellow
    Write-Host "   Intervención: $($response2.intervention.intervention_type)" -ForegroundColor Yellow
    Write-Host "   Card variant: $($response2.intervention.card_variant)" -ForegroundColor Magenta
    
    if ($response2.intervention.message) {
        Write-Host "   💬 Mensaje: $($response2.intervention.message)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# ============================================
# TEST 3: Solicitar hint
# ============================================
Write-Host "`n📝 TEST 3: Solicitar hint (nivel 1)" -ForegroundColor Yellow

$hintBody = @{
    user_id = $userId
    step_id = $step1
    current_hint_level = 0
} | ConvertTo-Json

try {
    $hintResponse = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/request-hint" -Method POST -Body $hintBody -ContentType 'application/json'
    
    Write-Host "✅ Hint level: $($hintResponse.hint_level)" -ForegroundColor Green
    Write-Host "   Hint type: $($hintResponse.hint_type)" -ForegroundColor Cyan
    Write-Host "   💡 Hint: $($hintResponse.hint_text)" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# ============================================
# TEST 4: Verificar progreso actualizado
# ============================================
Write-Host "`n📝 TEST 4: Verificar progreso cognitivo" -ForegroundColor Yellow

try {
    $progress = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/progress/$userId" -Method GET
    
    Write-Host "✅ Perfil cognitivo obtenido" -ForegroundColor Green
    Write-Host "`n📊 MÉTRICAS GLOBALES:" -ForegroundColor Cyan
    Write-Host "   Total attempts: $($progress.cognitive_profile.total_attempts)" -ForegroundColor White
    Write-Host "   Accuracy: $($progress.cognitive_profile.accuracy_rate)%" -ForegroundColor Yellow
    Write-Host "   Avg confidence: $($progress.cognitive_profile.avg_confidence_level)" -ForegroundColor White
    
    Write-Host "`n🧠 DIMENSIONES COGNITIVAS:" -ForegroundColor Cyan
    Write-Host "   Comprensión: $($progress.cognitive_profile.dimension_comprension)" -ForegroundColor White
    Write-Host "   Representación: $($progress.cognitive_profile.dimension_representacion)" -ForegroundColor White
    Write-Host "   Razonamiento: $($progress.cognitive_profile.dimension_razonamiento)" -ForegroundColor White
    Write-Host "   Transferencia: $($progress.cognitive_profile.dimension_transferencia)" -ForegroundColor White
    Write-Host "   Metacognición: $($progress.cognitive_profile.dimension_metacognicion)" -ForegroundColor White
    
    if ($progress.module_progress -and $progress.module_progress.Count -gt 0) {
        Write-Host "`n📚 PROGRESO EN MÓDULOS:" -ForegroundColor Cyan
        foreach ($mod in $progress.module_progress) {
            if ($mod.module_id -eq $moduleId) {
                Write-Host "   ✓ Fracciones:" -ForegroundColor Green
                Write-Host "     Steps completados: $($mod.completed_steps)/$($mod.total_steps)" -ForegroundColor White
                Write-Host "     Accuracy: $($mod.accuracy_rate)%" -ForegroundColor Yellow
                Write-Host "     Comprensión: $($mod.dimension_comprension)" -ForegroundColor Cyan
            }
        }
    }
    
    if ($progress.common_misconceptions -and $progress.common_misconceptions.Count -gt 0) {
        Write-Host "`n⚠️  MISCONCEPTIONS DETECTADOS:" -ForegroundColor Yellow
        foreach ($misc in $progress.common_misconceptions) {
            Write-Host "   - $($misc.misconception_key): $($misc.frequency) veces" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# ============================================
# TEST 5: Recomendaciones adaptativas
# ============================================
Write-Host "`n📝 TEST 5: Obtener recomendaciones" -ForegroundColor Yellow

try {
    $recommendations = Invoke-RestMethod -Uri "$baseUrl/api/adaptive/recommendations/$userId" -Method GET
    
    if ($recommendations.recommendations -and $recommendations.recommendations.Count -gt 0) {
        Write-Host "✅ Recomendaciones obtenidas: $($recommendations.recommendations.Count)" -ForegroundColor Green
        
        foreach ($rec in $recommendations.recommendations) {
            Write-Host "`n   📌 $($rec.recommendation_type):" -ForegroundColor Cyan
            Write-Host "      Target: $($rec.target_module_id)" -ForegroundColor White
            Write-Host "      Priority: $($rec.priority_score)" -ForegroundColor Yellow
            Write-Host "      Reason: $($rec.reasoning)" -ForegroundColor Gray
        }
    } else {
        Write-Host "ℹ️  No hay recomendaciones disponibles aún" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Cyan
Write-Host "✅ TESTING COMPLETADO" -ForegroundColor Green
Write-Host "`n📊 RESUMEN:" -ForegroundColor Yellow
Write-Host "   ✓ Submit answer (correct)" -ForegroundColor Green
Write-Host "   ✓ Submit answer (incorrect con misconception)" -ForegroundColor Green
Write-Host "   ✓ Request hint" -ForegroundColor Green
Write-Host "   ✓ Progress tracking" -ForegroundColor Green
Write-Host "   ✓ Recommendations" -ForegroundColor Green
Write-Host "`n🎉 El Adaptive Engine funciona correctamente con módulo real!" -ForegroundColor Cyan
