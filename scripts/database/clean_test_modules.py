"""
clean_test_modules.py

Script para eliminar módulos de prueba de la tabla modules.
Estos módulos fueron creados para testing y deben eliminarse antes de implementar
el generador de módulos real basado en curriculum_taxonomy.

Uso:
    python scripts/database/clean_test_modules.py

Autor: Sistema Kuneo
Fecha: 2026-05-12
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client


def clean_test_modules():
    """Elimina todos los módulos de prueba de la tabla modules."""
    
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
    print("🗑️  LIMPIEZA DE MÓDULOS DE PRUEBA")
    print("=" * 60)
    
    # Contar módulos existentes
    try:
        count_response = supabase.schema("kuneo").table("modules").select("*", count="exact").execute()
        existing_count = count_response.count if hasattr(count_response, 'count') else len(count_response.data)
        
        print(f"\n📊 Módulos actuales en la BD: {existing_count}")
        
        if existing_count == 0:
            print("✅ La tabla ya está vacía, no hay nada que eliminar")
            return
        
        # Mostrar algunos módulos a eliminar
        print("\n📋 Algunos módulos que serán eliminados:")
        for i, module in enumerate(count_response.data[:5], 1):
            print(f"   {i}. {module['title']} ({module['subject']} - grado {module['grade_level']})")
        
        if existing_count > 5:
            print(f"   ... y {existing_count - 5} más")
        
        # Confirmar eliminación
        print(f"\n⚠️  Se eliminarán {existing_count} módulos de prueba")
        confirm = input("¿Deseas continuar? (s/n): ").strip().lower()
        
        if confirm != 's':
            print("❌ Operación cancelada")
            return
        
        # Eliminar todos los módulos
        delete_response = supabase.schema("kuneo").table("modules").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        
        print(f"\n✅ {existing_count} módulos eliminados exitosamente")
        
        # Verificar
        verify_response = supabase.schema("kuneo").table("modules").select("*", count="exact").execute()
        remaining = verify_response.count if hasattr(verify_response, 'count') else len(verify_response.data)
        
        print(f"✅ Verificación: {remaining} módulos restantes")
        
        if remaining == 0:
            print("\n" + "=" * 60)
            print("✅ LIMPIEZA COMPLETADA")
            print("=" * 60)
            print("\nLa tabla 'modules' está lista para el Module Generator")
        else:
            print(f"\n⚠️  Atención: Aún quedan {remaining} módulos en la tabla")
    
    except Exception as e:
        print(f"\n❌ Error durante la limpieza: {e}")


if __name__ == "__main__":
    clean_test_modules()
