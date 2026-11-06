"""
KUNEO UNIVERSAL NORMALIZER
Normaliza DBA y Estándares parseados a un formato común

Flujo:
  data/clean/*.txt
    ↓ parsers específicos
  data/processed/parsed/*.json
    ↓ normalizador universal
  data/processed/normalized/competency_units/*.json
    ↓ embeddings / Supabase

Estructura unificada:
{
  "id": "uuid",
  "type": "competency_unit",
  "source": "dba" | "standard",
  "subject": "matematicas",
  "grade_range": "5",
  "difficulty": 3,
  "content": {
    "competency": "...",
    "evidence": [],
    "example": "",
    "concepts": [],
    "misconceptions": [],
    "metadata": {}
  }
}
"""

import json
import uuid
from pathlib import Path
from typing import List, Dict, Any
import re
import unicodedata


class UniversalNormalizer:
    """Normalizador universal para DBAs y Estándares"""
    
    def __init__(self):
        self.statistics_support = json.loads((Path(__file__).resolve().parents[2] / "server" / "curriculumDerivationRules.json").read_text(encoding="utf-8"))["statistics_support"]
        self.concept_keywords = {
            'fracciones': ['fracción', 'fracciones', 'racional', 'parte', 'todo', 'numerador', 'denominador'],
            'proporcionalidad': ['razón', 'proporción', 'dependencia', 'variación', 'proporcional'],
            'potenciacion': ['potencia', 'potenciación', 'exponente', 'base'],
            'area_perimetro': ['área', 'perímetro', 'superficie'],
            'volumen': ['volumen', 'cubo', 'sólido', 'capacidad'],
            'plano_cartesiano': ['plano cartesiano', 'coordenadas', 'trayectoria', 'ejes'],
            'estadistica': ['media', 'mediana', 'datos', 'frecuencia', 'gráfico', 'promedio'],
            'probabilidad': ['azar', 'probabilidad', 'evento', 'espacio muestral', 'aleatorio'],
            'lectura_inferencial': ['interpreta', 'infiere', 'comprende', 'texto', 'lectura'],
            'argumentacion': ['argumenta', 'justifica', 'evidencia', 'sustenta'],
            'electricidad': ['corriente eléctrica', 'circuito', 'conductor', 'aislante'],
            'ecosistema': ['ecosistema', 'cadena alimenticia', 'habitat', 'biodiversidad'],
            'celula': ['célula', 'organelo', 'membrana', 'núcleo'],
            'movimiento': ['movimiento', 'velocidad', 'fuerza', 'aceleración'],
            'sociedad': ['sociedad', 'cultura', 'comunidad', 'grupo social'],
            'territorio': ['territorio', 'espacio', 'geografía', 'región'],
            'historia': ['historia', 'época', 'periodo', 'tiempo'],
            'escritura': ['escritura', 'redacción', 'composición', 'producción textual'],
            'gramatica': ['gramática', 'sintaxis', 'ortografía', 'morfología'],
            'listening': ['listening', 'hear', 'audio', 'sound'],
            'speaking': ['speaking', 'talk', 'conversation', 'dialogue'],
            'reading': ['reading', 'text', 'comprehension'],
            'writing': ['writing', 'compose', 'essay']
        }
        
        self.misconception_patterns = {
            'fracción': 'pensar que una fracción solo representa una parte de un objeto y no una relación',
            'área': 'creer que figuras con igual área siempre tienen igual perímetro',
            'perímetro': 'creer que figuras con igual perímetro siempre tienen igual área',
            'media': 'confundir promedio con valor representativo en todos los casos',
            'mediana': 'pensar que la mediana siempre es igual al promedio',
            'probabilidad': 'creer que un evento probable siempre ocurrirá',
            'conductor': 'creer que todos los materiales conducen electricidad de la misma forma',
            'aislante': 'pensar que los aislantes no conducen nada de electricidad',
            'célula': 'creer que todas las células son iguales',
            'ecosistema': 'pensar que los ecosistemas son estáticos',
            'proporción': 'confundir proporcionalidad directa con inversa',
            'texto': 'creer que la interpretación de un texto es única'
        }
    
    def normalize_parsed_document(self, parsed: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Normaliza un documento parseado (DBA o Estándares)
        
        Args:
            parsed: JSON parseado del parser específico
            
        Returns:
            Lista de competency units normalizados
        """
        if self._is_dba_document(parsed):
            return self._normalize_dba(parsed)
        
        if self._is_standards_document(parsed):
            return self._normalize_standards(parsed)
        
        raise ValueError("Formato de documento no soportado")
    
    def _is_dba_document(self, parsed: Dict[str, Any]) -> bool:
        """Detecta si es un documento DBA"""
        # Si es una lista, verificar el primer elemento
        if isinstance(parsed, list):
            return len(parsed) > 0 and parsed[0].get('source') == 'dba'
        
        return (
            parsed.get('source') == 'dba' or
            parsed.get('type') == 'dba_collection' or
            'dbas' in parsed or
            'items' in parsed and parsed.get('source') == 'dba'
        )
    
    def _is_standards_document(self, parsed: Dict[str, Any]) -> bool:
        """Detecta si es un documento de Estándares"""
        return (
            parsed.get('source') == 'standard' or
            'structure_mode' in parsed or
            'axes' in parsed
        )
    
    def _normalize_dba(self, parsed: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Normaliza documento DBA
        
        Un DBA parseado puede ser:
        - Lista de items (formato actual del parser)
        - Objeto con 'dbas' (formato alternativo)
        """
        # Obtener lista de DBAs
        dbas = parsed if isinstance(parsed, list) else parsed.get('dbas', parsed.get('items', []))
        
        normalized_units = []
        
        for dba in dbas:
            # Extraer información básica
            subject = dba.get('area') or dba.get('subject') or (parsed.get('subject', '') if isinstance(parsed, dict) else '')
            grade_range = str(dba.get('grade') or dba.get('grade_range') or (parsed.get('grade', '') if isinstance(parsed, dict) else ''))
            
            # Extraer contenido (el parser actual ya lo tiene en 'content')
            content_obj = dba.get('content', {})
            competency = dba.get('enunciado') or dba.get('statement') or content_obj.get('competency', '')
            evidence = dba.get('evidencias') or dba.get('evidence') or content_obj.get('evidence', [])
            
            # Manejar ejemplos (pueden ser objetos o string)
            example_data = dba.get('ejemplo') or dba.get('example') or content_obj.get('examples', [])
            example = self._extract_example_text(example_data)
            
            # Crear competency unit normalizado
            unit = self._build_competency_unit(
                source='dba',
                subject=subject,
                grade_range=grade_range,
                competency=competency,
                evidence=evidence,
                example=example,
                metadata={
                    'dba_number': dba.get('number') or dba.get('dba_number')
                }
            )
            
            normalized_units.append(unit)
        
        return normalized_units
    
    def _normalize_standards(self, parsed: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Normaliza documento de Estándares
        
        Estructura depende del modo:
        - language: FACTOR → STANDARD → subprocesses
        - math/english: PENSAMIENTO/HABILIDAD → items
        - science: AXIS → SUBAXIS → items (con casos especiales)
        """
        units = []
        
        subject = parsed.get('subject', '')
        grade_range = parsed.get('grade_range', '')
        structure_mode = parsed.get('structure_mode', '')
        
        for axis in parsed.get('axes', []):
            if structure_mode == 'language':
                # FACTOR → STANDARD → subprocesses
                # Cada subprocess es un competency unit con el standard como evidencia
                for standard in axis.get('standards', []):
                    statement = standard.get('statement', '')
                    subprocesses = standard.get('subprocesses', [])
                    
                    unit = self._build_competency_unit(
                        source='standard',
                        subject=subject,
                        grade_range=grade_range,
                        competency=statement,
                        evidence=subprocesses,
                        example='',
                        metadata={
                            'structure_mode': structure_mode,
                            'axis': axis.get('key') or axis.get('name'),
                            'axis_name': axis.get('name')
                        }
                    )
                    units.append(unit)
            
            elif structure_mode in ['math', 'english']:
                # PENSAMIENTO/HABILIDAD → items
                # Cada item es un competency unit independiente
                for item in axis.get('items', []):
                    unit = self._build_competency_unit(
                        source='standard',
                        subject=subject,
                        grade_range=grade_range,
                        competency=item,
                        evidence=[],
                        example='',
                        metadata={
                            'structure_mode': structure_mode,
                            'axis': axis.get('key') or axis.get('name'),
                            'axis_name': axis.get('name')
                        }
                    )
                    units.append(unit)
            
            elif structure_mode == 'science':
                # AXIS → SUBAXIS → items (con procesos/divisiones)
                # Cada item es un competency unit
                
                # Items directos del axis
                for item in axis.get('items', []):
                    unit = self._build_competency_unit(
                        source='standard',
                        subject=subject,
                        grade_range=grade_range,
                        competency=item,
                        evidence=[],
                        example='',
                        metadata={
                            'structure_mode': structure_mode,
                            'axis': axis.get('key') or axis.get('name'),
                            'axis_name': axis.get('name')
                        }
                    )
                    units.append(unit)
                
                # Divisions (sociales 10-11)
                for division in axis.get('divisions', []):
                    for item in division.get('items', []):
                        unit = self._build_competency_unit(
                            source='standard',
                            subject=subject,
                            grade_range=grade_range,
                            competency=item,
                            evidence=[],
                            example='',
                            metadata={
                                'structure_mode': structure_mode,
                                'axis': axis.get('key') or axis.get('name'),
                                'axis_name': axis.get('name'),
                                'division': division.get('key') or division.get('name'),
                                'division_name': division.get('name')
                            }
                        )
                        units.append(unit)
                
                # Subaxes
                for subaxis in axis.get('subaxes', []):
                    # Items directos del subaxis
                    for item in subaxis.get('items', []):
                        unit = self._build_competency_unit(
                            source='standard',
                            subject=subject,
                            grade_range=grade_range,
                            competency=item,
                            evidence=[],
                            example='',
                            metadata={
                                'structure_mode': structure_mode,
                                'axis': axis.get('key') or axis.get('name'),
                                'axis_name': axis.get('name'),
                                'subaxis': subaxis.get('key') or subaxis.get('name'),
                                'subaxis_name': subaxis.get('name')
                            }
                        )
                        units.append(unit)
                    
                    # Processes (naturales 10-11)
                    for process in subaxis.get('processes', []):
                        for item in process.get('items', []):
                            unit = self._build_competency_unit(
                                source='standard',
                                subject=subject,
                                grade_range=grade_range,
                                competency=item,
                                evidence=[],
                                example='',
                                metadata={
                                    'structure_mode': structure_mode,
                                    'axis': axis.get('key') or axis.get('name'),
                                    'axis_name': axis.get('name'),
                                    'subaxis': subaxis.get('key') or subaxis.get('name'),
                                    'subaxis_name': subaxis.get('name'),
                                    'process': process.get('key') or process.get('name'),
                                    'process_name': process.get('name')
                                }
                            )
                            units.append(unit)
        
        return units
    
    def _build_competency_unit(
        self,
        source: str,
        subject: str,
        grade_range: str,
        competency: str,
        evidence: List[str],
        example: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Construye un competency unit con el formato universal
        
        Returns:
            {
              "id": "uuid",
              "type": "competency_unit",
              "source": "dba" | "standard",
              "subject": "matematicas",
              "grade_range": "5",
              "difficulty": 3,
              "content": {
                "competency": "...",
                "evidence": [],
                "example": "",
                "concepts": [],
                "misconceptions": [],
                "metadata": {}
              }
            }
        """
        # Texto completo para análisis
        full_text = ' '.join([
            competency,
            *evidence,
            example
        ])
        
        return {
            'id': str(uuid.uuid4()),
            'type': 'competency_unit',
            'source': source,
            'subject': self._normalize_key(subject),
            'grade_range': str(grade_range),
            'difficulty': self._estimate_difficulty(grade_range, full_text),
            'content': {
                'competency': self._clean_text(competency),
                'evidence': [self._clean_text(e) for e in evidence],
                'example': self._clean_text(example),
                'concepts': self._extract_concepts(full_text),
                'misconceptions': self._generate_misconceptions(full_text),
                'metadata': metadata or {}
            }
        }
    
    def _extract_example_text(self, example_data) -> str:
        """Extrae texto de ejemplo desde diferentes formatos"""
        if isinstance(example_data, str):
            return example_data
        
        if isinstance(example_data, list):
            texts = []
            for item in example_data:
                if isinstance(item, dict):
                    # Formato: {"type": "...", "content": {...}}
                    if 'content' in item:
                        content = item['content']
                        if isinstance(content, dict):
                            texts.append(content.get('description', '') or content.get('text', ''))
                        else:
                            texts.append(str(content))
                    else:
                        texts.append(str(item))
                else:
                    texts.append(str(item))
            return ' '.join(texts)
        
        return ''
    
    def _estimate_difficulty(self, grade_range: str, text: str) -> int:
        """
        Estima nivel de dificultad (1-5) basado en grado y complejidad del texto
        
        1: Grados 1-3 (básico)
        2: Grados 4-5 (intermedio bajo)
        3: Grados 6-7 (intermedio)
        4: Grados 8-9 (intermedio alto)
        5: Grados 10-11 (avanzado)
        """
        if not grade_range:
            return 3
        
        grade_str = str(grade_range).lower()
        
        if any(g in grade_str for g in ['1-3', '1', '2', '3']):
            return 1
        if any(g in grade_str for g in ['4-5', '4', '5']):
            return 2
        if any(g in grade_str for g in ['6-7', '6', '7']):
            return 3
        if any(g in grade_str for g in ['8-9', '8', '9']):
            return 4
        if any(g in grade_str for g in ['10-11', '10', '11']):
            return 5
        
        return 3
    
    def _extract_concepts(self, text: str) -> List[str]:
        """Extrae conceptos relevantes del texto"""
        text_lower = text.lower()
        concepts = []
        
        for concept, keywords in self.concept_keywords.items():
            if concept == "estadistica" and not self._supports_statistics(text):
                continue
            if any(re.search(r'(?<!\w)' + re.escape(keyword) + r'(?:s|es)?(?!\w)', text_lower) for keyword in keywords):
                concepts.append(concept)
        
        # Eliminar duplicados y limitar
        return list(dict.fromkeys(concepts))[:10]
    
    def _generate_misconceptions(self, text: str) -> List[str]:
        """Genera misconceptions comunes basadas en el texto"""
        text_lower = text.lower()
        misconceptions = []
        
        for pattern, misconception in self.misconception_patterns.items():
            if pattern in ("media", "mediana") and not self._supports_statistics(text):
                continue
            if re.search(r'(?<!\w)' + re.escape(pattern) + r'(?:s|es)?(?!\w)', text_lower):
                misconceptions.append(misconception)
        
        # Eliminar duplicados y limitar
        return list(dict.fromkeys(misconceptions))[:3]
    
    def _supports_statistics(self, text: str) -> bool:
        normalized = "".join(c for c in unicodedata.normalize("NFD", text.lower()) if unicodedata.category(c) != "Mn")
        return any(re.search(pattern, normalized) for pattern in self.statistics_support)

    def _clean_text(self, text: str) -> str:
        """Limpia y normaliza texto"""
        if not text:
            return ''
        return re.sub(r'\s+', ' ', str(text)).strip()
    
    def _normalize_key(self, text: str) -> str:
        """Normaliza texto a formato key (snake_case sin acentos)"""
        if not text:
            return ''
        
        # Remover acentos
        text = text.lower()
        replacements = {
            'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
            'ñ': 'n', 'ü': 'u'
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        # Reemplazar espacios y caracteres especiales con _
        text = re.sub(r'[^a-z0-9]+', '_', text)
        text = re.sub(r'_+', '_', text)
        text = text.strip('_')
        
        return text


def normalize_all():
    """
    Normaliza todos los archivos parseados (DBAs y Estándares)
    Genera archivos individuales y consolidado
    """
    normalizer = UniversalNormalizer()
    
    base_path = Path(__file__).parent.parent.parent
    input_path = base_path / 'data' / 'processed' / 'parsed'
    output_path = base_path / 'data' / 'processed' / 'normalized' / 'competency_units'
    
    output_path.mkdir(parents=True, exist_ok=True)
    
    all_units = []
    stats = {'dba': 0, 'standard': 0, 'total': 0}
    
    print("\n" + "=" * 60)
    print("🔄 NORMALIZADOR UNIVERSAL")
    print("=" * 60)
    
    # Procesar todos los archivos JSON en parsed/
    for json_file in input_path.rglob('*.json'):
        relative_path = json_file.relative_to(input_path)
        print(f"\n📄 {relative_path}...", end=' ')
        
        try:
            # Leer archivo parseado
            with open(json_file, 'r', encoding='utf-8') as f:
                parsed = json.load(f)
            
            # Normalizar
            normalized_units = normalizer.normalize_parsed_document(parsed)
            
            # Guardar archivo individual
            output_file = output_path / relative_path
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(normalized_units, f, ensure_ascii=False, indent=2)
            
            # Estadísticas
            all_units.extend(normalized_units)
            source_type = normalized_units[0]['source'] if normalized_units else 'unknown'
            stats[source_type] = stats.get(source_type, 0) + len(normalized_units)
            stats['total'] += len(normalized_units)
            
            print(f"✅ {len(normalized_units)} unidades")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
    
    # Guardar archivo consolidado
    print("\n" + "=" * 60)
    print("💾 Guardando archivo consolidado...")
    
    consolidated_file = output_path / 'all_competency_units.json'
    with open(consolidated_file, 'w', encoding='utf-8') as f:
        json.dump(all_units, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {stats['total']} competency units totales")
    print(f"   DBAs: {stats.get('dba', 0)}")
    print(f"   Estándares: {stats.get('standard', 0)}")
    print(f"\n📂 Guardado en: {consolidated_file}")
    
    print("\n" + "=" * 60)
    print("✨ Normalización completada!")
    print("=" * 60)


if __name__ == '__main__':
    normalize_all()
