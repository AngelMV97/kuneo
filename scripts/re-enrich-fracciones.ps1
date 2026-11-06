# ============================================
# RE-ENRIQUECER MÓDULO DE FRACCIONES
# ============================================
# Ejecuta el nuevo enrichment.js con estructura correcta
# ============================================

Write-Host "`n🔄 RE-ENRICHMENT: Módulo de Fracciones" -ForegroundColor Cyan
Write-Host "=" * 60

# IDs
$moduleId = "0b0f4668-d41e-42b7-a51c-97c5842566b0"

# PASO 1: Limpiar enriched_content antiguo
Write-Host "`n📋 PASO 1: Limpiar enriched_content antiguo" -ForegroundColor Yellow
Write-Host "   Ejecuta en Supabase SQL Editor:" -ForegroundColor White
Write-Host "   scripts/clear-old-enrichment.sql" -ForegroundColor Cyan
Write-Host ""
Read-Host "   Presiona Enter cuando hayas ejecutado el script SQL"

# PASO 2: Verificar que tenemos OpenAI API key
Write-Host "`n🔑 PASO 2: Verificar OpenAI API Key" -ForegroundColor Yellow

if (-not (Test-Path ".\server\.env")) {
    Write-Host "   ❌ No se encuentra server\.env" -ForegroundColor Red
    Write-Host "   Crea el archivo con: OPENAI_API_KEY=tu-key" -ForegroundColor White
    exit
}

$envContent = Get-Content ".\server\.env" -Raw
if ($envContent -match "OPENAI_API_KEY=") {
    Write-Host "   ✅ OpenAI API Key encontrada" -ForegroundColor Green
} else {
    Write-Host "   ❌ OPENAI_API_KEY no encontrada en .env" -ForegroundColor Red
    Write-Host "   Agrega: OPENAI_API_KEY=tu-key" -ForegroundColor White
    exit
}

# PASO 3: Ejecutar enrichment
Write-Host "`n🚀 PASO 3: Ejecutando enrichment..." -ForegroundColor Yellow
Write-Host "   Módulo: ¿Cómo entender fracciones?" -ForegroundColor White
Write-Host "   Steps: 8" -ForegroundColor White
Write-Host "   Tiempo estimado: ~30 segundos (2s delay entre steps)" -ForegroundColor Cyan
Write-Host ""

Set-Location server

try {
    # Ejecutar enrichment.js para un módulo específico
    node enrichment.js module $moduleId
    
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "`n✅ Enrichment completado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Enrichment falló con código: $exitCode" -ForegroundColor Red
        Set-Location ..
        exit
    }
    
} catch {
    Write-Host "`n❌ Error ejecutando enrichment: $_" -ForegroundColor Red
    Set-Location ..
    exit
}

Set-Location ..

# PASO 4: Verificar resultados
Write-Host "`n📊 PASO 4: Verificar resultados" -ForegroundColor Yellow
Write-Host "   Ejecuta en Supabase SQL Editor:" -ForegroundColor White
Write-Host "   scripts/test-real-module.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Verifica que ahora sí:" -ForegroundColor White
Write-Host "   - cognitive_dimension tiene valores" -ForegroundColor Cyan
Write-Host "   - answer_type tiene valores" -ForegroundColor Cyan
Write-Host "   - expected_answer existe" -ForegroundColor Cyan
Write-Host "   - step_config existe" -ForegroundColor Cyan

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "✅ Script completado" -ForegroundColor Green
Write-Host "📝 Siguiente: Ejecutar test-real-module.sql para validar" -ForegroundColor Yellow
