"""
KUNEO EMBEDDINGS GENERATOR
Genera embeddings vectoriales para competency units usando OpenAI

Input: data/processed/normalized/competency_units/all_competency_units.json
Output: data/processed/normalized/competency_units/all_competency_units_with_embeddings.json

Modelo: text-embedding-3-small (1536 dimensiones)
"""

import json
import os
import time
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv
import openai


# Cargar variables de entorno
env_path = Path(__file__).parent.parent.parent / 'server' / '.env'
load_dotenv(env_path)

# Configurar OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')
EMBEDDING_MODEL = 'text-embedding-3-small'
EMBEDDING_DIMENSIONS = 1536
BATCH_SIZE = 100  # Procesar en lotes
DELAY_BETWEEN_BATCHES = 1  # Segundo entre lotes


def prepare_text_for_embedding(unit: Dict[str, Any]) -> str:
    """
    Prepara el texto de un competency unit para generar embedding
    
    Combina: competency + evidence + example
    """
    content = unit.get('content', {})
    
    parts = [
        # Competencia principal
        content.get('competency', ''),
        
        # Evidencias (unir con espacios)
        ' '.join(content.get('evidence', [])),
        
        # Ejemplo
        content.get('example', '')
    ]
    
    # Filtrar partes vacías y unir
    text = ' '.join(part for part in parts if part.strip())
    
    # Limpiar espacios múltiples
    text = ' '.join(text.split())
    
    return text


def generate_embedding(text: str) -> List[float]:
    """
    Genera embedding para un texto usando OpenAI
    
    Args:
        text: Texto a vectorizar
        
    Returns:
        Vector de 1536 dimensiones
    """
    try:
        response = openai.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text,
            encoding_format="float"
        )
        
        return response.data[0].embedding
        
    except Exception as e:
        print(f"❌ Error generando embedding: {e}")
        raise


def generate_embeddings_batch(units: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Genera embeddings para un lote de competency units
    
    Args:
        units: Lista de competency units
        
    Returns:
        Lista de competency units con embeddings agregados
    """
    # Preparar textos
    texts = [prepare_text_for_embedding(unit) for unit in units]
    
    try:
        # Generar embeddings en batch
        response = openai.embeddings.create(
            model=EMBEDDING_MODEL,
            input=texts,
            encoding_format="float"
        )
        
        # Agregar embeddings a units
        for i, unit in enumerate(units):
            unit['embedding'] = response.data[i].embedding
        
        return units
        
    except Exception as e:
        print(f"❌ Error generando embeddings en batch: {e}")
        # Fallback: generar uno por uno
        print("   Intentando generar embeddings uno por uno...")
        for i, unit in enumerate(units):
            try:
                embedding = generate_embedding(texts[i])
                unit['embedding'] = embedding
                time.sleep(0.1)  # Rate limiting
            except Exception as e2:
                print(f"   ❌ Error en unidad {i}: {e2}")
                unit['embedding'] = [0.0] * EMBEDDING_DIMENSIONS  # Vector cero como fallback
        
        return units


def generate_all_embeddings():
    """
    Genera embeddings para todos los competency units
    """
    print("\n" + "=" * 70)
    print("🚀 GENERADOR DE EMBEDDINGS")
    print("=" * 70)
    
    # Rutas
    base_path = Path(__file__).parent.parent.parent
    input_file = base_path / 'data' / 'processed' / 'normalized' / 'competency_units' / 'all_competency_units.json'
    output_file = base_path / 'data' / 'processed' / 'normalized' / 'competency_units' / 'all_competency_units_with_embeddings.json'
    
    # Verificar API key
    if not openai.api_key:
        print("\n❌ Error: OPENAI_API_KEY no encontrada en .env")
        print(f"   Buscado en: {env_path}")
        return
    
    print(f"\n✅ API Key configurada")
    print(f"✅ Modelo: {EMBEDDING_MODEL}")
    print(f"✅ Dimensiones: {EMBEDDING_DIMENSIONS}")
    
    # Cargar competency units
    print(f"\n📂 Cargando: {input_file.name}")
    
    if not input_file.exists():
        print(f"❌ Error: Archivo no encontrado: {input_file}")
        return
    
    with open(input_file, 'r', encoding='utf-8') as f:
        units = json.load(f)
    
    print(f"✅ {len(units)} competency units cargados")
    
    # Generar embeddings en lotes
    print(f"\n🔄 Generando embeddings en lotes de {BATCH_SIZE}...")
    
    processed_units = []
    total_batches = (len(units) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for i in range(0, len(units), BATCH_SIZE):
        batch = units[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        
        print(f"\n📦 Lote {batch_num}/{total_batches} ({len(batch)} unidades)...", end=' ')
        
        try:
            processed_batch = generate_embeddings_batch(batch)
            processed_units.extend(processed_batch)
            print(f"✅")
            
            # Delay entre lotes para respetar rate limits
            if i + BATCH_SIZE < len(units):
                time.sleep(DELAY_BETWEEN_BATCHES)
                
        except Exception as e:
            print(f"❌ Error: {e}")
            # Agregar batch sin embeddings
            for unit in batch:
                unit['embedding'] = [0.0] * EMBEDDING_DIMENSIONS
            processed_units.extend(batch)
    
    # Guardar resultados
    print(f"\n💾 Guardando resultados...")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed_units, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Guardado en: {output_file}")
    
    # Estadísticas
    print("\n" + "=" * 70)
    print("📊 ESTADÍSTICAS")
    print("=" * 70)
    
    units_with_embeddings = sum(1 for u in processed_units if u.get('embedding') and sum(u['embedding']) != 0)
    units_without_embeddings = len(processed_units) - units_with_embeddings
    
    print(f"\n✅ Unidades con embeddings: {units_with_embeddings}")
    print(f"❌ Unidades sin embeddings: {units_without_embeddings}")
    print(f"📏 Dimensiones por vector: {EMBEDDING_DIMENSIONS}")
    print(f"📦 Tamaño archivo: {(output_file.stat().st_size / 1024 / 1024):.2f} MB")
    
    # Ejemplo de embedding
    if processed_units and processed_units[0].get('embedding'):
        print(f"\n📋 Ejemplo de embedding (primeros 10 valores):")
        print(f"   {processed_units[0]['embedding'][:10]}")
    
    print("\n" + "=" * 70)
    print("✨ EMBEDDINGS GENERADOS EXITOSAMENTE")
    print("=" * 70)
    print(f"\n🔜 Siguiente paso: Upload a Supabase")
    print(f"   python scripts/database/upload_to_supabase.py")


if __name__ == '__main__':
    generate_all_embeddings()
