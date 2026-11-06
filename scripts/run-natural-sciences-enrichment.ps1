# Script para enriquecer Natural Sciences
# Ejecutar después de que Language complete

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "NATURAL SCIENCES ENRICHMENT" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Iniciando enrichment de Natural Sciences (500 steps)..." -ForegroundColor Green
Write-Host "300 módulos disponibles" -ForegroundColor White
Write-Host "Tiempo estimado: ~30 minutos" -ForegroundColor Gray
Write-Host "`nPresiona Ctrl+C para cancelar en cualquier momento`n" -ForegroundColor Gray

cd "d:\USER EAT\ANGEL MOTTA\Ángel Motta\kuneo\server"
node enrichment.js subject natural_sciences 500
