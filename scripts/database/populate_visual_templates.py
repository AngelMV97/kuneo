"""
KUNEO VISUAL TEMPLATES POPULATION SYSTEM
========================================
Genera plantillas visuales renderizables desde concept_cards.

ARQUITECTURA:
concept_card.visual_template_key 
  → visual_templates.template_key 
  → renderer_type 
  → frontend_renderer 
  → visual_config JSONB

FILOSOFÍA:
- NO guardar imágenes estáticas (excepto casos ilustrativos)
- SÍ guardar configuración para que el frontend renderice
- Plantillas REUTILIZABLES y PARAMETRIZABLES

FLUJO:
1. Leer concept_cards
2. Extraer visual_template_key únicos
3. Clasificar por visual_type y renderer
4. Generar config JSONB base
5. Insertar en visual_templates
6. Validar vinculación 0 tarjetas sin template válido
"""

import json
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import defaultdict


class VisualTemplateGenerator:
    def __init__(self):
        load_dotenv(Path(__file__).parent.parent.parent / "server" / ".env")
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.client: Client = create_client(supabase_url, supabase_key)
        
        # CLASIFICACIÓN DE TEMPLATES POR RENDERER
        self.TEMPLATE_CLASSIFICATION = {
            # Math Visuals (renderer: svg_custom o recharts)
            'fraction_part_whole': {
                'visual_type': 'math_visual',
                'renderer': 'svg_custom',
                'interaction_level': 'static',
                'subject': 'matematicas'
            },
            'number_line_decimal': {
                'visual_type': 'math_visual',
                'renderer': 'svg_custom',
                'interaction_level': 'hoverable',
                'subject': 'matematicas'
            },
            'equation_balance': {
                'visual_type': 'math_visual',
                'renderer': 'svg_custom',
                'interaction_level': 'interactive',
                'subject': 'matematicas'
            },
            'proportional_relationship': {
                'visual_type': 'graph',
                'renderer': 'recharts',
                'interaction_level': 'hoverable',
                'subject': 'matematicas'
            },
            'function_graph': {
                'visual_type': 'graph',
                'renderer': 'recharts',
                'interaction_level': 'interactive',
                'subject': 'matematicas'
            },
            'geometric_shapes': {
                'visual_type': 'math_visual',
                'renderer': 'svg_custom',
                'interaction_level': 'static',
                'subject': 'matematicas'
            },
            'angle_measurement': {
                'visual_type': 'math_visual',
                'renderer': 'svg_custom',
                'interaction_level': 'interactive',
                'subject': 'matematicas'
            },
            'area_comparison': {
                'visual_type': 'math_visual',
                'renderer': 'svg_custom',
                'interaction_level': 'static',
                'subject': 'matematicas'
            },
            'probability_diagram': {
                'visual_type': 'graph',
                'renderer': 'recharts',
                'interaction_level': 'hoverable',
                'subject': 'matematicas'
            },
            'data_visualization': {
                'visual_type': 'graph',
                'renderer': 'recharts',
                'interaction_level': 'interactive',
                'subject': 'matematicas'
            },
            
            # Science Process Diagrams (renderer: react_flow o mermaid)
            'cell_diagram': {
                'visual_type': 'process_diagram',
                'renderer': 'svg_custom',
                'interaction_level': 'hoverable',
                'subject': 'ciencias'
            },
            'photosynthesis_cycle': {
                'visual_type': 'process_diagram',
                'renderer': 'react_flow',
                'interaction_level': 'hoverable',
                'subject': 'ciencias'
            },
            'ecosystem_web': {
                'visual_type': 'concept_map',
                'renderer': 'react_flow',
                'interaction_level': 'interactive',
                'subject': 'ciencias'
            },
            'food_chain': {
                'visual_type': 'process_diagram',
                'renderer': 'svg_custom',
                'interaction_level': 'static',
                'subject': 'ciencias'
            },
            'water_cycle': {
                'visual_type': 'process_diagram',
                'renderer': 'react_flow',
                'interaction_level': 'animated',
                'subject': 'ciencias'
            },
            'energy_transformation': {
                'visual_type': 'process_diagram',
                'renderer': 'react_flow',
                'interaction_level': 'hoverable',
                'subject': 'ciencias'
            },
            'force_diagram': {
                'visual_type': 'math_visual',
                'renderer': 'svg_custom',
                'interaction_level': 'static',
                'subject': 'ciencias'
            },
            'body_system_diagram': {
                'visual_type': 'process_diagram',
                'renderer': 'svg_custom',
                'interaction_level': 'hoverable',
                'subject': 'ciencias'
            },
            'matter_states': {
                'visual_type': 'process_diagram',
                'renderer': 'svg_custom',
                'interaction_level': 'animated',
                'subject': 'ciencias'
            },
            
            # Social Studies (renderer: timeline, map_visual, concept_map)
            'map_visualization': {
                'visual_type': 'map_visual',
                'renderer': 'map_visual',
                'interaction_level': 'interactive',
                'subject': 'sociales'
            },
            'timeline': {
                'visual_type': 'timeline',
                'renderer': 'timeline',
                'interaction_level': 'hoverable',
                'subject': 'sociales'
            },
            'concept_map': {
                'visual_type': 'concept_map',
                'renderer': 'concept_map',
                'interaction_level': 'hoverable',
                'subject': 'sociales'
            },
            'hierarchical_diagram': {
                'visual_type': 'concept_map',
                'renderer': 'react_flow',
                'interaction_level': 'hoverable',
                'subject': 'sociales'
            },
            'flow_diagram': {
                'visual_type': 'process_diagram',
                'renderer': 'mermaid',
                'interaction_level': 'static',
                'subject': 'sociales'
            },
            
            # Language (renderer: concept_map, svg_custom)
            'reading_strategy': {
                'visual_type': 'concept_map',
                'renderer': 'concept_map',
                'interaction_level': 'hoverable',
                'subject': 'lenguaje'
            },
            'story_structure': {
                'visual_type': 'process_diagram',
                'renderer': 'svg_custom',
                'interaction_level': 'static',
                'subject': 'lenguaje'
            },
            'argument_structure': {
                'visual_type': 'concept_map',
                'renderer': 'concept_map',
                'interaction_level': 'hoverable',
                'subject': 'lenguaje'
            },
            'rule_visualization': {
                'visual_type': 'comparison_table',
                'renderer': 'grammar_table',
                'interaction_level': 'static',
                'subject': 'lenguaje'
            },
            
            # English (renderer: grammar_table, concept_map)
            'grammar_table': {
                'visual_type': 'grammar_visual',
                'renderer': 'grammar_table',
                'interaction_level': 'static',
                'subject': 'ingles'
            },
            
            # Fallbacks genéricos
            'graph': {
                'visual_type': 'graph',
                'renderer': 'recharts',
                'interaction_level': 'hoverable',
                'subject': None
            },
            'diagram': {
                'visual_type': 'process_diagram',
                'renderer': 'svg_custom',
                'interaction_level': 'static',
                'subject': None
            }
        }
        
        # CONFIG GENERATORS POR TIPO
        self.CONFIG_GENERATORS = {
            'math_visual': self.generate_math_visual_config,
            'graph': self.generate_graph_config,
            'process_diagram': self.generate_process_diagram_config,
            'concept_map': self.generate_concept_map_config,
            'timeline': self.generate_timeline_config,
            'grammar_visual': self.generate_grammar_visual_config,
            'map_visual': self.generate_map_visual_config,
            'comparison_table': self.generate_comparison_table_config
        }
    
    def load_concept_cards(self):
        """Carga todas las concept_cards desde Supabase"""
        print("📂 Cargando concept_cards desde Supabase...")
        
        result = self.client.schema("kuneo").table("concept_cards").select(
            "concept_key, visual_template_key, subject"
        ).execute()
        
        cards = result.data
        print(f"✅ {len(cards)} tarjetas cargadas\n")
        return cards
    
    def extract_unique_templates(self, cards):
        """Extrae visual_template_key únicos"""
        print("🔍 Extrayendo visual_template_key únicos...")
        
        templates = {}
        for card in cards:
            key = card.get('visual_template_key')
            if key and key not in templates:
                templates[key] = {
                    'template_key': key,
                    'subject': card.get('subject'),
                    'usage_count': 0
                }
            
            if key:
                templates[key]['usage_count'] += 1
        
        print(f"✅ {len(templates)} plantillas únicas encontradas\n")
        return list(templates.values())
    
    def classify_template(self, template_key, subject):
        """Clasifica un template_key y retorna metadata completa"""
        # Buscar clasificación predefinida
        if template_key in self.TEMPLATE_CLASSIFICATION:
            classification = self.TEMPLATE_CLASSIFICATION[template_key].copy()
            # Usar subject de concept_card si no está definido
            if not classification.get('subject'):
                classification['subject'] = subject
            return classification
        
        # Fallback: intentar inferir por nombre
        if 'graph' in template_key or 'function' in template_key:
            return {
                'visual_type': 'graph',
                'renderer': 'recharts',
                'interaction_level': 'hoverable',
                'subject': subject
            }
        elif 'diagram' in template_key or 'cycle' in template_key:
            return {
                'visual_type': 'process_diagram',
                'renderer': 'svg_custom',
                'interaction_level': 'static',
                'subject': subject
            }
        elif 'map' in template_key:
            return {
                'visual_type': 'concept_map',
                'renderer': 'concept_map',
                'interaction_level': 'hoverable',
                'subject': subject
            }
        
        # Fallback genérico
        return {
            'visual_type': 'static_svg',
            'renderer': 'svg_custom',
            'interaction_level': 'static',
            'subject': subject
        }
    
    # CONFIG GENERATORS
    
    def generate_math_visual_config(self, template_key):
        """Genera config para visuales matemáticos"""
        configs = {
            'fraction_part_whole': {
                'shape': 'circle',
                'parts': 4,
                'highlighted': 1,
                'labels': True,
                'colors': ['#3B82F6', '#E5E7EB'],
                'caption': 'Una fracción muestra cuántas partes tomas de un total dividido en partes iguales.'
            },
            'equation_balance': {
                'showBalance': True,
                'leftSide': 'x + 3',
                'rightSide': '7',
                'interactive': True,
                'caption': 'Una ecuación es como una balanza: lo que haces a un lado, debes hacerlo al otro.'
            },
            'angle_measurement': {
                'showProtractor': True,
                'angle': 45,
                'showDegrees': True,
                'interactive': True,
                'caption': 'Los ángulos se miden en grados usando un transportador.'
            },
            'area_comparison': {
                'shapes': [
                    {'type': 'rectangle', 'width': 4, 'height': 3, 'color': '#3B82F6'},
                    {'type': 'square', 'side': 4, 'color': '#10B981'}
                ],
                'showGrid': True,
                'caption': 'El área mide el espacio dentro de una figura.'
            }
        }
        
        return configs.get(template_key, {
            'placeholder': True,
            'caption': 'Visual matemático'
        })
    
    def generate_graph_config(self, template_key):
        """Genera config para gráficas"""
        return {
            'type': 'line',
            'xAxis': {'label': 'x', 'min': 0, 'max': 10},
            'yAxis': {'label': 'y', 'min': 0, 'max': 10},
            'data': [],
            'showGrid': True,
            'responsive': True,
            'caption': 'Gráfica de función o relación'
        }
    
    def generate_process_diagram_config(self, template_key):
        """Genera config para diagramas de proceso"""
        configs = {
            'photosynthesis_cycle': {
                'nodes': [
                    {'id': '1', 'label': 'Luz solar', 'type': 'input'},
                    {'id': '2', 'label': 'CO₂ + H₂O', 'type': 'input'},
                    {'id': '3', 'label': 'Cloroplasto', 'type': 'process'},
                    {'id': '4', 'label': 'Glucosa + O₂', 'type': 'output'}
                ],
                'edges': [
                    {'from': '1', 'to': '3'},
                    {'from': '2', 'to': '3'},
                    {'from': '3', 'to': '4'}
                ],
                'caption': 'La fotosíntesis convierte luz en energía química'
            },
            'water_cycle': {
                'nodes': [
                    {'id': '1', 'label': 'Evaporación', 'type': 'process'},
                    {'id': '2', 'label': 'Condensación', 'type': 'process'},
                    {'id': '3', 'label': 'Precipitación', 'type': 'process'},
                    {'id': '4', 'label': 'Escorrentía', 'type': 'process'}
                ],
                'edges': [
                    {'from': '1', 'to': '2', 'animated': True},
                    {'from': '2', 'to': '3', 'animated': True},
                    {'from': '3', 'to': '4', 'animated': True},
                    {'from': '4', 'to': '1', 'animated': True}
                ],
                'caption': 'El agua circula constantemente en la naturaleza'
            }
        }
        
        return configs.get(template_key, {
            'nodes': [],
            'edges': [],
            'layout': 'horizontal',
            'caption': 'Diagrama de proceso'
        })
    
    def generate_concept_map_config(self, template_key):
        """Genera config para mapas conceptuales"""
        return {
            'nodes': [],
            'edges': [],
            'layout': 'hierarchical',
            'showLabels': True,
            'caption': 'Mapa conceptual'
        }
    
    def generate_timeline_config(self, template_key):
        """Genera config para líneas de tiempo"""
        return {
            'events': [],
            'orientation': 'horizontal',
            'showDates': True,
            'caption': 'Línea de tiempo'
        }
    
    def generate_grammar_visual_config(self, template_key):
        """Genera config para visuales de gramática"""
        return {
            'columns': ['Forma', 'Uso', 'Ejemplo'],
            'rows': [],
            'highlightExamples': True,
            'caption': 'Tabla de gramática'
        }
    
    def generate_map_visual_config(self, template_key):
        """Genera config para mapas"""
        return {
            'center': [4.5709, -74.2973],  # Colombia
            'zoom': 6,
            'layers': [],
            'showLabels': True,
            'caption': 'Mapa geográfico'
        }
    
    def generate_comparison_table_config(self, template_key):
        """Genera config para tablas comparativas"""
        return {
            'columns': ['Característica', 'Opción A', 'Opción B'],
            'rows': [],
            'highlightDifferences': True,
            'caption': 'Tabla comparativa'
        }
    
    def build_visual_templates(self, unique_templates):
        """Construye plantillas visuales completas"""
        print("=" * 80)
        print("🎨 GENERANDO PLANTILLAS VISUALES")
        print("=" * 80 + "\n")
        
        templates = []
        
        for template_info in unique_templates:
            template_key = template_info['template_key']
            subject = template_info['subject']
            
            # Clasificar template
            classification = self.classify_template(template_key, subject)
            
            # Generar config según visual_type
            visual_type = classification['visual_type']
            config_generator = self.CONFIG_GENERATORS.get(
                visual_type,
                lambda k: {'placeholder': True}
            )
            config = config_generator(template_key)
            
            # Generar nombre legible
            template_name = template_key.replace('_', ' ').title()
            
            # Construir template completo
            template = {
                'template_key': template_key,
                'template_name': template_name,
                'description': f"Plantilla visual para {template_name.lower()}",
                'visual_type': visual_type,
                'renderer': classification['renderer'],
                'interaction_level': classification['interaction_level'],
                'config': config,
                'default_props': {
                    'width': 400,
                    'height': 300,
                    'responsive': True
                },
                'subject': classification['subject'],
                'supported_card_types': ['basic', 'hint', 'corrective', 'reflective'],
                'use_cases': ['explanation', 'example', 'misconception']
            }
            
            templates.append(template)
        
        print(f"✅ {len(templates)} plantillas generadas\n")
        return templates
    
    def upload_templates_to_supabase(self, templates):
        """Sube plantillas a Supabase"""
        print("=" * 80)
        print("📤 SUBIENDO PLANTILLAS A SUPABASE")
        print("=" * 80 + "\n")
        
        batch_size = 50
        total_batches = (len(templates) + batch_size - 1) // batch_size
        
        for i in range(0, len(templates), batch_size):
            batch = templates[i:i+batch_size]
            batch_num = (i // batch_size) + 1
            
            try:
                result = self.client.schema("kuneo").table("visual_templates").insert(batch).execute()
                print(f"   ✓ Lote {batch_num}/{total_batches}: {len(batch)} plantillas subidas ({i+len(batch)}/{len(templates)})")
            except Exception as e:
                print(f"   ✗ Error en lote {batch_num}: {str(e)}")
        
        print()
    
    def validate_upload(self):
        """Valida la carga y vinculación"""
        print("=" * 80)
        print("🔍 VALIDANDO CARGA Y VINCULACIÓN")
        print("=" * 80 + "\n")
        
        # Total de plantillas
        result = self.client.schema("kuneo").table("visual_templates").select("id", count="exact").execute()
        total = result.count
        
        print(f"✅ Total de plantillas en Supabase: {total}\n")
        
        # Por renderer
        renderers_result = self.client.schema("kuneo").table("visual_templates").select("renderer").execute()
        
        renderers_count = defaultdict(int)
        for template in renderers_result.data:
            renderers_count[template['renderer']] += 1
        
        print("🎨 Por renderer:")
        for renderer in sorted(renderers_count.keys()):
            print(f"   {renderer}: {renderers_count[renderer]} plantillas")
        
        print()
        
        # Validar vinculación con concept_cards
        print("🔗 Validando vinculación con concept_cards...")
        
        # Obtener todas las concept_cards
        cards_result = self.client.schema("kuneo").table("concept_cards").select(
            "concept_key, visual_template_key"
        ).execute()
        
        # Obtener todas las plantillas
        templates_result = self.client.schema("kuneo").table("visual_templates").select(
            "template_key"
        ).execute()
        
        template_keys = set(t['template_key'] for t in templates_result.data)
        
        orphan_cards = []
        for card in cards_result.data:
            vtk = card.get('visual_template_key')
            if vtk and vtk not in template_keys:
                orphan_cards.append(card['concept_key'])
        
        if orphan_cards:
            print(f"❌ {len(orphan_cards)} tarjetas sin plantilla válida:")
            for concept in orphan_cards[:5]:
                print(f"   - {concept}")
            if len(orphan_cards) > 5:
                print(f"   ... y {len(orphan_cards) - 5} más")
        else:
            print(f"✅ Todas las tarjetas tienen plantilla válida")
        
        print()
    
    def generate_report(self, templates):
        """Genera reporte de plantillas generadas"""
        print("=" * 80)
        print("📊 REPORTE DE GENERACIÓN")
        print("=" * 80 + "\n")
        
        by_type = defaultdict(int)
        by_renderer = defaultdict(int)
        by_interaction = defaultdict(int)
        
        for template in templates:
            by_type[template['visual_type']] += 1
            by_renderer[template['renderer']] += 1
            by_interaction[template['interaction_level']] += 1
        
        print(f"Total plantillas generadas: {len(templates)}\n")
        
        print("Por visual_type:")
        for vtype in sorted(by_type.keys()):
            print(f"  {vtype}: {by_type[vtype]}")
        print()
        
        print("Por renderer:")
        for renderer in sorted(by_renderer.keys()):
            print(f"  {renderer}: {by_renderer[renderer]}")
        print()
        
        print("Por interaction_level:")
        for level in sorted(by_interaction.keys()):
            print(f"  {level}: {by_interaction[level]}")
        print()
    
    def run(self):
        """Ejecuta el proceso completo"""
        print("=" * 80)
        print("🚀 KUNEO VISUAL TEMPLATES GENERATOR")
        print("=" * 80 + "\n")
        
        # 1. Cargar concept_cards
        cards = self.load_concept_cards()
        
        # 2. Extraer templates únicos
        unique_templates = self.extract_unique_templates(cards)
        
        # 3. Generar plantillas
        templates = self.build_visual_templates(unique_templates)
        
        # 4. Reporte
        self.generate_report(templates)
        
        # 5. Subir a Supabase
        self.upload_templates_to_supabase(templates)
        
        # 6. Validar
        self.validate_upload()
        
        print("=" * 80)
        print("✅ PROCESO COMPLETADO")
        print("=" * 80)
        print("\n💾 Plantillas visuales disponibles en: kuneo.visual_templates\n")


def main():
    generator = VisualTemplateGenerator()
    generator.run()


if __name__ == "__main__":
    main()
