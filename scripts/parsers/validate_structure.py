"""
KUNEO DBA VALIDATOR
Valida la estructura de archivos y formato antes de ejecutar el pipeline
"""

from pathlib import Path
import sys


class DBAValidator:
    """Valida estructura de archivos DBA"""
    
    def __init__(self):
        self.base_path = Path(__file__).parent.parent.parent
        self.subjects = ['matematicas', 'ciencias', 'lenguaje', 'sociales', 'ingles']
        self.errors = []
        self.warnings = []
    
    def validate_all(self):
        """Ejecuta todas las validaciones"""
        print("=" * 60)
        print("🔍 VALIDACIÓN DE ESTRUCTURA DBA")
        print("=" * 60)
        
        self._validate_directory_structure()
        self._validate_clean_files()
        self._validate_file_format()
        self._check_output_directories()
        
        self._print_results()
        
        return len(self.errors) == 0
    
    def _validate_directory_structure(self):
        """Valida que existan las carpetas necesarias"""
        print("\n📁 Validando estructura de directorios...")
        
        # Verificar carpeta data/
        data_path = self.base_path / 'data'
        if not data_path.exists():
            self.errors.append("❌ Carpeta 'data/' no existe")
            return
        
        # Verificar data/clean/dba/
        clean_dba_path = data_path / 'clean' / 'dba'
        if not clean_dba_path.exists():
            self.errors.append("❌ Carpeta 'data/clean/dba/' no existe")
            return
        
        print("  ✅ Carpeta data/ existe")
        print("  ✅ Carpeta data/clean/dba/ existe")
        
        # Verificar carpetas por materia
        for subject in self.subjects:
            subject_path = clean_dba_path / subject / 'dba_grades'
            
            if not subject_path.exists():
                self.warnings.append(f"⚠️  Carpeta '{subject}/dba_grades/' no existe")
            else:
                print(f"  ✅ {subject}/dba_grades/ existe")
    
    def _validate_clean_files(self):
        """Valida que existan archivos TXT limpios"""
        print("\n📄 Validando archivos TXT...")
        
        clean_dba_path = self.base_path / 'data' / 'clean' / 'dba'
        
        file_counts = {}
        
        for subject in self.subjects:
            subject_path = clean_dba_path / subject / 'dba_grades'
            
            if not subject_path.exists():
                continue
            
            txt_files = list(subject_path.glob('*.txt'))
            file_counts[subject] = len(txt_files)
            
            if len(txt_files) == 0:
                self.errors.append(f"❌ No hay archivos TXT en {subject}/dba_grades/")
            else:
                print(f"  ✅ {subject}: {len(txt_files)} archivos")
        
        if sum(file_counts.values()) == 0:
            self.errors.append("❌ No se encontraron archivos TXT para procesar")
    
    def _validate_file_format(self):
        """Valida formato básico de archivos TXT"""
        print("\n🔍 Validando formato de archivos...")
        
        clean_dba_path = self.base_path / 'data' / 'clean' / 'dba'
        
        validated_count = 0
        
        for subject in self.subjects:
            subject_path = clean_dba_path / subject / 'dba_grades'
            
            if not subject_path.exists():
                continue
            
            # Validar primer archivo de cada materia
            txt_files = sorted(subject_path.glob('*.txt'))
            
            if not txt_files:
                continue
            
            sample_file = txt_files[0]
            
            try:
                with open(sample_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Verificar elementos clave
                has_dba = 'DBA:' in content
                has_subject = 'SUBJECT:' in content
                has_grade = 'GRADE:' in content
                has_enunciado = 'ENUNCIADO:' in content
                has_evidence_or_skill = 'EVIDENCES:' in content or 'SKILL:' in content
                has_example = 'EXAMPLE:' in content
                
                if all([has_dba, has_subject, has_grade, has_enunciado, 
                       has_evidence_or_skill, has_example]):
                    print(f"  ✅ {subject}/{sample_file.name} - formato correcto")
                    validated_count += 1
                else:
                    missing = []
                    if not has_dba: missing.append("DBA:")
                    if not has_subject: missing.append("SUBJECT:")
                    if not has_grade: missing.append("GRADE:")
                    if not has_enunciado: missing.append("ENUNCIADO:")
                    if not has_evidence_or_skill: missing.append("EVIDENCES:/SKILL:")
                    if not has_example: missing.append("EXAMPLE:")
                    
                    self.warnings.append(
                        f"⚠️  {subject}/{sample_file.name} - falta: {', '.join(missing)}"
                    )
                
            except Exception as e:
                self.errors.append(
                    f"❌ Error leyendo {subject}/{sample_file.name}: {e}"
                )
        
        if validated_count == 0:
            self.errors.append("❌ No se pudo validar ningún archivo")
    
    def _check_output_directories(self):
        """Verifica/crea directorios de salida"""
        print("\n📤 Verificando directorios de salida...")
        
        output_dirs = [
            self.base_path / 'data' / 'processed',
            self.base_path / 'data' / 'processed' / 'parsed',
            self.base_path / 'data' / 'processed' / 'parsed' / 'dba',
            self.base_path / 'data' / 'processed' / 'normalized',
            self.base_path / 'data' / 'processed' / 'normalized' / 'competency_units',
            self.base_path / 'data' / 'processed' / 'normalized' / 'competency_units' / 'dba'
        ]
        
        for directory in output_dirs:
            if not directory.exists():
                try:
                    directory.mkdir(parents=True, exist_ok=True)
                    print(f"  ✅ Creado: {directory.relative_to(self.base_path)}")
                except Exception as e:
                    self.errors.append(f"❌ Error creando {directory}: {e}")
            else:
                print(f"  ✅ Existe: {directory.relative_to(self.base_path)}")
    
    def _print_results(self):
        """Imprime resumen de validación"""
        print("\n" + "=" * 60)
        print("📊 RESUMEN DE VALIDACIÓN")
        print("=" * 60)
        
        if self.warnings:
            print("\n⚠️  ADVERTENCIAS:")
            for warning in self.warnings:
                print(f"  {warning}")
        
        if self.errors:
            print("\n❌ ERRORES:")
            for error in self.errors:
                print(f"  {error}")
            print("\n🛑 Validación FALLÓ. Corrije los errores antes de continuar.")
        else:
            print("\n✅ Validación EXITOSA")
            print("🚀 Puedes ejecutar el pipeline con:")
            print("   python scripts/parsers/run_dba_pipeline.py")


def main():
    validator = DBAValidator()
    success = validator.validate_all()
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
