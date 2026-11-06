# Quick Check - Language Enrichment Progress

Write-Host "`n📊 VERIFICACION RAPIDA - LANGUAGE ENRICHMENT" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Método 1: Verificar via Supabase (requiere query manual)
Write-Host "`nMétodo 1: Query en Supabase" -ForegroundColor Yellow
Write-Host @"
SELECT 
  COUNT(*) as total_enriched,
  COUNT(*) * 100.0 / 500 as percentage_of_target
FROM kuneo.module_steps ms
JOIN kuneo.modules m ON ms.module_id = m.id
WHERE m.subject = 'language'
  AND ms.enriched_content IS NOT NULL;
"@ -ForegroundColor White

# Método 2: Verificar el archivo de log si existe
Write-Host "`nMétodo 2: Verificar terminal de enrichment" -ForegroundColor Yellow
Write-Host "Terminal ID: bc22297f-16b9-46eb-975f-9f96cd1ec5a7" -ForegroundColor Gray
Write-Host "Usa: Get-Terminal-Output en VS Code" -ForegroundColor Gray

Write-Host "`n" -ForegroundColor Gray
