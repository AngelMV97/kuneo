"""
taxonomy_parser.py

Parser para archivos de taxonomía curricular de Kuneo.
Lee archivos .txt del directorio data/clean/curriculum_map/ y los convierte a formato JSON.

Estructura jerárquica:
    DISCIPLINA → TEMATICA → SUBTEMATICA → MICROTOPICS

Materias soportadas:
    - matematicas
    - ciencias_naturales
    - ciencias_sociales
    - lenguaje
    - ingles (con metadatos adicionales: MCER_LEVEL, CORE_MODEL, COGNITIVE_ENGLISH_LAYER)

Autor: Sistema Kuneo
Fecha: 2026-05-12
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional


class TaxonomyParser:
    """Parser para archivos de taxonomía curricular."""
    
    def __init__(self, base_dir: str = "data/clean/curriculum_map"):
        """
        Inicializa el parser.
        
        Args:
            base_dir: Directorio raíz que contiene los subdirectorios de materias
        """
        self.base_dir = Path(base_dir)
        self.parsed_taxonomies: List[Dict[str, Any]] = []
    
    def parse_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """
        Parsea un archivo de taxonomía individual.
        
        Args:
            file_path: Ruta al archivo .txt
            
        Returns:
            Lista de diccionarios con las entradas de taxonomía
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extraer metadatos del encabezado
        subject = self._extract_field(content, "SUBJECT")
        grade_range = self._extract_field(content, "GRADE_RANGE")
        
        # Metadatos específicos de inglés
        mcer_level = self._extract_field(content, "MCER_LEVEL")
        core_model = self._extract_list_field(content, "CORE_MODEL")
        cognitive_layer = self._extract_list_field(content, "COGNITIVE_ENGLISH_LAYER")
        
        # Parsear la estructura jerárquica
        entries = self._parse_hierarchy(content, subject, grade_range, mcer_level, core_model, cognitive_layer)
        
        return entries
    
    def _extract_field(self, content: str, field_name: str) -> Optional[str]:
        """Extrae un campo simple del encabezado."""
        pattern = rf"^{field_name}:\s*(.+)$"
        match = re.search(pattern, content, re.MULTILINE)
        return match.group(1).strip() if match else None
    
    def _extract_list_field(self, content: str, field_name: str) -> Optional[List[str]]:
        """Extrae un campo de lista (con items que comienzan con -)."""
        pattern = rf"^{field_name}:\s*$\n((?:^-\s*.+$\n?)*)"
        match = re.search(pattern, content, re.MULTILINE)
        
        if not match:
            return None
        
        items_text = match.group(1)
        items = re.findall(r"^-\s*(.+)$", items_text, re.MULTILINE)
        return items if items else None
    
    def _parse_hierarchy(
        self,
        content: str,
        subject: str,
        grade_range: str,
        mcer_level: Optional[str],
        core_model: Optional[List[str]],
        cognitive_layer: Optional[List[str]]
    ) -> List[Dict[str, Any]]:
        """
        Parsea la estructura jerárquica del contenido.
        
        Returns:
            Lista de entradas de taxonomía (una por cada SUBTEMATICA)
        """
        entries = []
        
        # Dividir en bloques por DISCIPLINA
        discipline_blocks = re.split(r'\n(?=DISCIPLINA:)', content)
        
        for discipline_block in discipline_blocks:
            if not discipline_block.strip() or 'DISCIPLINA:' not in discipline_block:
                continue
            
            # Extraer disciplina
            discipline_match = re.search(r'^DISCIPLINA:\s*(.+)$', discipline_block, re.MULTILINE)
            if not discipline_match:
                continue
            discipline = discipline_match.group(1).strip()
            
            # Dividir en bloques por TEMATICA
            thematic_blocks = re.split(r'\n(?=TEMATICA:)', discipline_block)
            
            for thematic_block in thematic_blocks:
                if not thematic_block.strip() or 'TEMATICA:' not in thematic_block:
                    continue
                
                # Extraer temática
                thematic_match = re.search(r'^TEMATICA:\s*(.+)$', thematic_block, re.MULTILINE)
                if not thematic_match:
                    continue
                thematic = thematic_match.group(1).strip()
                
                # Dividir en bloques por SUBTEMATICA
                subthematic_blocks = re.split(r'\n(?=SUBTEMATICA:)', thematic_block)
                
                for subthematic_block in subthematic_blocks:
                    if not subthematic_block.strip() or 'SUBTEMATICA:' not in subthematic_block:
                        continue
                    
                    # Extraer subtemática
                    subthematic_match = re.search(r'^SUBTEMATICA:\s*(.+)$', subthematic_block, re.MULTILINE)
                    if not subthematic_match:
                        continue
                    subthematic = subthematic_match.group(1).strip()
                    
                    # Extraer microtopics
                    microtopics = []
                    microtopics_section = re.search(
                        r'MICROTOPICS:\s*\n((?:^-\s*.+$\n?)*)',
                        subthematic_block,
                        re.MULTILINE
                    )
                    
                    if microtopics_section:
                        microtopics_text = microtopics_section.group(1)
                        microtopics = re.findall(r'^-\s*(.+)$', microtopics_text, re.MULTILINE)
                        microtopics = [m.strip() for m in microtopics if m.strip()]
                    
                    # Solo crear entrada si hay microtopics
                    if microtopics:
                        entry = {
                            "subject": subject,
                            "grade_range": grade_range,
                            "discipline": discipline,
                            "thematic": thematic,
                            "subthematic": subthematic,
                            "microtopics": microtopics
                        }
                        
                        # Añadir metadatos de inglés si existen
                        if mcer_level:
                            entry["mcer_level"] = mcer_level
                        if core_model:
                            entry["core_model"] = core_model
                        if cognitive_layer:
                            entry["cognitive_layer"] = cognitive_layer
                        
                        entries.append(entry)
        
        return entries
    
    def parse_subject_directory(self, subject: str) -> List[Dict[str, Any]]:
        """
        Parsea todos los archivos .txt de una materia.
        
        Args:
            subject: Nombre del subdirectorio (matematicas, ingles, etc.)
            
        Returns:
            Lista de todas las entradas de taxonomía de esa materia
        """
        subject_dir = self.base_dir / subject
        
        if not subject_dir.exists():
            print(f"⚠️  Directorio no encontrado: {subject_dir}")
            return []
        
        all_entries = []
        txt_files = sorted(subject_dir.glob("*.txt"))
        
        print(f"\n📁 Procesando {subject}:")
        for txt_file in txt_files:
            print(f"   → {txt_file.name}", end="")
            entries = self.parse_file(txt_file)
            all_entries.extend(entries)
            print(f" ✓ ({len(entries)} entradas)")
        
        return all_entries
    
    def parse_all(self) -> List[Dict[str, Any]]:
        """
        Parsea todos los archivos de todas las materias.
        
        Returns:
            Lista completa de todas las entradas de taxonomía
        """
        subjects = ["matematicas", "ciencias", "sociales", "ingles", "lenguaje"]
        all_entries = []
        
        print("=" * 60)
        print("🔍 PARSER DE TAXONOMÍAS CURRICULARES")
        print("=" * 60)
        
        for subject in subjects:
            entries = self.parse_subject_directory(subject)
            all_entries.extend(entries)
        
        self.parsed_taxonomies = all_entries
        
        print("\n" + "=" * 60)
        print(f"✅ TOTAL: {len(all_entries)} entradas parseadas")
        print("=" * 60)
        
        return all_entries
    
    def save_to_json(self, output_file: str = "data/clean/curriculum_taxonomy.json"):
        """
        Guarda las taxonomías parseadas en formato JSON.
        
        Args:
            output_file: Ruta del archivo de salida
        """
        if not self.parsed_taxonomies:
            print("⚠️  No hay taxonomías parseadas. Ejecuta parse_all() primero.")
            return
        
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.parsed_taxonomies, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Guardado en: {output_path}")
        print(f"   Tamaño: {output_path.stat().st_size / 1024:.1f} KB")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Obtiene estadísticas de las taxonomías parseadas."""
        if not self.parsed_taxonomies:
            return {}
        
        stats = {
            "total_entries": len(self.parsed_taxonomies),
            "by_subject": {},
            "by_grade_range": {},
            "total_microtopics": 0,
            "avg_microtopics_per_entry": 0
        }
        
        total_microtopics = 0
        
        for entry in self.parsed_taxonomies:
            # Por materia
            subject = entry["subject"]
            stats["by_subject"][subject] = stats["by_subject"].get(subject, 0) + 1
            
            # Por grado
            grade = entry["grade_range"]
            stats["by_grade_range"][grade] = stats["by_grade_range"].get(grade, 0) + 1
            
            # Microtopics
            total_microtopics += len(entry["microtopics"])
        
        stats["total_microtopics"] = total_microtopics
        stats["avg_microtopics_per_entry"] = total_microtopics / len(self.parsed_taxonomies)
        
        return stats
    
    def print_statistics(self):
        """Imprime estadísticas detalladas."""
        stats = self.get_statistics()
        
        if not stats:
            print("⚠️  No hay estadísticas disponibles.")
            return
        
        print("\n" + "=" * 60)
        print("📊 ESTADÍSTICAS")
        print("=" * 60)
        
        print(f"\nTotal de entradas: {stats['total_entries']}")
        print(f"Total de microtopics: {stats['total_microtopics']}")
        print(f"Promedio de microtopics por entrada: {stats['avg_microtopics_per_entry']:.1f}")
        
        print("\n📚 Por materia:")
        for subject, count in sorted(stats['by_subject'].items()):
            print(f"   {subject:20} → {count:3} entradas")
        
        print("\n🎓 Por rango de grado:")
        for grade, count in sorted(stats['by_grade_range'].items()):
            print(f"   {grade:10} → {count:3} entradas")


def main():
    """Función principal para ejecutar el parser."""
    parser = TaxonomyParser()
    
    # Parsear todos los archivos
    parser.parse_all()
    
    # Mostrar estadísticas
    parser.print_statistics()
    
    # Guardar a JSON
    parser.save_to_json()
    
    print("\n✅ Parser completado exitosamente")


if __name__ == "__main__":
    main()
