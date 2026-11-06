"""
KUNEO STANDARDS NORMALIZER
Convierte estándares parseados en competency units normalizados

Input: data/processed/parsed/standards/{subject}/{grade_range}.json
Output: data/processed/normalized/competency_units/standards/{subject}/{grade_range}.json
        data/processed/normalized/competency_units/all_competency_units.json (consolidado)
"""

import json
import uuid
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime


class StandardsNormalizer:
    """Normaliza estándares a formato competency_unit"""
    
    def __init__(self):
        self.cognitive_dimensions = ['comprension', 'representacion', 'razonamiento', 'transferencia', 'metacognicion']
    
    def normalize_file(self, input_file: Path) -> List[Dict[str, Any]]:
        """
        Normaliza un archivo JSON parseado de estándares
        Cada item/subproceso → 1 competency_unit
        
        Args:
            input_file: Archivo JSON con estándares parseados
            
        Returns:
            Lista de competency units normalizados
        """
        with open(input_file, 'r', encoding='utf-8') as f:
            parsed_standards = json.load(f)
        
        competency_units = []
        
        subject = parsed_standards['subject']
        grade_range = parsed_standards['grade_range']
        structure_mode = parsed_standards['structure_mode']
        
        # Procesar según estructura
        for axis in parsed_standards.get('axes', []):
            if structure_mode == 'math':
                competency_units.extend(
                    self._normalize_math_axis(axis, subject, grade_range, structure_mode)
                )
            elif structure_mode == 'language':
                competency_units.extend(
                    self._normalize_language_axis(axis, subject, grade_range, structure_mode)
                )
            elif structure_mode == 'science':
                competency_units.extend(
                    self._normalize_science_axis(axis, subject, grade_range, structure_mode)
                )
            elif structure_mode == 'english':
                competency_units.extend(
                    self._normalize_english_axis(axis, subject, grade_range, structure_mode)
                )
        
        return competency_units
    
    def _normalize_math_axis(
        self, 
        axis: Dict[str, Any], 
        subject: str, 
        grade_range: str,
        structure_mode: str
    ) -> List[Dict[str, Any]]:
        """
        Normaliza un eje de matemáticas
        Cada item → 1 competency unit
        """
        units = []
        
        for item in axis.get('items', []):
            unit = self._create_competency_unit(
                competency=item,
                subject=subject,
                grade_range=grade_range,
                structure_mode=structure_mode,
                axis_key=axis['key'],
                axis_name=axis['name'],
                axis_type=axis['type']
            )
            units.append(unit)
        
        return units
    
    def _normalize_language_axis(
        self, 
        axis: Dict[str, Any], 
        subject: str, 
        grade_range: str,
        structure_mode: str
    ) -> List[Dict[str, Any]]:
        """
        Normaliza un factor de lenguaje
        Cada subproceso → 1 competency unit (con referencia al standard padre)
        """
        units = []
        
        for standard in axis.get('standards', []):
            for subprocess in standard.get('subprocesses', []):
                unit = self._create_competency_unit(
                    competency=subprocess,
                    subject=subject,
                    grade_range=grade_range,
                    structure_mode=structure_mode,
                    axis_key=axis['key'],
                    axis_name=axis['name'],
                    axis_type=axis['type'],
                    parent_standard=standard['statement']
                )
                units.append(unit)
        
        return units
    
    def _normalize_science_axis(
        self, 
        axis: Dict[str, Any], 
        subject: str, 
        grade_range: str,
        structure_mode: str
    ) -> List[Dict[str, Any]]:
        """
        Normaliza un eje de ciencias
        Puede tener: subaxes con items, processes con items, o divisions con items
        """
        units = []
        
        # Items directos del axis (poco común)
        for item in axis.get('items', []):
            unit = self._create_competency_unit(
                competency=item,
                subject=subject,
                grade_range=grade_range,
                structure_mode=structure_mode,
                axis_key=axis['key'],
                axis_name=axis['name'],
                axis_type=axis['type']
            )
            units.append(unit)
        
        # Divisions (para sociales 10-11)
        for division in axis.get('divisions', []):
            for item in division.get('items', []):
                unit = self._create_competency_unit(
                    competency=item,
                    subject=subject,
                    grade_range=grade_range,
                    structure_mode=structure_mode,
                    axis_key=axis['key'],
                    axis_name=axis['name'],
                    axis_type=axis['type'],
                    division_key=division['key'],
                    division_name=division['name']
                )
                units.append(unit)
        
        # Subaxes
        for subaxis in axis.get('subaxes', []):
            # Items directos del subaxis
            for item in subaxis.get('items', []):
                unit = self._create_competency_unit(
                    competency=item,
                    subject=subject,
                    grade_range=grade_range,
                    structure_mode=structure_mode,
                    axis_key=axis['key'],
                    axis_name=axis['name'],
                    axis_type=axis['type'],
                    subaxis_key=subaxis['key'],
                    subaxis_name=subaxis['name']
                )
                units.append(unit)
            
            # Processes (para naturales 10-11)
            for process in subaxis.get('processes', []):
                for item in process.get('items', []):
                    unit = self._create_competency_unit(
                        competency=item,
                        subject=subject,
                        grade_range=grade_range,
                        structure_mode=structure_mode,
                        axis_key=axis['key'],
                        axis_name=axis['name'],
                        axis_type=axis['type'],
                        subaxis_key=subaxis['key'],
                        subaxis_name=subaxis['name'],
                        process_key=process['key'],
                        process_name=process['name']
                    )
                    units.append(unit)
        
        return units
    
    def _normalize_english_axis(
        self, 
        axis: Dict[str, Any], 
        subject: str, 
        grade_range: str,
        structure_mode: str
    ) -> List[Dict[str, Any]]:
        """
        Normaliza una habilidad de inglés
        Cada item → 1 competency unit
        """
        units = []
        
        for item in axis.get('items', []):
            unit = self._create_competency_unit(
                competency=item,
                subject=subject,
                grade_range=grade_range,
                structure_mode=structure_mode,
                axis_key=axis['key'],
                axis_name=axis['name'],
                axis_type=axis['type']
            )
            units.append(unit)
        
        return units
    
    def _create_competency_unit(
        self,
        competency: str,
        subject: str,
        grade_range: str,
        structure_mode: str,
        axis_key: str,
        axis_name: str,
        axis_type: str,
        subaxis_key: str = None,
        subaxis_name: str = None,
        process_key: str = None,
        process_name: str = None,
        division_key: str = None,
        division_name: str = None,
        parent_standard: str = None
    ) -> Dict[str, Any]:
        """
        Crea un competency unit normalizado a partir de un estándar individual
        """
        # Análisis cognitivo básico
        cognitive_dims = self._identify_cognitive_dimensions(competency)
        complexity_level = self._calculate_complexity(competency, grade_range)
        keywords = self._extract_keywords(competency, subject)
        
        # Construir metadata jerárquica
        hierarchy = {
            "axis_key": axis_key,
            "axis_name": axis_name,
            "axis_type": axis_type
        }
        
        if subaxis_key:
            hierarchy["subaxis_key"] = subaxis_key
            hierarchy["subaxis_name"] = subaxis_name
        
        if process_key:
            hierarchy["process_key"] = process_key
            hierarchy["process_name"] = process_name
        
        if division_key:
            hierarchy["division_key"] = division_key
            hierarchy["division_name"] = division_name
        
        if parent_standard:
            hierarchy["parent_standard"] = parent_standard
        
        # Construir competency unit
        unit = {
            "id": str(uuid.uuid4()),
            "type": "competency_unit",
            "source": "standard",
            "source_id": f"standard_{axis_key}",
            
            "curriculum": {
                "subject": subject,
                "grade_range": grade_range,
                "structure_mode": structure_mode,
                "hierarchy": hierarchy
            },
            
            "content": {
                "competency": competency,
                "evidence": [],  # Los estándares no tienen evidencias explícitas
                "examples": [],  # Los estándares no tienen ejemplos
                "concepts": keywords,
                "misconceptions": []  # Se pueden agregar después
            },
            
            "cognitive_analysis": {
                "dimensions": cognitive_dims,
                "primary_dimension": self._get_primary_dimension(cognitive_dims),
                "complexity_level": complexity_level,
                "keywords": keywords
            },
            
            "embedding_metadata": {
                "text_for_embedding": self._prepare_embedding_text(competency, hierarchy),
                "chunk_size": len(competency.split()),
                "requires_chunking": False
            },
            
            "processing": {
                "parsed_at": datetime.now().isoformat(),
                "parser_version": "1.0"
            }
        }
        
        return unit
    
    def _identify_cognitive_dimensions(self, text: str) -> Dict[str, float]:
        """
        Identifica dimensiones cognitivas presentes
        Basado en verbos y términos clave
        """
        text_lower = text.lower()
        
        dimension_keywords = {
            'comprension': ['comprendo', 'identifico', 'reconozco', 'describo', 'explico', 'caracterizo'],
            'representacion': ['represento', 'modelo', 'ilustro', 'grafico', 'simbolizo', 'expreso'],
            'razonamiento': ['analizo', 'comparo', 'relaciono', 'deduzco', 'argumento', 'justifico', 'infiero'],
            'transferencia': ['aplico', 'resuelvo', 'utilizo', 'formulo', 'propongo', 'diseño'],
            'metacognicion': ['evaluo', 'reflexiono', 'monitoreo', 'estrategia', 'proceso', 'autocontrol']
        }
        
        dimension_scores = {}
        
        for dimension, keywords in dimension_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            # Normalizar (0-1)
            normalized = min(score / len(keywords), 1.0)
            dimension_scores[dimension] = round(normalized, 2)
        
        return dimension_scores
    
    def _get_primary_dimension(self, dimension_scores: Dict[str, float]) -> str:
        """Retorna la dimensión con mayor score"""
        if not dimension_scores or all(v == 0 for v in dimension_scores.values()):
            return "comprension"  # default
        
        return max(dimension_scores.items(), key=lambda x: x[1])[0]
    
    def _calculate_complexity(self, text: str, grade_range: str) -> int:
        """
        Calcula nivel de complejidad (1-5)
        Basado en longitud del texto y grado
        """
        word_count = len(text.split())
        
        # Extraer grado inicial
        try:
            grade_start = int(grade_range.split('-')[0])
        except:
            grade_start = 1
        
        complexity = 1
        
        # Factor 1: Longitud del texto
        if word_count > 30:
            complexity += 2
        elif word_count > 20:
            complexity += 1
        
        # Factor 2: Grado escolar
        if grade_start >= 10:
            complexity += 2
        elif grade_start >= 6:
            complexity += 1
        
        return max(1, min(5, complexity))
    
    def _extract_keywords(self, text: str, subject: str) -> List[str]:
        """Extrae keywords relevantes del texto"""
        keywords = []
        text_lower = text.lower()
        
        # Keywords por materia (simplificado)
        subject_keywords = {
            'mathematics': ['numero', 'fraccion', 'ecuacion', 'geometria', 'medida', 'dato', 'grafica'],
            'natural_sciences': ['celula', 'energia', 'materia', 'fuerza', 'ecosistema', 'organismo'],
            'social_studies': ['sociedad', 'cultura', 'historia', 'territorio', 'economia', 'politica'],
            'language': ['texto', 'lectura', 'escritura', 'comunicacion', 'literatura', 'lenguaje'],
            'english': ['reading', 'writing', 'listening', 'speaking', 'conversation', 'grammar']
        }
        
        relevant = subject_keywords.get(subject, [])
        
        for keyword in relevant:
            if keyword in text_lower:
                keywords.append(keyword)
        
        return keywords[:5]  # Máximo 5 keywords
    
    def _prepare_embedding_text(self, competency: str, hierarchy: Dict[str, Any]) -> str:
        """
        Prepara texto para embeddings
        Incluye contexto jerárquico
        """
        # Formato: [Axis] [Subaxis] Competencia
        parts = []
        
        if hierarchy.get('axis_name'):
            parts.append(f"[{hierarchy['axis_name']}]")
        
        if hierarchy.get('subaxis_name'):
            parts.append(f"[{hierarchy['subaxis_name']}]")
        
        if hierarchy.get('process_name'):
            parts.append(f"[{hierarchy['process_name']}]")
        
        parts.append(competency)
        
        return " ".join(parts)


