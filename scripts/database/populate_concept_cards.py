"""
KUNEO CONCEPT CARDS POPULATION SYSTEM
=====================================
Extrae conceptos de múltiples fuentes y genera tarjetas conceptuales
pedagógicamente estructuradas para el sistema de intervención de Tuko.

FUENTES DE DATOS:
1. modules.core_concept (concepto central del módulo)
2. modules.title + learning_objective (contexto pedagógico)
3. modules.content.error_map (misconceptions comunes)
4. modules.content.hints (hints progresivos)
5. modules.content.guided_exercises (ejemplos prácticos)
6. module_taxonomy_link + curriculum_taxonomy.microtopics (conexión curricular)
7. competency_units.statement + evidences (evidencias de aprendizaje)

ESTRUCTURA DE TARJETAS:
- card_type: basic | corrective | hint | reflective
- one_line_definition: definición ultra concisa
- core_insight: la idea clave
- example: ejemplo práctico (JSONB)
- common_misconception: error frecuente
- hint_prompt: hint progresivo
- visual_template_key: referencia a visual
- related_concepts: array de concept_keys relacionados
- source_module_ids: módulos de origen
- taxonomy_ids: taxonomías relacionadas

REGLA: 1 idea + 1 ejemplo + 1 visual sugerido
"""

import json
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import defaultdict
import re


