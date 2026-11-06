"""
KUNEO STANDARDS PARSER
Parser de producción para Estándares Básicos de Competencias
Lee archivos TXT limpios y genera JSONs estructurados.

Input: data/clean/standards/{subject}/standard_grades/{grade_range}.txt
Output: data/processed/parsed/standards/{subject}/{grade_range}.json
"""

import re
import json
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional


class StandardsParser:
    """Parser para documentos de Estándares Básicos de Competencias"""
    
    def __init__(self):
        self.subjects = {
            'matematicas': 'mathematics',
            'ciencias_naturales': 'natural_sciences',
            'ciencias_sociales': 'social_studies', 
            'lenguaje': 'language',
            'ingles': 'english'
        }
    
    def parse_file(self, file_path: Path) -> Dict[str, Any]:
        """
        Parse un archivo de estándares completo
        
        Args:
            file_path: Ruta al archivo TXT limpio
            
        Returns:
            Diccionario con estructura de estándares parseada
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extraer metadata
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        
        subject = self._extract_metadata(lines, 'SUBJECT')
        grade_range = self._extract_metadata(lines, 'GRADE_RANGE')
        structure_mode = self._extract_metadata(lines, 'STRUCTURE')
        
        # Detectar estructura si no está explícita
        if not structure_mode:
            structure_mode = self._detect_structure(lines, subject)
        
        # Parse según estructura
        result = {
            "subject": self.subjects.get(subject, subject),
            "grade_range": grade_range,
            "source": "standard",
            "structure_mode": structure_mode,
            "axes": []
        }
        
        # Remover líneas de metadata
        content_lines = [l for l in lines if not any(
            l.startswith(prefix) for prefix in ['SUBJECT:', 'GRADE_RANGE:', 'STRUCTURE:']
        )]
        
        # Parse según estructura
        if structure_mode == 'math':
            result['axes'] = self._parse_math_structure(content_lines)
        elif structure_mode == 'language':
            result['axes'] = self._parse_language_structure(content_lines)
        elif structure_mode == 'science':
            result['axes'] = self._parse_science_structure(content_lines, subject, grade_range)
        elif structure_mode == 'english':
            result['axes'] = self._parse_english_structure(content_lines)
        
        return result
    
    def _extract_metadata(self, lines: List[str], key: str) -> str:
        """Extrae valor de metadata"""
        for line in lines:
            if line.startswith(f"{key}:"):
                return line.replace(f"{key}:", "").strip()
        return ""
    
    def _detect_structure(self, lines: List[str], subject: str) -> str:
        """Detecta estructura si no está explícita"""
        text = " ".join(lines).upper()
        
        if 'PENSAMIENTO:' in text:
            return 'math'
        elif 'FACTOR:' in text:
            return 'language'
        elif 'AXIS:' in text or 'EJE:' in text:
            return 'science'
        elif 'HABILIDAD:' in text:
            return 'english'
        
        # Fallback por materia
        if 'matematicas' in subject:
            return 'math'
        elif 'lenguaje' in subject:
            return 'language'
        elif 'ciencias' in subject:
            return 'science'
        elif 'ingles' in subject:
            return 'english'
        
        return 'default'
    
    def _parse_math_structure(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        Parse estructura de matemáticas
        PENSAMIENTO: nombre
        - item 1
        - item 2
        """
        axes = []
        current_axis = None
        
        for line in lines:
            if line.startswith('PENSAMIENTO:'):
                # Crear nuevo eje
                name = line.replace('PENSAMIENTO:', '').strip()
                current_axis = {
                    "key": self._normalize_key(name),
                    "name": name,
                    "type": "math_thought",
                    "items": []
                }
                axes.append(current_axis)
                
            elif line.startswith('-') and current_axis:
                # Agregar item al eje actual
                item = self._clean_bullet(line)
                if item:
                    current_axis['items'].append(item)
        
        return axes
    
    def _parse_language_structure(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        Parse estructura de lenguaje
        FACTOR: nombre
        STANDARD: descripción
        - subproceso 1
        - subproceso 2
        """
        axes = []
        current_axis = None
        current_standard = None
        
        for line in lines:
            if line.startswith('FACTOR:'):
                # Crear nuevo factor
                name = line.replace('FACTOR:', '').strip()
                current_axis = {
                    "key": self._normalize_key(name),
                    "name": name,
                    "type": "language_factor",
                    "standards": []
                }
                axes.append(current_axis)
                current_standard = None
                
            elif line.startswith('STANDARD:') and current_axis:
                # Crear nuevo standard dentro del factor
                statement = line.replace('STANDARD:', '').strip()
                current_standard = {
                    "statement": statement,
                    "subprocesses": []
                }
                current_axis['standards'].append(current_standard)
                
            elif line.startswith('-') and current_standard:
                # Agregar subproceso al standard actual
                subprocess = self._clean_bullet(line)
                if subprocess:
                    current_standard['subprocesses'].append(subprocess)
        
        return axes
    
    def _parse_science_structure(
        self, 
        lines: List[str], 
        subject: str, 
        grade_range: str
    ) -> List[Dict[str, Any]]:
        """
        Parse estructura de ciencias (naturales y sociales)
        
        Estructura normal:
        AXIS: nombre
        SUBAXIS: nombre
        - item 1
        - item 2
        
        Especial para ciencias naturales 10-11:
        AXIS: nombre
        SUBAXIS: nombre
        PROCESS: nombre
        - item 1
        - item 2
        
        Especial para ciencias sociales 10-11:
        AXIS: me_aproximo_como_cientifico_social
        - item general
        Formulo proyectos:
        - item específico
        Desarrollo las investigaciones:
        - item específico
        Presento los resultados:
        - item específico
        """
        axes = []
        current_axis = None
        current_subaxis = None
        current_process = None
        current_division = None  # Para divisiones especiales de sociales 10-11
        
        is_naturales_10_11 = (subject == 'ciencias_naturales' and grade_range == '10-11')
        is_sociales_10_11 = (subject == 'ciencias_sociales' and grade_range == '10-11')
        
        for line in lines:
            # Detectar AXIS/EJE
            if line.startswith('AXIS:') or line.startswith('EJE:'):
                name = line.replace('AXIS:', '').replace('EJE:', '').strip()
                current_axis = {
                    "key": self._normalize_key(name),
                    "name": name,
                    "type": "science_axis",
                    "subaxes": []
                }
                axes.append(current_axis)
                current_subaxis = None
                current_process = None
                current_division = None
                
            # Detectar SUBAXIS/SUBEJE
            elif (line.startswith('SUBAXIS:') or line.startswith('SUBEJE:')) and current_axis:
                name = line.replace('SUBAXIS:', '').replace('SUBEJE:', '').strip()
                current_subaxis = {
                    "key": self._normalize_key(name),
                    "name": name,
                    "items": []
                }
                
                # Si es naturales 10-11, puede tener procesos
                if is_naturales_10_11:
                    current_subaxis['processes'] = []
                
                current_axis['subaxes'].append(current_subaxis)
                current_process = None
                
            # Detectar PROCESS (solo para naturales 10-11)
            elif line.startswith('PROCESS:') and current_subaxis and is_naturales_10_11:
                name = line.replace('PROCESS:', '').strip()
                current_process = {
                    "key": self._normalize_key(name),
                    "name": name,
                    "items": []
                }
                current_subaxis['processes'].append(current_process)
            
            # Detectar divisiones especiales de sociales 10-11
            elif is_sociales_10_11 and current_axis and ':' in line and not line.startswith('-'):
                # Líneas como "Formulo proyectos:", "Desarrollo las investigaciones:", etc.
                if any(phrase in line for phrase in ['Formulo proyectos:', 'Desarrollo las investigaciones:', 'Presento los resultados:']):
                    division_name = line.replace(':', '').strip()
                    current_division = {
                        "key": self._normalize_key(division_name),
                        "name": division_name,
                        "items": []
                    }
                    
                    # Agregar división al axis (no a subaxis)
                    if 'divisions' not in current_axis:
                        current_axis['divisions'] = []
                    current_axis['divisions'].append(current_division)
            
            # Detectar items (bullets)
            elif line.startswith('-'):
                item = self._clean_bullet(line)
                if not item:
                    continue
                
                # Determinar dónde agregar el item
                if current_process:
                    # Agregar a process (naturales 10-11)
                    current_process['items'].append(item)
                elif current_division:
                    # Agregar a división especial (sociales 10-11)
                    current_division['items'].append(item)
                elif current_subaxis:
                    # Agregar a subaxis
                    current_subaxis['items'].append(item)
                elif current_axis:
                    # Agregar directamente a axis (para cuando no hay subaxis)
                    if 'items' not in current_axis:
                        current_axis['items'] = []
                    current_axis['items'].append(item)
        
        return axes
    
    def _parse_english_structure(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        Parse estructura de inglés
        HABILIDAD: nombre
        - item 1
        - item 2
        """
        axes = []
        current_axis = None
        
        for line in lines:
            if line.startswith('HABILIDAD:'):
                # Crear nueva habilidad
                name = line.replace('HABILIDAD:', '').strip()
                current_axis = {
                    "key": self._normalize_key(name),
                    "name": name,
                    "type": "english_skill",
                    "items": []
                }
                axes.append(current_axis)
                
            elif line.startswith('-') and current_axis:
                # Agregar item a la habilidad actual
                item = self._clean_bullet(line)
                if item:
                    current_axis['items'].append(item)
        
        return axes
    
    def _clean_bullet(self, line: str) -> str:
        """Limpia un bullet point"""
        cleaned = re.sub(r'^-\s*', '', line).strip()
        return cleaned
    
    def _normalize_key(self, text: str) -> str:
        """Normaliza texto a formato de clave"""
        # Remover acentos
        text = text.lower()
        text = re.sub(r'[áàäâ]', 'a', text)
        text = re.sub(r'[éèëê]', 'e', text)
        text = re.sub(r'[íìïî]', 'i', text)
        text = re.sub(r'[óòöô]', 'o', text)
        text = re.sub(r'[úùüû]', 'u', text)
        text = re.sub(r'[ñ]', 'n', text)
        
        # Reemplazar caracteres no alfanuméricos con guion bajo
        text = re.sub(r'[^a-z0-9]+', '_', text)
        
        # Remover guiones iniciales/finales
        text = re.sub(r'^_|_$', '', text)
        
        return text


def process_all_standards():
    """
    Procesa todos los archivos de estándares de clean/ y genera JSONs en processed/
    """
    parser = StandardsParser()
    
    # Rutas base
    base_path = Path(__file__).parent.parent.parent
    clean_path = base_path / 'data' / 'clean' / 'standards'
    output_path = base_path / 'data' / 'processed' / 'parsed' / 'standards'
    
    # Procesar cada materia
    subjects = ['matematicas', 'ciencias', 'lenguaje', 'sociales', 'ingles']
    
    total_processed = 0
    
    for subject in subjects:
        subject_path = clean_path / subject / 'standard_grades'
        
        if not subject_path.exists():
            print(f"⚠️  Carpeta no encontrada: {subject_path}")
            continue
        
        print(f"\n📚 Procesando {subject}...")
        
        # Procesar cada archivo de grupo de grados
        for txt_file in sorted(subject_path.glob('*.txt')):
            grade_range = txt_file.stem  # nombre sin extensión
            
            print(f"  → Grados {grade_range}...", end=' ')
            
            try:
                # Parsear archivo
                parsed_data = parser.parse_file(txt_file)
                
                # Crear directorio de salida si no existe
                output_subject_path = output_path / subject
                output_subject_path.mkdir(parents=True, exist_ok=True)
                
                # Guardar JSON
                output_file = output_subject_path / f"{grade_range}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(parsed_data, f, ensure_ascii=False, indent=2)
                
                axes_count = len(parsed_data.get('axes', []))
                print(f"✅ {axes_count} ejes")
                total_processed += 1
                
            except Exception as e:
                print(f"❌ Error: {e}")
    
    print(f"\n✨ Proceso completado! {total_processed} archivos procesados")


if __name__ == '__main__':
    process_all_standards()
