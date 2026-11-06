"""
KUNEO SUPABASE UPLOADER
Carga competency units con embeddings a Supabase

Input: data/processed/normalized/competency_units/all_competency_units_with_embeddings.json
Output: Registros en kuneo.competency_units (Supabase)

Tabla: kuneo.competency_units
Columnas: id, type, source, subject, grade_range, difficulty, content, embedding
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client


# Cargar variables de entorno
env_path = Path(__file__).parent.parent.parent / 'server' / '.env'
load_dotenv(env_path)

# Configurar Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Service role para insertar vectores

BATCH_SIZE = 100  # Insertar en lotes


def create_supabase_client() -> Client:
    """Crea cliente de Supabase con service role"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no encontrados en .env")
    
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def prepare_unit_for_insert(unit: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepara un competency unit para inserción en Supabase
    
    Args:
        unit: Competency unit con embedding
        
    Returns:
        Diccionario listo para insertar
    """
    return {
        'id': unit['id'],
        'type': unit['type'],
        'source': unit['source'],
        'subject': unit['subject'],
        'grade_range': unit['grade_range'],
        'difficulty': unit['difficulty'],
        'content': unit['content'],  # JSONB
        'embedding': unit.get('embedding', [])  # Vector
    }


def insert_batch(supabase: Client, batch: List[Dict[str, Any]]) -> tuple[int, int]:
    """
    Inserta un lote de competency units
    
    Returns:
        (exitosos, fallidos)
    """
    try:
        # Preparar batch para inserción
        records = [prepare_unit_for_insert(unit) for unit in batch]
        
        # Insertar en Supabase en el schema kuneo
        result = supabase.schema('kuneo').table('competency_units').insert(records).execute()
        
        return len(records), 0
        
    except Exception as e:
        print(f"\n   ❌ Error en batch: {e}")
        
        # Intentar insertar uno por uno para identificar problemas
        successful = 0
        failed = 0
        
        for unit in batch:
            try:
                record = prepare_unit_for_insert(unit)
                supabase.schema('kuneo').table('competency_units').insert(record).execute()
                successful += 1
            except Exception as e2:
                print(f"   ❌ Error insertando {unit['id']}: {e2}")
                failed += 1
        
        return successful, failed


def upload_to_supabase():
    """
    Carga todos los competency units a Supabase
    """
    print("\n" + "=" * 70)
    print("🚀 UPLOAD A SUPABASE")
    print("=" * 70)
    
    # Rutas
    base_path = Path(__file__).parent.parent.parent
    input_file = base_path / 'data' / 'processed' / 'normalized' / 'competency_units' / 'all_competency_units_with_embeddings.json'
    
    # Verificar archivo
    print(f"\n📂 Cargando: {input_file.name}")
    
    if not input_file.exists():
        print(f"❌ Error: Archivo no encontrado: {input_file}")
        print(f"\n💡 Ejecuta primero: python scripts/embeddings/generate_embeddings.py")
        return
    
    with open(input_file, 'r', encoding='utf-8') as f:
        units = json.load(f)
    
    print(f"✅ {len(units)} competency units cargados")
    
    # Verificar embeddings
    units_with_embeddings = sum(1 for u in units if u.get('embedding') and len(u['embedding']) > 0)
    print(f"✅ {units_with_embeddings} con embeddings")
    
    if units_with_embeddings < len(units):
        print(f"⚠️  {len(units) - units_with_embeddings} sin embeddings (se insertarán con vector vacío)")
    
    # Conectar a Supabase
    print(f"\n🔌 Conectando a Supabase...")
    
    try:
        supabase = create_supabase_client()
        print(f"✅ Conectado: {SUPABASE_URL}")
    except Exception as e:
        print(f"❌ Error conectando: {e}")
        return
    
    # Verificar si la tabla existe
    print(f"\n🔍 Verificando tabla kuneo.competency_units...")
    
    try:
        # Intentar consultar la tabla en el schema kuneo
        result = supabase.schema('kuneo').table('competency_units').select('id').limit(1).execute()
        print(f"✅ Tabla existe")
    except Exception as e:
        print(f"❌ Error: Tabla no encontrada o inaccesible")
        print(f"   {e}")
        print(f"\n💡 Ejecuta primero el schema.sql en Supabase SQL Editor")
        return
    
    # Limpiar tabla (opcional - comentar si se quiere hacer append)
    print(f"\n🧹 Limpiando registros existentes...")
    try:
        result = supabase.schema('kuneo').table('competency_units').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print(f"✅ Tabla limpia")
    except Exception as e:
        print(f"⚠️  No se pudo limpiar tabla: {e}")
        print(f"   Continuando con inserción...")
    
    # Insertar en lotes
    print(f"\n🔄 Insertando en lotes de {BATCH_SIZE}...")
    
    total_successful = 0
    total_failed = 0
    total_batches = (len(units) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for i in range(0, len(units), BATCH_SIZE):
        batch = units[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        
        print(f"\n📦 Lote {batch_num}/{total_batches} ({len(batch)} unidades)...", end=' ')
        
        successful, failed = insert_batch(supabase, batch)
        total_successful += successful
        total_failed += failed
        
        if failed == 0:
            print(f"✅")
        else:
            print(f"⚠️  {successful} exitosos, {failed} fallidos")
    
    # Estadísticas finales
    print("\n" + "=" * 70)
    print("📊 ESTADÍSTICAS FINALES")
    print("=" * 70)
    
    print(f"\n✅ Registros insertados: {total_successful}")
    print(f"❌ Registros fallidos: {total_failed}")
    print(f"📊 Total procesados: {total_successful + total_failed}")
    print(f"📈 Tasa de éxito: {(total_successful / len(units) * 100):.1f}%")
    
    # Verificar en base de datos
    print(f"\n🔍 Verificando en base de datos...")
    
    try:
        result = supabase.schema('kuneo').table('competency_units').select('id', count='exact').execute()
        db_count = result.count if hasattr(result, 'count') else len(result.data)
        print(f"✅ Registros en DB: {db_count}")
        
        # Estadísticas por fuente
        result_dba = supabase.schema('kuneo').table('competency_units').select('id', count='exact').eq('source', 'dba').execute()
        dba_count = result_dba.count if hasattr(result_dba, 'count') else len(result_dba.data)
        
        result_std = supabase.schema('kuneo').table('competency_units').select('id', count='exact').eq('source', 'standard').execute()
        std_count = result_std.count if hasattr(result_std, 'count') else len(result_std.data)
        
        print(f"\n📚 Por fuente:")
        print(f"   DBAs: {dba_count}")
        print(f"   Estándares: {std_count}")
        
    except Exception as e:
        print(f"⚠️  Error verificando: {e}")
    
    print("\n" + "=" * 70)
    print("✨ UPLOAD COMPLETADO")
    print("=" * 70)
    print(f"\n🎯 Tabla: kuneo.competency_units")
    print(f"🔗 URL: {SUPABASE_URL}")
    print(f"\n✅ Los competency units están listos para búsqueda semántica")


if __name__ == '__main__':
    upload_to_supabase()
