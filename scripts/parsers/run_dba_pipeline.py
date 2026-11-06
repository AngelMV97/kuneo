"""
KUNEO DBA PIPELINE
Pipeline completo: Parse → Normalize → Generar embeddings

Ejecuta todo el proceso de conversión de DBA TXT a competency units normalizados
"""

import sys
from pathlib import Path

# Agregar scripts al path
sys.path.insert(0, str(Path(__file__).parent))

from dba_parser import process_all_dbas
from dba_normalizer import normalize_all_dbas


def run_pipeline(steps='all'):
    """
    Ejecuta el pipeline completo o pasos individuales
    
    Args:
        steps: 'all', 'parse', 'normalize'
    """
    print("=" * 60)
    print("🎓 KUNEO DBA PIPELINE")
    print("=" * 60)
    
    if steps in ['all', 'parse']:
        print("\n" + "=" * 60)
        print("PASO 1: PARSING")
        print("=" * 60)
        process_all_dbas()
    
    if steps in ['all', 'normalize']:
        print("\n" + "=" * 60)
        print("PASO 2: NORMALIZATION")
        print("=" * 60)
        normalize_all_dbas()
    
    print("\n" + "=" * 60)
    print("✅ PIPELINE COMPLETADO")
    print("=" * 60)
    
    # Mostrar archivos generados
    base_path = Path(__file__).parent.parent.parent
    
    print("\n📂 Archivos generados:")
    print("\n1. Archivos parseados:")
    print(f"   {base_path / 'data' / 'processed' / 'parsed' / 'dba'}")
    
    print("\n2. Archivos normalizados:")
    print(f"   {base_path / 'data' / 'processed' / 'normalized' / 'competency_units' / 'dba'}")
    
    print("\n3. Archivo consolidado:")
    print(f"   {base_path / 'data' / 'processed' / 'normalized' / 'competency_units' / 'all_competency_units.json'}")
    
    print("\n🚀 Siguiente paso: Generar embeddings y subir a Supabase")


if __name__ == '__main__':
    # Verificar argumentos
    if len(sys.argv) > 1:
        step = sys.argv[1]
        if step not in ['all', 'parse', 'normalize']:
            print("❌ Argumento inválido. Usa: all, parse, o normalize")
            sys.exit(1)
        run_pipeline(step)
    else:
        run_pipeline('all')