def normalize_all_standards():
    """
    Normaliza todos los archivos de estándares parseados
    Genera archivos individuales y consolidado
    """
    normalizer = StandardsNormalizer()
    
    # Rutas
    base_path = Path(__file__).parent.parent.parent
    input_path = base_path / 'data' / 'processed' / 'parsed' / 'standards'
    output_path = base_path / 'data' / 'processed' / 'normalized' / 'competency_units' / 'standards'
    
    all_units = []
    
    print("\n🔄 Normalizando competency units de Estándares...\n")
    
    # Procesar cada archivo JSON
    for subject_dir in sorted(input_path.iterdir()):
        if not subject_dir.is_dir():
            continue
        
        subject = subject_dir.name
        print(f"📚 {subject}...")
        
        for json_file in sorted(subject_dir.glob('*.json')):
            grade_range = json_file.stem
            
            print(f"  → Grados {grade_range}...", end=' ')
            
            try:
                # Normalizar
                normalized_units = normalizer.normalize_file(json_file)
                
                # Guardar archivo individual
                output_subject_path = output_path / subject
                output_subject_path.mkdir(parents=True, exist_ok=True)
                
                output_file = output_subject_path / f"{grade_range}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(normalized_units, f, ensure_ascii=False, indent=2)
                
                # Agregar a lista consolidada
                all_units.extend(normalized_units)
                
                print(f"✅ {len(normalized_units)} unidades")
                
            except Exception as e:
                print(f"❌ Error: {e}")
                import traceback
                traceback.print_exc()
    
    # Guardar archivo consolidado
    print("\n💾 Guardando archivo consolidado...")
    consolidated_path = base_path / 'data' / 'processed' / 'normalized' / 'competency_units'
    consolidated_path.mkdir(parents=True, exist_ok=True)
    
    # Leer DBAs existentes si existen
    dba_file = consolidated_path / 'all_competency_units.json'
    existing_dbas = []
    if dba_file.exists():
        with open(dba_file, 'r', encoding='utf-8') as f:
            existing_dbas = json.load(f)
    
    # Combinar DBAs + Standards
    all_combined = existing_dbas + all_units
    
    consolidated_file = consolidated_path / 'all_competency_units.json'
    with open(consolidated_file, 'w', encoding='utf-8') as f:
        json.dump(all_combined, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(all_units)} competency units de estándares")
    print(f"✅ {len(existing_dbas)} competency units de DBAs")
    print(f"✅ {len(all_combined)} competency units totales guardadas en:")
    print(f"   {consolidated_file}")
    
    # Estadísticas
    print("\n📊 Estadísticas de Estándares:")
    by_subject = {}
    by_grade = {}
    
    for unit in all_units:
        subject = unit["curriculum"]["subject"]
        grade_range = unit["curriculum"]["grade_range"]
        
        by_subject[subject] = by_subject.get(subject, 0) + 1
        by_grade[grade_range] = by_grade.get(grade_range, 0) + 1
    
    print("\n  Por materia:")
    for subject, count in sorted(by_subject.items()):
        print(f"    {subject}: {count}")
    
    print("\n  Por grupo de grados:")
    for grade_range, count in sorted(by_grade.items()):
        print(f"    {grade_range}: {count}")
    
    print("\n✨ Normalización completada!")


if __name__ == '__main__':
    normalize_all_standards()
