"""
create_table.py

Script para crear la tabla curriculum_taxonomy en Supabase ejecutando el SQL.
Este script lee el archivo .sql y lo ejecuta en la base de datos.

Uso:
    python scripts/database/create_table.py

Autor: Sistema Kuneo
Fecha: 2026-05-12
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client


def execute_sql_file(sql_file: str):
    """
    Ejecuta un archivo SQL en Supabase.
    
    Args:
        sql_file: Ruta al archivo .sql
    """
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
    print("🗄️  CREACIÓN DE TABLA: curriculum_taxonomy")
    print("=" * 60)
    print(f"\n✅ Cliente de Supabase inicializado")
    print(f"   URL: {supabase_url}")
    
    # Leer archivo SQL
    sql_path = Path(sql_file)
    if not sql_path.exists():
        raise FileNotFoundError(f"No se encontró el archivo SQL: {sql_path}")
    
    with open(sql_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    print(f"\n📄 Archivo SQL cargado: {sql_path}")
    print(f"   Tamaño: {len(sql_content)} caracteres")
    
    # Ejecutar SQL usando RPC
    # Nota: Supabase Python SDK no tiene método directo para ejecutar SQL arbitrario
    # La mejor opción es usar postgrest o ejecutar manualmente en el dashboard
    
    print("\n" + "=" * 60)
    print("⚠️  NOTA IMPORTANTE")
    print("=" * 60)
    print("\nEl SDK de Python de Supabase no permite ejecutar SQL arbitrario")
    print("directamente. Por favor, ejecuta el SQL manualmente:")
    print(f"\n1. Ve al dashboard de Supabase: {supabase_url.replace('https://', 'https://app.supabase.com/project/')}")
    print("2. Navega a 'SQL Editor'")
    print("3. Copia y pega el contenido de:")
    print(f"   {sql_path.absolute()}")
    print("4. Ejecuta el SQL")
    print("\nAlternativamente, puedes usar psql o cualquier cliente PostgreSQL:")
    print(f"   psql -h db.zbcruqhuxfvcrntmospc.supabase.co -U postgres -d postgres -f {sql_path}")
    print("\n" + "=" * 60)
    
    # Intentar verificar si la tabla ya existe
    try:
        response = supabase.schema("kuneo").table("curriculum_taxonomy").select("id").limit(1).execute()
        print("\n✅ ¡La tabla 'curriculum_taxonomy' ya existe!")
        print("   Puedes proceder con la carga de datos.")
    except Exception as e:
        print(f"\nℹ️  La tabla aún no existe o no es accesible.")
        print(f"   Mensaje: {e}")


def main():
    """Función principal."""
    sql_file = "scripts/database/create_curriculum_taxonomy_table.sql"
    
    try:
        execute_sql_file(sql_file)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