class ConceptCardGenerator:
    def __init__(self):
        load_dotenv(Path(__file__).parent.parent.parent / "server" / ".env")
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.client: Client = create_client(supabase_url, supabase_key)
        
        # Mapeo de subjects a español (para enum de Supabase)
        self.SUBJECT_MAPPER = {
            'mathematics': 'matematicas',
            'natural_sciences': 'ciencias',
            'social_studies': 'sociales',
            'language': 'lenguaje',
            'english': 'ingles'
        }
        
        # Mapeo de conceptos a tipos de visuales sugeridos
        self.VISUAL_SUGGESTIONS = {
            # Matemáticas
            'fracciones': 'fraction_part_whole',
            'decimales': 'number_line_decimal',
            'ecuaciones': 'equation_balance',
            'proporcionalidad': 'proportional_relationship',
            'funciones': 'function_graph',
            'geometria': 'geometric_shapes',
            'angulos': 'angle_measurement',
            'area_perimetro': 'area_comparison',
            'probabilidad': 'probability_diagram',
            'estadistica': 'data_visualization',
            
            # Ciencias Naturales
            'celula': 'cell_diagram',
            'fotosintesis': 'photosynthesis_cycle',
            'ecosistema': 'ecosystem_web',
            'cadena_alimenticia': 'food_chain',
            'ciclo_agua': 'water_cycle',
            'energia': 'energy_transformation',
            'fuerza_movimiento': 'force_diagram',
            'sistema_respiratorio': 'body_system_diagram',
            'materia': 'matter_states',
            
            # Ciencias Sociales
            'mapas': 'map_visualization',
            'linea_tiempo': 'timeline',
            'democracia': 'concept_map',
            'constitucion': 'hierarchical_diagram',
            'economia': 'flow_diagram',
            'geografia': 'map_visualization',
            'historia': 'timeline',
            
            # Lenguaje
            'comprension_lectora': 'reading_strategy',
            'texto_narrativo': 'story_structure',
            'texto_argumentativo': 'argument_structure',
            'ortografia': 'rule_visualization',
            
            # Inglés
            'present_simple': 'grammar_table',
            'past_simple': 'grammar_table',
            'vocabulary': 'concept_map',
            'reading': 'reading_strategy'
        }
    
    def load_modules_from_json(self):
        """Carga todos los módulos desde all_modules.json"""
        json_path = Path(__file__).parent.parent.parent / "data" / "processed" / "modules" / "all_modules.json"
        
        print(f"📂 Cargando módulos desde: {json_path}")
        
        with open(json_path, 'r', encoding='utf-8') as f:
            modules = json.load(f)
        
        print(f"✅ {len(modules)} módulos cargados\n")
        return modules
    
    def load_taxonomy_links(self):
        """Carga todos los links módulo-taxonomía"""
        print("📂 Cargando links módulo-taxonomía...")
        all_links = []
        page_size = 1000
        page = 0
        
        while True:
            start = page * page_size
            end = start + page_size - 1
            
            result = self.client.schema("kuneo").table("module_taxonomy_link").select(
                "module_id, taxonomy_id"
            ).range(start, end).execute()
            
            if not result.data:
                break
            
            all_links.extend(result.data)
            page += 1
            
            if len(result.data) < page_size:
                break
        
        print(f"✅ {len(all_links)} links cargados\n")
        return all_links
    
    def load_taxonomies(self):
        """Carga todas las taxonomías curriculares"""
        print("📂 Cargando taxonomías curriculares...")
        all_taxonomies = []
        page_size = 1000
        page = 0
        
        while True:
            start = page * page_size
            end = start + page_size - 1
            
            result = self.client.schema("kuneo").table("curriculum_taxonomy").select(
                "id, subject, grade_range, discipline, thematic, subthematic, microtopics"
            ).range(start, end).execute()
            
            if not result.data:
                break
            
            all_taxonomies.extend(result.data)
            page += 1
            
            if len(result.data) < page_size:
                break
        
        print(f"✅ {len(all_taxonomies)} taxonomías cargadas\n")
        return {t['id']: t for t in all_taxonomies}
    
    def normalize_concept_key(self, concept):
        """Normaliza un concepto a concept_key estándar"""
        if not concept:
            return None
        
        # Convertir a minúsculas y reemplazar espacios por guiones bajos
        key = concept.lower().strip()
        key = re.sub(r'[áàäâ]', 'a', key)
        key = re.sub(r'[éèëê]', 'e', key)
        key = re.sub(r'[íìïî]', 'i', key)
        key = re.sub(r'[óòöô]', 'o', key)
        key = re.sub(r'[úùüû]', 'u', key)
        key = re.sub(r'[ñ]', 'n', key)
        key = re.sub(r'[^a-z0-9_]', '_', key)
        key = re.sub(r'_{2,}', '_', key)
        key = key.strip('_')
        
        return key if key else None
    
    def extract_misconception(self, error_map):
        """Extrae misconception más relevante del error_map"""
        if not error_map or not isinstance(error_map, dict):
            return None
        
        # Buscar error más común o primero disponible
        for error_key, error_data in error_map.items():
            if isinstance(error_data, dict) and 'description' in error_data:
                return error_data['description']
        
        return None
    
    def extract_hint(self, hints):
        """Extrae primer hint útil (sin revelar respuesta)"""
        if not hints or not isinstance(hints, list) or len(hints) == 0:
            return None
        
        # Tomar el primer hint (generalmente el más general)
        return hints[0] if hints[0] else None
    
    def extract_example(self, guided_exercises):
        """Extrae ejemplo práctico de ejercicios guiados"""
        if not guided_exercises or not isinstance(guided_exercises, list) or len(guided_exercises) == 0:
            return None
        
        # Tomar primer ejercicio y estructurarlo
        first_exercise = guided_exercises[0]
        
        if isinstance(first_exercise, dict):
            return {
                "context": first_exercise.get("context", ""),
                "problem": first_exercise.get("question", first_exercise.get("problem", "")),
                "solution": first_exercise.get("solution", ""),
                "visual_ref": first_exercise.get("visual", "")
            }
        
        return None
    
    def suggest_visual(self, concept_key, subject):
        """Sugiere visual_template_key basado en el concepto y asignatura"""
        # Buscar match exacto
        if concept_key in self.VISUAL_SUGGESTIONS:
            return self.VISUAL_SUGGESTIONS[concept_key]
        
        # Buscar match parcial
        for key_pattern, visual in self.VISUAL_SUGGESTIONS.items():
            if key_pattern in concept_key or concept_key in key_pattern:
                return visual
        
        # Fallback por asignatura
        if subject == 'mathematics':
            return 'graph'
        elif subject == 'natural_sciences':
            return 'diagram'
        elif subject == 'social_studies':
            return 'concept_map'
        elif subject in ['language', 'english']:
            return 'reading_strategy'
        
        return 'concept_map'  # Fallback genérico
    
    def determine_card_type(self, concept_key, has_misconception, has_hint):
        """Determina el tipo de tarjeta a generar"""
        # Por ahora generamos tarjetas básicas
        # Luego podríamos crear múltiples tarjetas por concepto
        # (básica, correctiva, hint, reflexiva)
        return 'basic'
    
    def generate_one_line_definition(self, module_title, learning_objective, concept_name):
        """Genera definición ultra concisa (1 oración)"""
        # Por ahora usar el learning_objective si es conciso
        # En futuro: usar LLM para generar definición perfecta
        if learning_objective and len(learning_objective) < 150:
            return learning_objective
        
        return f"{concept_name}: {module_title}"
    
    def generate_core_insight(self, concept_name, subject):
        """Genera la idea clave del concepto"""
        # Insights genéricos por tipo de concepto
        # En futuro: usar LLM para generar insights específicos
        
        insights = {
            'fracciones': "La clave es que las partes deben ser iguales",
            'proporcionalidad': "Si una cantidad aumenta, la otra cambia de manera constante",
            'ecuaciones': "Lo que haces a un lado, debes hacerlo al otro",
            'area_perimetro': "El área mide el espacio dentro, el perímetro mide el borde",
            'celula': "La célula es la unidad básica de vida",
            'fotosintesis': "Las plantas convierten luz en energía química",
            'ecosistema': "Todo está conectado en la naturaleza",
            'democracia': "El poder viene del pueblo",
            'comprension_lectora': "Entender es conectar lo nuevo con lo que ya sabes"
        }
        
        concept_key = self.normalize_concept_key(concept_name)
        return insights.get(concept_key, f"Comprender {concept_name} es fundamental")
    
    def build_concept_cards(self, modules, taxonomy_links, taxonomies):
        """Construye tarjetas conceptuales desde todas las fuentes"""
        print("=" * 80)
        print("🧠 GENERACIÓN DE TARJETAS CONCEPTUALES")
        print("=" * 80 + "\n")
        
        # Diccionario: concept_key -> concept_data
        concepts = defaultdict(lambda: {
            'concept_name': '',
            'subject': None,
            'grade_ranges': set(),
            'difficulties': set(),
            'titles': [],
            'learning_objectives': [],
            'misconceptions': [],
            'hints': [],
            'examples': [],
            'source_module_ids': [],
            'taxonomy_ids': set(),
            'related_concepts': set()
        })
        
        # 1. Extraer de módulos
        print("📘 Extrayendo conceptos desde módulos...")
        for module in modules:
            core_concept = module.get('core_concept')
            if not core_concept:
                continue
            
            concept_key = self.normalize_concept_key(core_concept)
            if not concept_key:
                continue
            
            concept = concepts[concept_key]
            
            # Metadata básica
            if not concept['concept_name']:
                concept['concept_name'] = core_concept
            
            if not concept['subject']:
                concept['subject'] = module.get('subject')
            
            concept['grade_ranges'].add(module.get('grade_range', ''))
            concept['difficulties'].add(module.get('difficulty', 2))
            concept['source_module_ids'].append(module.get('module_id'))
            
            # Contenido pedagógico
            concept['titles'].append(module.get('title', ''))
            concept['learning_objectives'].append(module.get('learning_objective', ''))
            
            # Extraer misconceptions de error_map
            if 'error_map' in module:
                misconception = self.extract_misconception(module['error_map'])
                if misconception:
                    concept['misconceptions'].append(misconception)
            
            # Extraer hints
            if 'hints' in module and isinstance(module['hints'], list):
                for hint in module['hints']:
                    if hint and hint not in concept['hints']:
                        concept['hints'].append(hint)
            
            # Extraer ejemplos de guided_exercises
            if 'guided_exercises' in module:
                example = self.extract_example(module['guided_exercises'])
                if example:
                    concept['examples'].append(example)
            
            # Conceptos relacionados
            if 'concepts' in module and isinstance(module['concepts'], list):
                for related in module['concepts']:
                    if related and related != core_concept:
                        related_key = self.normalize_concept_key(related)
                        if related_key:
                            concept['related_concepts'].add(related_key)
        
        print(f"✅ {len(concepts)} conceptos únicos extraídos\n")
        
        # 2. Enriquecer con taxonomías
        print("📚 Enriqueciendo con taxonomías curriculares...")
        
        # Mapear module_id -> taxonomy_ids
        module_to_taxonomies = defaultdict(set)
        for link in taxonomy_links:
            module_to_taxonomies[link['module_id']].add(link['taxonomy_id'])
        
        # Agregar taxonomías a conceptos
        for concept_key, concept_data in concepts.items():
            for module_id in concept_data['source_module_ids']:
                tax_ids = module_to_taxonomies.get(module_id, set())
                concept_data['taxonomy_ids'].update(tax_ids)
        
        print(f"✅ Taxonomías vinculadas\n")
        
        # 3. Construir tarjetas finales
        print("🎴 Construyendo tarjetas finales...")
        cards = []
        
        for concept_key, data in concepts.items():
            # Determinar card_type
            has_misconception = len(data['misconceptions']) > 0
            has_hint = len(data['hints']) > 0
            card_type = self.determine_card_type(concept_key, has_misconception, has_hint)
            
            # Seleccionar mejor contenido
            title = data['titles'][0] if data['titles'] else data['concept_name']
            body = data['learning_objectives'][0] if data['learning_objectives'] else f"Concepto: {data['concept_name']}"
            
            # Generar campos pedagógicos
            one_line_def = self.generate_one_line_definition(
                title, 
                data['learning_objectives'][0] if data['learning_objectives'] else '',
                data['concept_name']
            )
            
            core_insight = self.generate_core_insight(data['concept_name'], data['subject'])
            
            # Seleccionar mejor ejemplo
            example = data['examples'][0] if data['examples'] else None
            
            # Seleccionar misconception más común
            common_misconception = data['misconceptions'][0] if data['misconceptions'] else None
            
            # Seleccionar primer hint
            hint_prompt = data['hints'][0] if data['hints'] else None
            
            # Sugerir visual
            visual_key = self.suggest_visual(concept_key, data['subject'])
            
            # Determinar grade_range y difficulty representativas
            grade_range = sorted(data['grade_ranges'])[0] if data['grade_ranges'] else None
            difficulty = min(data['difficulties']) if data['difficulties'] else 2
            
            # Construir tarjeta
            # IMPORTANTE: Convertir subject a español (enum de Supabase)
            subject_spanish = self.SUBJECT_MAPPER.get(data['subject'], data['subject'])
            
            card = {
                'concept_key': concept_key,
                'concept_name': data['concept_name'],
                'card_type': card_type,
                'title': title[:255],  # Limit
                'body': body[:500],  # Limit
                'one_line_definition': one_line_def[:255] if one_line_def else None,
                'core_insight': core_insight[:255] if core_insight else None,
                'example': example,
                'common_misconception': common_misconception[:500] if common_misconception else None,
                'hint_prompt': hint_prompt[:255] if hint_prompt else None,
                'visual_template_key': visual_key,
                'subject': subject_spanish,  # Usar nombre en español para el enum
                'grade_range': grade_range,
                'difficulty': difficulty,
                'related_concepts': list(data['related_concepts'])[:10],  # Limit
                'source_module_ids': data['source_module_ids'][:50],  # Limit
                'taxonomy_ids': list(data['taxonomy_ids'])[:50]  # Limit
            }
            
            cards.append(card)
        
        print(f"✅ {len(cards)} tarjetas construidas\n")
        return cards
    
    def upload_cards_to_supabase(self, cards):
        """Sube tarjetas a Supabase en lotes"""
        print("=" * 80)
        print("📤 SUBIENDO TARJETAS A SUPABASE")
        print("=" * 80 + "\n")
        
        batch_size = 100
        total_batches = (len(cards) + batch_size - 1) // batch_size
        
        for i in range(0, len(cards), batch_size):
            batch = cards[i:i+batch_size]
            batch_num = (i // batch_size) + 1
            
            try:
                result = self.client.schema("kuneo").table("concept_cards").insert(batch).execute()
                print(f"   ✓ Lote {batch_num}/{total_batches}: {len(batch)} tarjetas subidas ({i+len(batch)}/{len(cards)})")
            except Exception as e:
                print(f"   ✗ Error en lote {batch_num}: {str(e)}")
        
        print()
    
    def validate_upload(self):
        """Valida la carga en Supabase"""
        print("=" * 80)
        print("🔍 VALIDANDO CARGA")
        print("=" * 80 + "\n")
        
        # Contar total
        result = self.client.schema("kuneo").table("concept_cards").select("id", count="exact").execute()
        total = result.count
        
        print(f"✅ Total de tarjetas en Supabase: {total}\n")
        
        # Contar por subject
        subjects_result = self.client.schema("kuneo").table("concept_cards").select("subject").execute()
        
        subjects_count = defaultdict(int)
        for card in subjects_result.data:
            subjects_count[card['subject']] += 1
        
        print("📚 Por materia:")
        for subject in sorted(subjects_count.keys()):
            print(f"   {subject}: {subjects_count[subject]} tarjetas")
        
        print()
        
        # Contar por card_type
        types_result = self.client.schema("kuneo").table("concept_cards").select("card_type").execute()
        
        types_count = defaultdict(int)
        for card in types_result.data:
            types_count[card['card_type']] += 1
        
        print("🎴 Por tipo de tarjeta:")
        for card_type in sorted(types_count.keys()):
            print(f"   {card_type}: {types_count[card_type]} tarjetas")
        
        print()
    
    def generate_report(self, cards):
        """Genera reporte de tarjetas generadas"""
        print("=" * 80)
        print("📊 REPORTE DE GENERACIÓN")
        print("=" * 80 + "\n")
        
        by_subject = defaultdict(int)
        by_type = defaultdict(int)
        with_example = 0
        with_misconception = 0
        with_hint = 0
        with_visual = 0
        
        for card in cards:
            by_subject[card['subject']] += 1
            by_type[card['card_type']] += 1
            
            if card.get('example'):
                with_example += 1
            if card.get('common_misconception'):
                with_misconception += 1
            if card.get('hint_prompt'):
                with_hint += 1
            if card.get('visual_template_key'):
                with_visual += 1
        
        print(f"Total tarjetas generadas: {len(cards)}\n")
        
        print("Por asignatura:")
        for subject in sorted(by_subject.keys()):
            print(f"  {subject}: {by_subject[subject]}")
        print()
        
        print("Por tipo:")
        for card_type in sorted(by_type.keys()):
            print(f"  {card_type}: {by_type[card_type]}")
        print()
        
        print("Contenido pedagógico:")
        print(f"  Con ejemplo: {with_example} ({with_example/len(cards)*100:.1f}%)")
        print(f"  Con misconception: {with_misconception} ({with_misconception/len(cards)*100:.1f}%)")
        print(f"  Con hint: {with_hint} ({with_hint/len(cards)*100:.1f}%)")
        print(f"  Con visual sugerido: {with_visual} ({with_visual/len(cards)*100:.1f}%)")
        print()
    
    def run(self):
        """Ejecuta el proceso completo"""
        print("=" * 80)
        print("🚀 KUNEO CONCEPT CARDS GENERATOR")
        print("=" * 80 + "\n")
        
        # 1. Cargar datos
        modules = self.load_modules_from_json()
        taxonomy_links = self.load_taxonomy_links()
        taxonomies = self.load_taxonomies()
        
        # 2. Generar tarjetas
        cards = self.build_concept_cards(modules, taxonomy_links, taxonomies)
        
        # 3. Reporte
        self.generate_report(cards)
        
        # 4. Subir a Supabase
        self.upload_cards_to_supabase(cards)
        
        # 5. Validar
        self.validate_upload()
        
        print("=" * 80)
        print("✅ PROCESO COMPLETADO")
        print("=" * 80)
        print("\n💾 Tarjetas conceptuales disponibles en: kuneo.concept_cards\n")


def main():
    generator = ConceptCardGenerator()
    generator.run()


if __name__ == "__main__":
    main()
