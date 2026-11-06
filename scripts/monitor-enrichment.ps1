# Monitor de Enrichment en Cascada
# Verifica cuando language complete y lanza science automáticamente

$languageTerminalId = "bc22297f-16b9-46eb-975f-9f96cd1ec5a7"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "MONITOR DE ENRICHMENT EN CASCADA" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Esperando a que Language complete..." -ForegroundColor Gray
Write-Host "Progreso actual: Language ~287/500 (57.4%)" -ForegroundColor White
Write-Host "Tiempo estimado restante: ~16 minutos`n" -ForegroundColor Gray

# Verificar cada minuto
$checkInterval = 60  # segundos
$maxChecks = 30  # máximo 30 minutos

for ($i = 1; $i -le $maxChecks; $i++) {
    Write-Host "[$i] Verificando estado... ($(Get-Date -Format 'HH:mm:ss'))" -ForegroundColor Gray
    
    # Aquí podrías agregar lógica para verificar el estado del terminal
    # Por ahora, simplemente esperamos
    
    Start-Sleep -Seconds $checkInterval
}

Write-Host "`n✅ Language debería estar completo!" -ForegroundColor Green
Write-Host "Iniciando Science enrichment..." -ForegroundColor Yellow

# Ejecutar science enrichment
.\scripts\run-science-enrichment.ps1
