"""
delete_test_modules.py

Script para eliminar los 5 módulos de prueba creados accidentalmente.

Uso:
    python scripts/database/delete_test_modules.py

Autor: Sistema Kuneo
Fecha: 2026-05-12
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client


def delete_test_modules():
    """Elimina todos los módulos de la tabla modules."""
    
    # Cargar variables de entorno
    env_path = Path("server/.env")
    if not env_path.exists():
        raise FileNotFoundError(f"No se encontró el archivo .env en {env_path}")
    
    load_dotenv(env_path)
    
    # Obtener credenciales
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Faltan credenciales de Supabase en .env")
    
    # Crear cliente
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print("=" * 60)
    print("🗑️  ELIMINANDO MÓDULOS DE PRUEBA")
    print("=" * 60)
    
    try:
        # Contar módulos existentes
        count_response = supabase.schema("kuneo").table("modules").select("*", count="exact").execute()
        existing_count = count_response.count if hasattr(count_response, 'count') else len(count_response.data)
        
        print(f"\n📊 Módulos actuales en la BD: {existing_count}")
        
        if existing_count == 0:
            print("✅ La tabla ya está vacía")
            return
        
        # Mostrar módulos a eliminar
        print("\n📋 Módulos que serán eliminados:")
        for i, module in enumerate(count_response.data, 1):
            print(f"   {i}. {module['title']} ({module['subject']} - grado {module['grade_level']})")
        
        # Eliminar todos los módulos
        delete_response = supabase.schema("kuneo").table("modules").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        
        print(f"\n✅ {existing_count} módulos eliminados exitosamente")
        
        # Verificar
        verify_response = supabase.schema("kuneo").table("modules").select("*", count="exact").execute()
        remaining = verify_response.count if hasattr(verify_response, 'count') else len(verify_response.data)
        
        print(f"✅ Verificación: {remaining} módulos restantes")
        
        if remaining == 0:
            print("\n" + "=" * 60)
            print("✅ TABLA LIMPIA")
            print("=" * 60)
            print("\nLa tabla 'modules' está lista para Module Generator")
        else:
            print(f"\n⚠️  Atención: Aún quedan {remaining} módulos en la tabla")
    
    except Exception as e:
        print(f"\n❌ Error durante la eliminación: {e}")


if __name__ == "__main__":
    delete_test_modules()
