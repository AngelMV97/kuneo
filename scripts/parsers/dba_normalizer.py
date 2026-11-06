"""
KUNEO DBA NORMALIZER
Normaliza los competency units parseados en formato estándar cognitivo

Input: data/processed/parsed/dba/{subject}/{grade}.json
Output: data/processed/normalized/competency_units/dba/{subject}/{grade}.json
        data/processed/normalized/competency_units/all_competency_units.json
"""

import json
import uuid
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime


class DBANormalizer:
    """Normaliza competency units DBA a formato estándar"""
    
    def __init__(self):
        self.cognitive_dimensions = {
            'comprension': 'understanding',
            'representacion': 'representation',
            'razonamiento': 'reasoning',
            'transferencia': 'transfer',
            'metacognicion': 'metacognition'
        }
        
        # Mapeo de conceptos a dimensiones cognitivas
        self.concept_to_dimension = {
            # Comprensión: entender conceptos, definiciones, propiedades
            'comprension': ['concepto', 'definicion', 'propiedad', 'caracteristica', 
                           'identifica', 'reconoce', 'describe', 'explica'],
            
            # Representación: múltiples formas de representar (visual, simbólico, verbal)
            'representacion': ['representa', 'grafica', 'diagrama', 'modelo', 'simbolo',
                              'expresa', 'ilustra', 'dibuja'],
            
            # Razonamiento: análisis, inferencia, argumentación
            'razonamiento': ['analiza', 'compara', 'relaciona', 'deduce', 'infiere',
                            'argumenta', 'justifica', 'concluye', 'predice'],
            
            # Transferencia: aplicar en nuevos contextos
            'transferencia': ['aplica', 'resuelve', 'utiliza', 'problema', 'situacion',
                             'contexto', 'ejemplo', 'caso'],
            
            # Metacognición: reflexión sobre el proceso
            'metacognicion': ['estrategia', 'procedimiento', 'proceso', 'evalua',
                             'reflexiona', 'monitorea', 'planifica']
        }
    
    def normalize_file(self, input_file: Path) -> List[Dict[str, Any]]:
        """
        Normaliza un archivo JSON parseado
        
        Args:
            input_file: Archivo JSON con competency units parseados
            
        Returns:
            Lista de competency units normalizados
        """
        with open(input_file, 'r', encoding='utf-8') as f:
            parsed_units = json.load(f)
        
        normalized = []
        for unit in parsed_units:
            norm_unit = self._normalize_unit(unit)
            normalized.append(norm_unit)
        
        return normalized
    
    def _normalize_unit(self, unit: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normaliza un competency unit individual
        Agrega:
        - Dimensiones cognitivas identificadas
        - Nivel de complejidad
        - Keywords para búsqueda
        - Embedding metadata
        """
        # Determinar dimensiones cognitivas
        cognitive_dims = self._identify_cognitive_dimensions(unit)
        
        # Calcular nivel de complejidad
        complexity_level = self._calculate_complexity(unit)
        
        # Extraer keywords para búsqueda semántica
        keywords = self._extract_keywords(unit)
        
        # Construir competency unit normalizado
        normalized = {
            "id": unit.get("id", str(uuid.uuid4())),
            "type": "competency_unit",
            "source": unit.get("source", "dba"),
            "source_id": f"dba_{unit.get('dba_number', 0)}",
            
            # Metadata curricular
            "curriculum": {
                "subject": unit.get("subject"),
                "grade_range": unit.get("grade_range"),
                "dba_number": unit.get("dba_number")
            },
            
            # Contenido cognitivo
            "content": {
                "competency": unit["content"]["competency"],
                "evidence": unit["content"]["evidence"],
                "examples": unit["content"]["examples"],
                "concepts": unit["content"].get("concepts", []),
                "misconceptions": unit["content"].get("misconceptions", [])
            },
            
            # Análisis cognitivo
            "cognitive_analysis": {
                "dimensions": cognitive_dims,
                "primary_dimension": self._get_primary_dimension(cognitive_dims),
                "complexity_level": complexity_level,
                "keywords": keywords
            },
            
            # Metadata para embeddings
            "embedding_metadata": {
                "text_for_embedding": self._prepare_embedding_text(unit),
                "chunk_size": len(unit["content"]["competency"].split()),
                "requires_chunking": False
            },
            
            # Metadata de procesamiento
            "processing": {
                "parsed_at": datetime.now().isoformat(),
                "parser_version": "1.0",
                "is_english": unit.get("metadata", {}).get("is_english", False)
            }
        }
        
        return normalized
    
    def _identify_cognitive_dimensions(self, unit: Dict[str, Any]) -> Dict[str, float]:
        """
        Identifica qué dimensiones cognitivas están presentes
        Retorna scores de 0-1 para cada dimensión
        """
        competency = unit["content"]["competency"].lower()
        evidences = " ".join(unit["content"]["evidence"]).lower()
        
        full_text = f"{competency} {evidences}"
        
        dimension_scores = {}
        
        for dimension, keywords in self.concept_to_dimension.items():
            score = 0
            for keyword in keywords:
                if keyword in full_text:
                    score += 1
            
            # Normalizar score (0-1)
            normalized_score = min(score / len(keywords), 1.0)
            dimension_scores[dimension] = round(normalized_score, 2)
        
        return dimension_scores
    
    def _get_primary_dimension(self, dimension_scores: Dict[str, float]) -> str:
        """Retorna la dimensión cognitiva con mayor score"""
        if not dimension_scores:
            return "comprension"  # default
        
        return max(dimension_scores.items(), key=lambda x: x[1])[0]
    
    def _calculate_complexity(self, unit: Dict[str, Any]) -> int:
        """
        Calcula nivel de complejidad (1-5)
        Basado en:
        - Cantidad de evidencias
        - Longitud de competencia
        - Cantidad de conceptos
        - Grado escolar
        """
        evidence_count = len(unit["content"]["evidence"])
        competency_length = len(unit["content"]["competency"].split())
        concept_count = len(unit["content"].get("concepts", []))
        
        # Extraer grado (puede ser "4" o "4-5")
        grade_str = unit.get("grade_range", "1")
        try:
            grade = int(grade_str.split('-')[0])
        except:
            grade = 1
        
        # Score basado en factores
        complexity = 0
        
        # Factor 1: Evidencias (más evidencias = más complejo)
        if evidence_count >= 5:
            complexity += 2
        elif evidence_count >= 3:
            complexity += 1
        
        # Factor 2: Longitud de competencia
        if competency_length > 30:
            complexity += 1
        
        # Factor 3: Conceptos
        if concept_count >= 5:
            complexity += 1
        
        # Factor 4: Grado escolar (grados mayores = más complejo)
        if grade >= 9:
            complexity += 2
        elif grade >= 6:
            complexity += 1
        
        # Asegurar rango 1-5
        return max(1, min(5, complexity))
    
    def _extract_keywords(self, unit: Dict[str, Any]) -> List[str]:
        """
        Extrae keywords importantes para búsqueda
        Combina: concepts + términos clave de competencia
        """
        keywords = set()
        
        # Agregar concepts ya identificados
        keywords.update(unit["content"].get("concepts", []))
        
        # Extraer sustantivos importantes de la competencia
        competency = unit["content"]["competency"].lower()
        
        # Palabras clave comunes por materia
        subject_keywords = {
            'mathematics': ['numero', 'operacion', 'figura', 'medida', 'patron'],
            'natural_sciences': ['organismo', 'materia', 'energia', 'sistema', 'proceso'],
            'language': ['texto', 'escritura', 'lectura', 'comunicacion', 'lenguaje'],
            'social_studies': ['sociedad', 'historia', 'territorio', 'cultura', 'comunidad'],
            'english': ['verb', 'noun', 'sentence', 'conversation', 'text']
        }
        
        subject = unit.get("subject")
        relevant_keywords = subject_keywords.get(subject, [])
        
        for keyword in relevant_keywords:
            if keyword in competency:
                keywords.add(keyword)
        
        return sorted(list(keywords))
    
    def _prepare_embedding_text(self, unit: Dict[str, Any]) -> str:
        """
        Prepara texto para generar embeddings
        Combina competencia + evidencias de forma coherente
        """
        competency = unit["content"]["competency"]
        evidences = unit["content"]["evidence"]
        
        # Formato: Competencia. Evidencias: 1) ..., 2) ..., 3) ...
        evidence_text = ". ".join([f"{i+1}) {ev}" for i, ev in enumerate(evidences)])
        
        full_text = f"{competency}. Evidencias: {evidence_text}"
        
        return full_text


def normalize_all_dbas():
    """
    Normaliza todos los archivos DBA parseados
    Genera:
    1. Archivos individuales por subject/grade
    2. Archivo consolidado all_competency_units.json
    """
    normalizer = DBANormalizer()
    
    # Rutas
    base_path = Path(__file__).parent.parent.parent
    input_path = base_path / 'data' / 'processed' / 'parsed' / 'dba'
    output_path = base_path / 'data' / 'processed' / 'normalized' / 'competency_units' / 'dba'
    
    all_units = []
    
    print("\n🔄 Normalizando competency units DBA...\n")
    
    # Procesar cada archivo JSON
    for subject_dir in sorted(input_path.iterdir()):
        if not subject_dir.is_dir():
            continue
        
        subject = subject_dir.name
        print(f"📚 {subject}...")
        
        for json_file in sorted(subject_dir.glob('*.json')):
            grade = json_file.stem
            
            print(f"  → Grado {grade}...", end=' ')
            
            try:
                # Normalizar
                normalized_units = normalizer.normalize_file(json_file)
                
                # Guardar archivo individual
                output_subject_path = output_path / subject
                output_subject_path.mkdir(parents=True, exist_ok=True)
                
                output_file = output_subject_path / f"{grade}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(normalized_units, f, ensure_ascii=False, indent=2)
                
                # Agregar a lista consolidada
                all_units.extend(normalized_units)
                
                print(f"✅ {len(normalized_units)} unidades")
                
            except Exception as e:
                print(f"❌ Error: {e}")
    
    # Guardar archivo consolidado
    print("\n💾 Guardando archivo consolidado...")
    consolidated_path = base_path / 'data' / 'processed' / 'normalized' / 'competency_units'
    consolidated_path.mkdir(parents=True, exist_ok=True)
    
    consolidated_file = consolidated_path / 'all_competency_units.json'
    with open(consolidated_file, 'w', encoding='utf-8') as f:
        json.dump(all_units, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(all_units)} competency units totales guardadas en:")
    print(f"   {consolidated_file}")
    
    # Estadísticas
    print("\n📊 Estadísticas:")
    by_subject = {}
    by_grade = {}
    
    for unit in all_units:
        subject = unit["curriculum"]["subject"]
        grade = unit["curriculum"]["grade_range"]
        
        by_subject[subject] = by_subject.get(subject, 0) + 1
        by_grade[grade] = by_grade.get(grade, 0) + 1
    
    print("\n  Por materia:")
    for subject, count in sorted(by_subject.items()):
        print(f"    {subject}: {count}")
    
    print("\n  Por grado:")
    for grade, count in sorted(by_grade.items()):
        print(f"    {grade}: {count}")
    
    print("\n✨ Normalización completada!")


if __name__ == '__main__':
    normalize_all_dbas()
