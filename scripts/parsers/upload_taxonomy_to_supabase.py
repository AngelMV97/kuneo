"""
upload_taxonomy_to_supabase.py

Script para cargar las taxonomías curriculares parseadas a Supabase.
Lee el archivo JSON generado por taxonomy_parser.py y lo inserta en la tabla curriculum_taxonomy.

Requisitos:
    - pip install supabase python-dotenv

Uso:
    python scripts/parsers/upload_taxonomy_to_supabase.py

Autor: Sistema Kuneo
Fecha: 2026-05-12
"""

import os
import json
import sys
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client


class TaxonomyUploader:
    """Cargador de taxonomías a Supabase."""
    
    def __init__(self):
        """Inicializa el cliente de Supabase."""
        # Cargar variables de entorno desde server/.env
        env_path = Path("server/.env")
        if not env_path.exists():
            raise FileNotFoundError(f"No se encontró el archivo .env en {env_path}")
        
        load_dotenv(env_path)
        
        # Obtener credenciales
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Faltan credenciales de Supabase en .env")
        
        # Crear cliente
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
        print("✅ Cliente de Supabase inicializado")
        print(f"   URL: {self.supabase_url}")
    
    def load_taxonomies(self, json_file: str = "data/clean/curriculum_taxonomy.json") -> List[Dict[str, Any]]:
        """
        Carga las taxonomías desde el archivo JSON.
        
        Args:
            json_file: Ruta al archivo JSON generado por taxonomy_parser.py
            
        Returns:
            Lista de taxonomías
        """
        json_path = Path(json_file)
        
        if not json_path.exists():
            raise FileNotFoundError(f"No se encontró el archivo {json_path}")
        
        with open(json_path, 'r', encoding='utf-8') as f:
            taxonomies = json.load(f)
        
        print(f"\n📂 Cargadas {len(taxonomies)} taxonomías desde {json_path}")
        
        return taxonomies
    
    def check_table_exists(self) -> bool:
        """Verifica si la tabla curriculum_taxonomy existe."""
        try:
            # Intentar hacer una consulta simple
            response = self.supabase.schema("kuneo").table("curriculum_taxonomy").select("id").limit(1).execute()
            print("✅ Tabla 'curriculum_taxonomy' existe")
            return True
        except Exception as e:
            print(f"❌ Error al verificar tabla: {e}")
            return False
    
    def clear_existing_data(self) -> int:
        """
        Elimina todos los datos existentes de la tabla.
        
        Returns:
            Número de registros eliminados
        """
        try:
            # Primero, contar cuántos registros hay
            count_response = self.supabase.schema("kuneo").table("curriculum_taxonomy").select("id", count="exact").execute()
            existing_count = count_response.count if hasattr(count_response, 'count') else 0
            
            if existing_count == 0:
                print("ℹ️  La tabla está vacía, no hay nada que eliminar")
                return 0
            
            # Eliminar todos los registros
            delete_response = self.supabase.schema("kuneo").table("curriculum_taxonomy").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            
            print(f"🗑️  Eliminados {existing_count} registros existentes")
            return existing_count
        
        except Exception as e:
            print(f"⚠️  Error al limpiar tabla: {e}")
            return 0
    
    def upload_batch(self, taxonomies: List[Dict[str, Any]], batch_size: int = 100) -> Dict[str, int]:
        """
        Carga taxonomías en lotes a Supabase.
        
        Args:
            taxonomies: Lista de taxonomías a cargar
            batch_size: Tamaño de cada lote
            
        Returns:
            Diccionario con estadísticas de carga
        """
        stats = {
            "total": len(taxonomies),
            "success": 0,
            "failed": 0,
            "batches": 0
        }
        
        print(f"\n📤 Iniciando carga en lotes de {batch_size}")
        print("=" * 60)
        
        # Dividir en lotes
        for i in range(0, len(taxonomies), batch_size):
            batch = taxonomies[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(taxonomies) + batch_size - 1) // batch_size
            
            try:
                # Insertar lote
                response = self.supabase.schema("kuneo").table("curriculum_taxonomy").insert(batch).execute()
                
                success_count = len(batch)
                stats["success"] += success_count
                stats["batches"] += 1
                
                print(f"✅ Lote {batch_num}/{total_batches}: {success_count} registros insertados")
            
            except Exception as e:
                stats["failed"] += len(batch)
                print(f"❌ Lote {batch_num}/{total_batches}: Error - {e}")
        
        print("=" * 60)
        
        return stats
    
    def validate_upload(self) -> Dict[str, Any]:
        """
        Valida que la carga se haya realizado correctamente.
        
        Returns:
            Diccionario con estadísticas de la base de datos
        """
        print("\n🔍 Validando carga...")
        
        try:
            # Contar total de registros
            count_response = self.supabase.schema("kuneo").table("curriculum_taxonomy").select("*", count="exact").execute()
            total_count = count_response.count if hasattr(count_response, 'count') else len(count_response.data)
            
            # Contar por materia
            subjects_response = self.supabase.schema("kuneo").table("curriculum_taxonomy").select("subject").execute()
            subjects_count = {}
            for record in subjects_response.data:
                subject = record["subject"]
                subjects_count[subject] = subjects_count.get(subject, 0) + 1
            
            # Contar por grado
            grades_response = self.supabase.schema("kuneo").table("curriculum_taxonomy").select("grade_range").execute()
            grades_count = {}
            for record in grades_response.data:
                grade = record["grade_range"]
                grades_count[grade] = grades_count.get(grade, 0) + 1
            
            validation = {
                "total_records": total_count,
                "by_subject": subjects_count,
                "by_grade_range": grades_count
            }
            
            print("\n" + "=" * 60)
            print("✅ VALIDACIÓN EXITOSA")
            print("=" * 60)
            print(f"\nTotal de registros en BD: {validation['total_records']}")
            
            print("\n📚 Por materia:")
            for subject, count in sorted(validation['by_subject'].items()):
                print(f"   {subject:20} → {count:3} registros")
            
            print("\n🎓 Por rango de grado:")
            for grade, count in sorted(validation['by_grade_range'].items()):
                print(f"   {grade:10} → {count:3} registros")
            
            return validation
        
        except Exception as e:
            print(f"❌ Error en validación: {e}")
            return {}
    
    def run(self, json_file: str = "data/clean/curriculum_taxonomy.json", clear_existing: bool = True):
        """
        Ejecuta el proceso completo de carga.
        
        Args:
            json_file: Ruta al archivo JSON con las taxonomías
            clear_existing: Si es True, elimina los datos existentes antes de cargar
        """
        print("\n" + "=" * 60)
        print("🚀 CARGA DE TAXONOMÍAS A SUPABASE")
        print("=" * 60)
        
        # 1. Verificar que la tabla existe
        if not self.check_table_exists():
            print("\n❌ La tabla 'curriculum_taxonomy' no existe.")
            print("   Por favor, ejecuta el script SQL primero:")
            print("   scripts/database/create_curriculum_taxonomy_table.sql")
            return
        
        # 2. Cargar taxonomías del JSON
        try:
            taxonomies = self.load_taxonomies(json_file)
        except Exception as e:
            print(f"\n❌ Error al cargar taxonomías: {e}")
            return
        
        # 3. Limpiar datos existentes (opcional)
        if clear_existing:
            self.clear_existing_data()
        
        # 4. Cargar en lotes
        stats = self.upload_batch(taxonomies)
        
        # 5. Mostrar estadísticas
        print("\n" + "=" * 60)
        print("📊 RESUMEN DE CARGA")
        print("=" * 60)
        print(f"Total de registros: {stats['total']}")
        print(f"Exitosos: {stats['success']} ✅")
        print(f"Fallidos: {stats['failed']} ❌")
        print(f"Lotes procesados: {stats['batches']}")
        
        if stats['failed'] > 0:
            print(f"\n⚠️  Hubo {stats['failed']} registros que fallaron")
        else:
            print("\n✅ Todos los registros se cargaron exitosamente")
        
        # 6. Validar carga
        self.validate_upload()
        
        print("\n" + "=" * 60)
        print("✅ PROCESO COMPLETADO")
        print("=" * 60)


def main():
    """Función principal."""
    try:
        uploader = TaxonomyUploader()
        uploader.run()
    except Exception as e:
        print(f"\n❌ Error fatal: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
