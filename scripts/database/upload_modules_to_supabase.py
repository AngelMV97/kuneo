"""
KUNEO MODULE UPLOADER
Carga módulos generados a Supabase

Input: data/processed/modules/all_modules.json
Output: kuneo.modules table populated
"""

import json
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

class ModuleUploader:
    def __init__(self):
        load_dotenv(Path(__file__).parent.parent.parent / "server" / ".env")
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidas en server/.env")
        
        self.client: Client = create_client(supabase_url, supabase_key)
        self.schema = "kuneo"
        
    def load_modules(self, file_path: Path) -> list:
        """Carga módulos desde JSON"""
        print(f"📂 Leyendo módulos desde: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            modules = json.load(f)
        
        print(f"✅ {len(modules)} módulos cargados")
        return modules
    
    def transform_module_for_db(self, module: dict) -> dict:
        """Transforma módulo para formato de base de datos"""
        
        # Mapeo directo - la nueva tabla modules coincide con la estructura generada
        db_module = {
            "id": module["module_id"],
            "source_unit_id": module.get("source_unit_id"),
            "source": module.get("source"),
            "subject": module["subject"],
            "grade_range": module["grade_range"],
            "difficulty": module["difficulty"],
            "title": module["title"],
            "learning_objective": module["learning_objective"],
            "context": module.get("context", ""),
            "core_concept": module["core_concept"],
            "is_active": True,
            "order_index": 0,
            
            # Contenido completo como JSONB
            "content": {
                "concepts": module.get("concepts", []),
                "cognitive_type": module.get("cognitive_type", "conceptual_understanding"),
                "skills": module.get("skills", []),
                "diagnostic": module.get("diagnostic", {}),
                "phases": module.get("phases", []),
                "guided_exercises": module.get("guided_exercises", []),
                "error_map": module.get("error_map", {}),
                "hints": module.get("hints", []),
                "reflection_prompts": module.get("reflection_prompts", []),
                "evaluation": module.get("evaluation", {}),
                "visual_triggers": module.get("visual_triggers", []),
                "metadata": module.get("metadata", {})
            }
        }
        
        return db_module
    
    def upload_batch(self, modules: list[dict], batch_size: int = 100) -> int:
        """Sube módulos en lotes a Supabase"""
        total = len(modules)
        uploaded = 0
        failed = 0
        
        print(f"\n🔄 Subiendo {total} módulos en lotes de {batch_size}...")
        
        for i in range(0, total, batch_size):
            batch = modules[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (total + batch_size - 1) // batch_size
            
            try:
                # Transformar módulos para DB
                db_modules = [self.transform_module_for_db(m) for m in batch]
                
                # Upsert (insert or update) - usar schema kuneo
                result = self.client.schema("kuneo").table("modules").upsert(
                    db_modules,
                    on_conflict="id"
                ).execute()
                
                uploaded += len(batch)
                print(f"   ✓ Lote {batch_num}/{total_batches}: {len(batch)} módulos subidos ({uploaded}/{total})")
                
            except Exception as e:
                failed += len(batch)
                print(f"   ❌ Error en lote {batch_num}: {str(e)}")
        
        return uploaded, failed
    
    def validate_upload(self) -> dict:
        """Valida que los módulos se hayan subido correctamente"""
        print("\n🔍 Validando datos subidos...")
        
        try:
            # Total de módulos
            result = self.client.schema("kuneo").table("modules").select("id", count="exact").execute()
            total_count = result.count
            
            # Por materia
            by_subject = self.client.schema("kuneo").table("modules").select("subject", count="exact").execute()
            
            # Por grado
            by_grade = self.client.schema("kuneo").table("modules").select("grade_range", count="exact").execute()
            
            print(f"\n✅ Total de módulos en Supabase: {total_count}")
            
            # Contar por materia usando GROUP BY en query
            try:
                subjects_result = self.client.schema("kuneo").rpc("count_modules_by_subject", {}).execute()
                if subjects_result.data:
                    print("\n📚 Por materia:")
                    for row in subjects_result.data:
                        print(f"   {row['subject']}: {row['count']} módulos")
            except Exception as rpc_error:
                print(f"⚠️  No se pudo usar la función RPC: {str(rpc_error)}")
            
            return {
                "total": total_count,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"⚠️  Error en validación: {str(e)}")
            print(f"   (Nota: La función RPC count_modules_by_subject puede no existir)")
            
            # Fallback: contar manualmente
            try:
                all_modules = self.client.schema("kuneo").table("modules").select("subject").execute()
                subject_counts = {}
                for m in all_modules.data:
                    subject = m["subject"]
                    subject_counts[subject] = subject_counts.get(subject, 0) + 1
                
                print("\n📚 Por materia:")
                for subject, count in sorted(subject_counts.items()):
                    print(f"   {subject}: {count} módulos")
                
                return {
                    "total": len(all_modules.data),
                    "by_subject": subject_counts
                }
            except Exception as e2:
                print(f"❌ Error en validación fallback: {str(e2)}")
                return {"error": str(e2)}
    
    def upload_all(self, input_file: Path, batch_size: int = 100):
        """Proceso completo de carga"""
        print("=" * 60)
        print("🚀 KUNEO MODULE UPLOADER")
        print("=" * 60)
        print(f"\nFecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Cargar módulos
        modules = self.load_modules(input_file)
        
        # Subir a Supabase
        uploaded, failed = self.upload_batch(modules, batch_size)
        
        print(f"\n{'=' * 60}")
        print("📊 RESUMEN DE CARGA")
        print(f"{'=' * 60}")
        print(f"✅ Subidos exitosamente: {uploaded}")
        if failed > 0:
            print(f"❌ Fallidos: {failed}")
        
        # Validar
        validation = self.validate_upload()
        
        print(f"\n{'=' * 60}")
        print("✅ CARGA COMPLETADA")
        print(f"{'=' * 60}")
        print(f"\n💾 Módulos disponibles en: kuneo.modules")
        print(f"🔗 Supabase URL: {os.getenv('SUPABASE_URL')}")


def main():
    # Paths
    base_dir = Path(__file__).parent.parent.parent
    input_file = base_dir / "data" / "processed" / "modules" / "all_modules.json"
    
    if not input_file.exists():
        print(f"❌ Archivo no encontrado: {input_file}")
        print(f"   Ejecuta primero: node scripts/module-generator/generate-modules.js")
        return
    
    # Upload
    uploader = ModuleUploader()
    uploader.upload_all(input_file, batch_size=100)


if __name__ == "__main__":
    main()
