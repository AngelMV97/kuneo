"""
KUNEO DBA PARSER
Parser de producción para Derechos Básicos de Aprendizaje (DBA)
Lee archivos TXT limpios y genera JSONs estructurados.

Input: data/clean/dba/{subject}/dba_grades/{grade}.txt
Output: data/processed/parsed/dba/{subject}/{grade}.json
"""

import re
import json
import uuid
from pathlib import Path
from typing import List, Dict, Any


class DBAParser:
    """Parser para documentos DBA estructurados"""
    
    def __init__(self):
        self.subjects = {
            'matematicas': 'mathematics',
            'ciencias': 'natural_sciences', 
            'lenguaje': 'language',
            'sociales': 'social_studies',
            'ingles': 'english'
        }
    
    def parse_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """
        Parse un archivo DBA completo y retorna lista de competency units
        
        Args:
            file_path: Ruta al archivo TXT limpio
            
        Returns:
            Lista de diccionarios con competency units
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Dividir en bloques DBA individuales
        dba_blocks = self._split_into_dbas(content)
        
        # Parsear cada bloque
        competency_units = []
        for block in dba_blocks:
            unit = self._parse_dba_block(block)
            if unit:
                competency_units.append(unit)
        
        return competency_units
    
    def _split_into_dbas(self, content: str) -> List[str]:
        """
        Divide el contenido en bloques DBA individuales
        Usa el patrón 'DBA: N' como delimitador
        """
        # Split por patrón "DBA: número"
        pattern = r'\n(?=DBA: \d+)'
        blocks = re.split(pattern, content)
        
        # Limpiar y filtrar bloques vacíos
        blocks = [block.strip() for block in blocks if block.strip()]
        
        return blocks
    
    def _parse_dba_block(self, block: str) -> Dict[str, Any]:
        """
        Parse un bloque DBA individual
        
        Estructura esperada:
        DBA: N
        SUBJECT: xxx
        GRADE: N
        ENUNCIADO: ...
        EVIDENCES: / SKILL: (para inglés)
        - item 1
        - item 2
        EXAMPLE:
        [TIPO: xxx]
        contenido
        """
        try:
            # Extraer metadatos
            dba_num = self._extract_field(block, r'DBA:\s*(\d+)')
            subject = self._extract_field(block, r'SUBJECT:\s*(\w+)')
            grade = self._extract_field(block, r'GRADE:\s*([\d\-]+)')
            
            # Extraer enunciado (competencia principal)
            enunciado = self._extract_enunciado(block)
            
            # Determinar si es inglés (usa SKILL) o no (usa EVIDENCES)
            is_english = subject == 'ingles'
            
            if is_english:
                evidence = self._extract_skills(block)
            else:
                evidence = self._extract_evidences(block)
            
            # Extraer ejemplos
            examples = self._extract_examples(block)
            
            # Enriquecimiento cognitivo
            concepts = self._extract_concepts(enunciado, subject)
            misconceptions = self._generate_misconceptions(enunciado, subject)
            
            # Construir competency unit
            unit = {
                "id": str(uuid.uuid4()),
                "type": "competency_unit",
                "source": "dba",
                "dba_number": int(dba_num),
                "subject": self.subjects.get(subject, subject),
                "grade_range": grade,
                
                "content": {
                    "competency": enunciado,
                    "evidence": evidence,
                    "examples": examples,
                    "concepts": concepts,
                    "misconceptions": misconceptions
                },
                
                "metadata": {
                    "is_english": is_english,
                    "example_count": len(examples),
                    "evidence_count": len(evidence)
                }
            }
            
            return unit
            
        except Exception as e:
            print(f"Error parsing DBA block: {e}")
            print(f"Block preview: {block[:200]}...")
            return None
    
    def _extract_field(self, text: str, pattern: str) -> str:
        """Extrae un campo usando regex"""
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
        return ""
    
    def _extract_enunciado(self, block: str) -> str:
        """
        Extrae el enunciado (competencia principal)
        Está entre ENUNCIADO: y EVIDENCES:/SKILL:
        """
        # Buscar desde ENUNCIADO: hasta EVIDENCES: o SKILL:
        pattern = r'ENUNCIADO:\s*(.*?)\s*(?:EVIDENCES:|SKILL:)'
        match = re.search(pattern, block, re.DOTALL)
        
        if match:
            enunciado = match.group(1).strip()
            # Limpiar espacios múltiples
            enunciado = re.sub(r'\s+', ' ', enunciado)
            return enunciado
        
        return ""
    
    def _extract_evidences(self, block: str) -> List[str]:
        """
        Extrae evidencias de aprendizaje (para materias no-inglés)
        Son bullets que empiezan con -
        """
        # Buscar sección EVIDENCES hasta EXAMPLE
        pattern = r'EVIDENCES:\s*(.*?)\s*EXAMPLE:'
        match = re.search(pattern, block, re.DOTALL)
        
        if not match:
            return []
        
        evidence_section = match.group(1)
        
        # Extraer bullets (líneas que empiezan con -)
        evidences = []
        for line in evidence_section.split('\n'):
            line = line.strip()
            if line.startswith('-'):
                # Remover el guion inicial
                evidence = re.sub(r'^-\s*', '', line)
                if len(evidence) > 10:  # Filtrar líneas muy cortas
                    evidences.append(evidence)
        
        return evidences
    
    def _extract_skills(self, block: str) -> List[str]:
        """
        Extrae habilidades (SKILL) para inglés
        Son bullets que empiezan con -
        """
        # Buscar sección SKILL hasta EXAMPLE
        pattern = r'SKILL:\s*(.*?)\s*EXAMPLE:'
        match = re.search(pattern, block, re.DOTALL)
        
        if not match:
            return []
        
        skill_section = match.group(1)
        
        # Extraer bullets (líneas que empiezan con -)
        skills = []
        for line in skill_section.split('\n'):
            line = line.strip()
            if line.startswith('-'):
                skill = re.sub(r'^-\s*', '', line)
                if skill:
                    skills.append(skill)
        
        return skills
    
    def _extract_examples(self, block: str) -> List[Dict[str, Any]]:
        """
        Extrae la sección EXAMPLE y sus múltiples tipos de contenido
        
        Tipos: texto, imagen, pregunta, lista, conversacion, monologo, tabla
        """
        # Buscar desde EXAMPLE: hasta el final o siguiente DBA
        pattern = r'EXAMPLE:\s*(.*?)(?:\n\nDBA:|$)'
        match = re.search(pattern, block, re.DOTALL)
        
        if not match:
            return []
        
        example_section = match.group(1).strip()
        
        # Dividir por [TIPO: xxx]
        examples = []
        tipo_pattern = r'\[TIPO:\s*(\w+)\]'
        
        # Encontrar todos los tipos y sus posiciones
        tipo_matches = list(re.finditer(tipo_pattern, example_section))
        
        for i, tipo_match in enumerate(tipo_matches):
            tipo = tipo_match.group(1).lower()
            start = tipo_match.end()
            
            # El contenido va desde el final de [TIPO:] hasta el próximo [TIPO:] o fin
            if i + 1 < len(tipo_matches):
                end = tipo_matches[i + 1].start()
            else:
                end = len(example_section)
            
            content = example_section[start:end].strip()
            
            # Parsear según tipo
            parsed_content = self._parse_example_content(tipo, content)
            
            examples.append({
                "type": tipo,
                "content": parsed_content
            })
        
        return examples
    
    def _parse_example_content(self, tipo: str, content: str) -> Any:
        """
        Parse contenido según su tipo
        """
        if tipo == 'texto':
            return self._clean_text(content)
        
        elif tipo == 'imagen':
            # Extraer descripcion:
            desc_pattern = r'descripcion:\s*(.*)'
            match = re.search(desc_pattern, content, re.DOTALL)
            if match:
                return {
                    "description": self._clean_text(match.group(1))
                }
            return {"description": self._clean_text(content)}
        
        elif tipo == 'pregunta':
            # Extraer bullets (preguntas múltiples)
            questions = []
            for line in content.split('\n'):
                line = line.strip()
                if line.startswith('-'):
                    question = re.sub(r'^-\s*', '', line)
                    if question:
                        questions.append(question)
                elif line and not questions:
                    # Si no hay bullets, toda la línea es una pregunta
                    questions.append(line)
            
            return questions if questions else [self._clean_text(content)]
        
        elif tipo == 'lista':
            # Extraer items con a), b), c) o bullets
            items = []
            
            # Intentar con letras a), b), c)
            letter_pattern = r'^[a-z]\)\s*(.+)'
            for line in content.split('\n'):
                line = line.strip()
                match = re.match(letter_pattern, line)
                if match:
                    items.append(match.group(1))
                elif line.startswith('-'):
                    item = re.sub(r'^-\s*', '', line)
                    if item:
                        items.append(item)
            
            return items if items else [self._clean_text(content)]
        
        elif tipo == 'conversacion':
            # Extraer diálogos A:, B:, C:
            lines = []
            for line in content.split('\n'):
                line = line.strip()
                # Buscar patrón A:, B:, etc.
                if re.match(r'^[A-Z]:\s*.+', line):
                    lines.append(line)
            
            return lines if lines else [self._clean_text(content)]
        
        elif tipo == 'monologo':
            return self._clean_text(content)
        
        elif tipo == 'tabla':
            return {"description": self._clean_text(content)}
        
        else:
            # Tipo desconocido, retornar texto limpio
            return self._clean_text(content)
    
    def _clean_text(self, text: str) -> str:
        """Limpia texto: múltiples espacios, líneas, etc."""
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def _extract_concepts(self, text: str, subject: str) -> List[str]:
        """
        Extrae conceptos clave del enunciado
        Basado en keywords por materia
        """
        concepts = []
        text_lower = text.lower()
        
        # Keywords por materia
        keywords_map = {
            'matematicas': [
                ('fraccion', 'fracciones'), ('decimal', 'decimales'),
                ('numero', 'numeros'), ('operacion', 'operaciones'),
                ('suma', 'sumas'), ('resta', 'restas'), ('multiplicacion',),
                ('division',), ('ecuacion', 'ecuaciones'), ('geometria',),
                ('medida', 'medidas'), ('angulo', 'angulos'), ('area', 'areas'),
                ('volumen', 'volumenes'), ('perimetro',), ('patron', 'patrones'),
                ('razon', 'razones'), ('proporcion', 'proporciones'),
                ('potencia', 'potencias'), ('raiz',)
            ],
            'ciencias': [
                ('fuerza', 'fuerzas'), ('energia',), ('movimiento',),
                ('materia',), ('mezcla', 'mezclas'), ('celula', 'celulas'),
                ('organismo', 'organismos'), ('ecosistema', 'ecosistemas'),
                ('planeta', 'planetas'), ('tierra',), ('luna',), ('sol',),
                ('luz',), ('sonido',), ('calor',), ('temperatura',),
                ('electricidad',), ('circuito', 'circuitos'), ('maquina', 'maquinas'),
                ('palanca', 'palancas'), ('friccion',), ('cadena alimenticia',)
            ],
            'lenguaje': [
                ('texto', 'textos'), ('lectura',), ('escritura',),
                ('oracion', 'oraciones'), ('parrafo', 'parrafos'),
                ('cuento', 'cuentos'), ('poema', 'poemas'), ('narrador',),
                ('personaje', 'personajes'), ('verbo', 'verbos'),
                ('sustantivo', 'sustantivos'), ('adjetivo', 'adjetivos'),
                ('comunicacion',), ('discurso',), ('entonacion',),
                ('figura literaria',), ('metafora',), ('comparacion',)
            ],
            'sociales': [
                ('historia',), ('geografia',), ('territorio',),
                ('comunidad', 'comunidades'), ('cultura', 'culturas'),
                ('sociedad', 'sociedades'), ('economia',), ('politica',),
                ('democracia',), ('derecho', 'derechos'), ('constitucion',),
                ('gobierno',), ('ciudadano', 'ciudadanos'), ('pais', 'paises'),
                ('region', 'regiones'), ('recurso', 'recursos')
            ],
            'ingles': [
                ('verb', 'verbs'), ('noun', 'nouns'), ('adjective', 'adjectives'),
                ('sentence', 'sentences'), ('question', 'questions'),
                ('answer', 'answers'), ('conversation',), ('listening',),
                ('reading',), ('writing',), ('speaking',), ('grammar',),
                ('vocabulary',), ('tense', 'tenses')
            ]
        }
        
        subject_keywords = keywords_map.get(subject, [])
        
        for keyword_group in subject_keywords:
            for keyword in keyword_group:
                if keyword in text_lower:
                    # Agregar la forma singular (primera del grupo)
                    concept = keyword_group[0]
                    if concept not in concepts:
                        concepts.append(concept)
                    break
        
        return concepts
    
    def _generate_misconceptions(self, text: str, subject: str) -> List[str]:
        """
        Genera misconceptions comunes basadas en el contenido
        Estos son errores conceptuales típicos que estudiantes tienen
        """
        misconceptions = []
        text_lower = text.lower()
        
        # Misconceptions por concepto
        misconceptions_map = {
            'fraccion': "Las fracciones solo representan partes de un círculo",
            'decimal': "Los decimales son números diferentes a las fracciones",
            'multiplicacion': "Multiplicar siempre hace el número más grande",
            'division': "Dividir siempre hace el número más pequeño",
            'fuerza': "Solo las personas pueden aplicar fuerzas",
            'friccion': "La fricción siempre detiene el movimiento completamente",
            'mezcla': "Todas las mezclas se pueden separar fácilmente",
            'celula': "Todas las células son iguales",
            'energia': "La energía se crea o se destruye",
            'luz': "La luz viaja instantáneamente",
            'tierra': "La Tierra está inmóvil en el espacio",
            'luna': "La Luna produce su propia luz",
            'verbo': "Todos los verbos indican acciones físicas",
            'sustantivo': "Solo las personas y cosas concretas son sustantivos",
            'texto': "Solo los libros contienen textos",
            'historia': "La historia solo trata sobre el pasado lejano"
        }
        
        for keyword, misconception in misconceptions_map.items():
            if keyword in text_lower:
                misconceptions.append(misconception)
        
        # Limitar a máximo 3 misconceptions
        return misconceptions[:3]


def process_all_dbas():
    """
    Procesa todos los archivos DBA de clean/ y genera JSONs en processed/
    """
    parser = DBAParser()
    
    # Rutas base
    base_path = Path(__file__).parent.parent.parent
    clean_path = base_path / 'data' / 'clean' / 'dba'
    output_path = base_path / 'data' / 'processed' / 'parsed' / 'dba'
    
    # Procesar cada materia
    subjects = ['matematicas', 'ciencias', 'lenguaje', 'sociales', 'ingles']
    
    for subject in subjects:
        subject_path = clean_path / subject / 'dba_grades'
        
        if not subject_path.exists():
            print(f"⚠️  Carpeta no encontrada: {subject_path}")
            continue
        
        print(f"\n📚 Procesando {subject}...")
        
        # Procesar cada archivo de grado
        for txt_file in sorted(subject_path.glob('*.txt')):
            grade = txt_file.stem  # nombre sin extensión
            
            print(f"  → Grado {grade}...", end=' ')
            
            try:
                # Parsear archivo
                competency_units = parser.parse_file(txt_file)
                
                # Crear directorio de salida si no existe
                output_subject_path = output_path / subject
                output_subject_path.mkdir(parents=True, exist_ok=True)
                
                # Guardar JSON
                output_file = output_subject_path / f"{grade}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(competency_units, f, ensure_ascii=False, indent=2)
                
                print(f"✅ {len(competency_units)} DBAs")
                
            except Exception as e:
                print(f"❌ Error: {e}")
    
    print("\n✨ Proceso completado!")


if __name__ == '__main__':
    process_all_dbas()
