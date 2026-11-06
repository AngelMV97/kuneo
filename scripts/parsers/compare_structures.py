"""
Script de comparación entre estructura antigua y nueva del normalizador
"""
import json
from pathlib import Path

def compare_structures():
    base_path = Path(__file__).parent.parent.parent
    
    # Cargar ambos archivos consolidados
    old_file = base_path / 'data' / 'processed' / 'normalized' / 'competency_units' / 'all_competency_units.json'
    
    print("=" * 70)
    print("📊 COMPARACIÓN DE ESTRUCTURAS")
    print("=" * 70)
    
    if not old_file.exists():
        print("\n❌ No se encontró archivo consolidado")
        return
    
    with open(old_file, 'r', encoding='utf-8') as f:
        units = json.load(f)
    
    print(f"\n📁 Archivo: {old_file.name}")
    print(f"📦 Total unidades: {len(units)}")
    
    # Estadísticas
    dbas = [u for u in units if u.get('source') == 'dba']
    standards = [u for u in units if u.get('source') == 'standard']
    
    print(f"\n🔹 DBAs: {len(dbas)}")
    print(f"🔹 Estándares: {len(standards)}")
    
    # Verificar estructura nueva
    print("\n" + "=" * 70)
    print("🔍 VERIFICACIÓN DE ESTRUCTURA SIMPLIFICADA")
    print("=" * 70)
    
    sample = units[0]
    
    print("\n✅ Campos en nivel superior:")
    top_level_fields = ['id', 'type', 'source', 'subject', 'grade_range', 'difficulty', 'content']
    for field in top_level_fields:
        status = "✓" if field in sample else "✗"
        print(f"  {status} {field}")
    
    print("\n✅ Campos en content:")
    content_fields = ['competency', 'evidence', 'example', 'concepts', 'misconceptions', 'metadata']
    for field in content_fields:
        status = "✓" if field in sample.get('content', {}) else "✗"
        print(f"  {status} {field}")
    
    print("\n❌ Campos removidos (NO deben estar presentes):")
    removed_fields = ['source_id', 'curriculum', 'cognitive_analysis', 'embedding_metadata', 'processing']
    for field in removed_fields:
        status = "✗" if field in sample else "✓"
        symbol = "❌" if field in sample else "✅"
        print(f"  {symbol} {field}: {'PRESENTE (error)' if field in sample else 'No presente (correcto)'}")
    
    # Ejemplo completo
    print("\n" + "=" * 70)
    print("📋 EJEMPLO DE UNIDAD (DBA)")
    print("=" * 70)
    print(json.dumps(dbas[0], indent=2, ensure_ascii=False)[:800] + "...")
    
    print("\n" + "=" * 70)
    print("📋 EJEMPLO DE UNIDAD (Estándar)")
    print("=" * 70)
    print(json.dumps(standards[0], indent=2, ensure_ascii=False)[:800] + "...")
    
    # Análisis de tamaño
    print("\n" + "=" * 70)
    print("📏 ANÁLISIS DE TAMAÑO")
    print("=" * 70)
    
    avg_dba_size = sum(len(json.dumps(d)) for d in dbas) / len(dbas) if dbas else 0
    avg_std_size = sum(len(json.dumps(s)) for s in standards) / len(standards) if standards else 0
    
    print(f"\n📊 Tamaño promedio por unidad:")
    print(f"  DBA: {avg_dba_size:.0f} bytes")
    print(f"  Estándar: {avg_std_size:.0f} bytes")
    print(f"  Total archivo: {(old_file.stat().st_size / 1024 / 1024):.2f} MB")
    
    # Validar difficulty
    print("\n" + "=" * 70)
    print("🎚️ DISTRIBUCIÓN DE DIFICULTAD")
    print("=" * 70)
    
    difficulty_counts = {}
    for unit in units:
        diff = unit.get('difficulty', 0)
        difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1
    
    print("\n📊 Nivel de dificultad (1-5):")
    for level in sorted(difficulty_counts.keys()):
        count = difficulty_counts[level]
        percentage = (count / len(units) * 100)
        bar = "█" * int(percentage / 2)
        print(f"  {level}: {bar} {count} ({percentage:.1f}%)")
    
    # Validar concepts
    print("\n" + "=" * 70)
    print("🏷️ CONCEPTOS MÁS FRECUENTES")
    print("=" * 70)
    
    concept_counts = {}
    for unit in units:
        for concept in unit.get('content', {}).get('concepts', []):
            concept_counts[concept] = concept_counts.get(concept, 0) + 1
    
    top_concepts = sorted(concept_counts.items(), key=lambda x: x[1], reverse=True)[:15]
    
    print("\n📊 Top 15 conceptos:")
    for concept, count in top_concepts:
        print(f"  {concept}: {count}")
    
    print("\n" + "=" * 70)
    print("✅ VALIDACIÓN COMPLETADA")
    print("=" * 70)

if __name__ == '__main__':
    compare_structures()
