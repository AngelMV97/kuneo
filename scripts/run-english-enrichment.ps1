# Script para enriquecer English
# Ejecutar después de Natural Sciences

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ENGLISH ENRICHMENT" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Iniciando enrichment de English (500 steps)..." -ForegroundColor Green
Write-Host "285 módulos disponibles" -ForegroundColor White
Write-Host "Tiempo estimado: ~30 minutos" -ForegroundColor Gray
Write-Host "`nPresiona Ctrl+C para cancelar en cualquier momento`n" -ForegroundColor Gray

cd "d:\USER EAT\ANGEL MOTTA\Ángel Motta\kuneo\server"
node enrichment.js subject english 500
