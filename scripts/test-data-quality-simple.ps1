# Test Data Quality Validation - Simplified
# Fase 4 del TESTING_PLAN.md

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST DATA QUALITY VALIDATION" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$testsPassed = 0
$testsFailed = 0

$serverPath = "d:\USER EAT\ANGEL MOTTA\Ángel Motta\kuneo\server"

# Test 1: Answer Type Distribution
Write-Host "Test 1: Answer Type Distribution"
node "$serverPath\validate-answer-types.js"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  PASS`n" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  FAIL`n" -ForegroundColor Red
    $testsFailed++
}

# Test 2: Cognitive Dimension Coverage
Write-Host "Test 2: Cognitive Dimension Coverage"
node "$serverPath\validate-cognitive-dimensions.js"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  PASS`n" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  FAIL`n" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Data Structure Consistency
Write-Host "Test 3: Data Structure Consistency"
node "$serverPath\validate-data-consistency.js"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  PASS`n" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  FAIL`n" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Correct Options Quality
Write-Host "Test 4: Correct Options Quality"
node "$serverPath\validate-correct-options.js"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  PASS`n" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  FAIL`n" -ForegroundColor Red
    $testsFailed++
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMEN - DATA QUALITY" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Total tests: $($testsPassed + $testsFailed)"
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })

if ($testsFailed -eq 0) {
    Write-Host "`nDATA QUALITY - VALIDADO" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nAlgunos tests fallaron - Revisar detalles arriba" -ForegroundColor Yellow
    exit 1
}
