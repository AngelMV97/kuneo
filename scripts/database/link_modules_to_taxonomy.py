"""
KUNEO TAXONOMY LINKER
Vincula módulos con taxonomías curriculares usando module_taxonomy_link

Estrategia de vinculación:
1. Match por subject + grade_range (filtro base)
2. Match por concepts/core_concept con discipline/thematic/subthematic/microtopics
3. Clasificación de links: primary (match directo), secondary (match parcial), related (match general)
"""

import json
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime
from typing import List, Dict, Tuple
import uuid

class TaxonomyLinker:
    # Mapper de nombres de subjects entre módulos (inglés) y taxonomías (español)
    SUBJECT_MAPPER = {
        'mathematics': 'matematicas',
        'natural_sciences': 'ciencias_naturales',
        'social_studies': 'ciencias_sociales',
        'language': 'lenguaje',
        'english': 'ingles'
    }
    
    def __init__(self):
        load_dotenv(Path(__file__).parent.parent.parent / "server" / ".env")
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidas en server/.env")
        
        self.client: Client = create_client(supabase_url, supabase_key)
        
    def load_modules_from_supabase(self) -> List[Dict]:
        """Carga todos los módulos desde Supabase usando paginación"""
        print("📂 Cargando módulos desde Supabase...")
        
        all_modules = []
        page_size = 1000
        page = 0
        
        while True:
            start = page * page_size
            end = start + page_size - 1
            
            result = self.client.schema("kuneo").table("modules").select(
                "id, source_unit_id, subject, grade_range, core_concept, content"
            ).range(start, end).execute()
            
            if not result.data:
                break
            
            all_modules.extend(result.data)
            page += 1
            
            if len(result.data) < page_size:
                break
        
        print(f"✅ {len(all_modules)} módulos cargados")
        return all_modules
    
    def load_taxonomies_from_supabase(self) -> List[Dict]:
        """Carga todas las taxonomías desde Supabase usando paginación"""
        print("📂 Cargando taxonomías desde Supabase...")
        
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
        
        print(f"✅ {len(all_taxonomies)} taxonomías cargadas")
        return all_taxonomies
    
    def normalize_grade_for_comparison(self, grade_str: str) -> set:
        """Convierte grade_range a set de grados individuales para comparación"""
        if '-' in grade_str:
            start, end = grade_str.split('-')
            return set(range(int(start), int(end) + 1))
        else:
            return {int(grade_str)}
    
    def grades_overlap(self, grade1: str, grade2: str) -> bool:
        """Verifica si dos grade_ranges se superponen"""
        try:
            set1 = self.normalize_grade_for_comparison(grade1)
            set2 = self.normalize_grade_for_comparison(grade2)
            return bool(set1 & set2)  # Hay intersección
        except:
            return grade1 == grade2  # Fallback: comparación exacta
    
    def normalize_text(self, text: str) -> str:
        """Normaliza texto para comparación"""
        return text.lower().replace('_', ' ').replace('-', ' ').strip()
    
    def calculate_match_score(self, module: Dict, taxonomy: Dict) -> Tuple[float, str]:
        """
        Calcula score de match entre módulo y taxonomía
        Returns: (score, link_type)
        
        link_type:
        - 'primary': match directo y fuerte (>= 0.7)
        - 'secondary': match parcial (>= 0.4)
        - 'related': match débil o solo por subject+grade (>= 0.2)
        """
        score = 0.0
        
        # 1. Subject match (requerido)
        # Normalizar subject del módulo (inglés) a español para comparar
        module_subject_normalized = self.SUBJECT_MAPPER.get(module['subject'], module['subject'])
        if module_subject_normalized != taxonomy['subject']:
            return (0.0, 'none')
        
        score += 0.2  # Base score por subject match
        
        # 2. Grade overlap (fuerte indicador)
        if self.grades_overlap(module['grade_range'], taxonomy['grade_range']):
            score += 0.2
        else:
            return (score, 'related')  # No hay overlap de grado, solo related
        
        # 3. Core concept match
        core_concept = self.normalize_text(module['core_concept'])
        
        # Contra discipline
        discipline = self.normalize_text(taxonomy.get('discipline', ''))
        if core_concept in discipline or discipline in core_concept:
            score += 0.3
        
        # Contra thematic
        thematic = self.normalize_text(taxonomy.get('thematic', ''))
        if core_concept in thematic or thematic in core_concept:
            score += 0.2
        
        # Contra subthematic
        subthematic = self.normalize_text(taxonomy.get('subthematic', ''))
        if core_concept in subthematic or subthematic in core_concept:
            score += 0.25
        
        # 4. Concepts match (array en module.content.concepts)
        module_concepts = [self.normalize_text(c) for c in module.get('content', {}).get('concepts', [])]
        microtopics = [self.normalize_text(m) for m in taxonomy.get('microtopics', [])]
        
        # Contar matches
        matches = 0
        for mc in module_concepts:
            for mt in microtopics:
                if mc in mt or mt in mc:
                    matches += 1
                    break
        
        if matches > 0 and len(module_concepts) > 0:
            score += 0.15 * (matches / len(module_concepts))
        
        # Determinar link_type
        if score >= 0.7:
            link_type = 'primary'
        elif score >= 0.4:
            link_type = 'secondary'
        else:
            link_type = 'related'
        
        return (score, link_type)
    
    def find_taxonomy_matches(self, module: Dict, taxonomies: List[Dict], 
                             max_primary: int = 3, max_secondary: int = 5) -> List[Dict]:
        """
        Encuentra las mejores taxonomías para un módulo
        
        Returns: lista de {taxonomy_id, score, link_type}
        """
        matches = []
        
        for taxonomy in taxonomies:
            score, link_type = self.calculate_match_score(module, taxonomy)
            
            if score >= 0.2:  # Umbral mínimo
                matches.append({
                    'taxonomy_id': taxonomy['id'],
                    'score': score,
                    'link_type': link_type
                })
        
        # Ordenar por score descendente
        matches.sort(key=lambda x: x['score'], reverse=True)
        
        # Filtrar por límites
        primary = [m for m in matches if m['link_type'] == 'primary'][:max_primary]
        secondary = [m for m in matches if m['link_type'] == 'secondary'][:max_secondary]
        related = [m for m in matches if m['link_type'] == 'related'][:2]  # Máximo 2 related
        
        return primary + secondary + related
    
    def create_links(self, modules: List[Dict], taxonomies: List[Dict]) -> List[Dict]:
        """Crea todos los links entre módulos y taxonomías"""
        print("\n🔗 Generando links entre módulos y taxonomías...")
        
        all_links = []
        modules_with_links = 0
        modules_without_links = 0
        
        for i, module in enumerate(modules):
            matches = self.find_taxonomy_matches(module, taxonomies)
            
            if matches:
                modules_with_links += 1
                for match in matches:
                    all_links.append({
                        'id': str(uuid.uuid4()),
                        'module_id': module['id'],
                        'taxonomy_id': match['taxonomy_id'],
                        'link_type': match['link_type']
                    })
            else:
                modules_without_links += 1
            
            if (i + 1) % 100 == 0:
                print(f"   Procesados {i + 1}/{len(modules)} módulos...")
        
        print(f"\n✅ Links generados: {len(all_links)}")
        print(f"   Módulos con links: {modules_with_links}")
        print(f"   Módulos sin links: {modules_without_links}")
        
        return all_links
    
    def upload_links_to_supabase(self, links: List[Dict], batch_size: int = 500) -> Tuple[int, int]:
        """Sube links a Supabase en lotes"""
        print(f"\n🔄 Subiendo {len(links)} links a Supabase...")
        
        uploaded = 0
        failed = 0
        
        for i in range(0, len(links), batch_size):
            batch = links[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(links) + batch_size - 1) // batch_size
            
            try:
                self.client.schema("kuneo").table("module_taxonomy_link").upsert(
                    batch,
                    on_conflict="id"
                ).execute()
                
                uploaded += len(batch)
                print(f"   ✓ Lote {batch_num}/{total_batches}: {len(batch)} links subidos ({uploaded}/{len(links)})")
                
            except Exception as e:
                failed += len(batch)
                print(f"   ❌ Error en lote {batch_num}: {str(e)}")
        
        return uploaded, failed
    
    def generate_statistics(self, links: List[Dict]) -> Dict:
        """Genera estadísticas de los links"""
        stats = {
            'total_links': len(links),
            'by_type': {},
            'modules_linked': len(set(l['module_id'] for l in links)),
            'taxonomies_linked': len(set(l['taxonomy_id'] for l in links))
        }
        
        for link in links:
            link_type = link['link_type']
            stats['by_type'][link_type] = stats['by_type'].get(link_type, 0) + 1
        
        return stats
    
    def run(self):
        """Proceso completo de vinculación"""
        print("=" * 60)
        print("🔗 KUNEO TAXONOMY LINKER")
        print("=" * 60)
        print(f"\nFecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 1. Cargar datos
        modules = self.load_modules_from_supabase()
        taxonomies = self.load_taxonomies_from_supabase()
        
        # 2. Crear links
        links = self.create_links(modules, taxonomies)
        
        # 3. Estadísticas
        stats = self.generate_statistics(links)
        
        print(f"\n{'=' * 60}")
        print("📊 ESTADÍSTICAS DE VINCULACIÓN")
        print(f"{'=' * 60}")
        print(f"Total de links: {stats['total_links']}")
        print(f"Módulos vinculados: {stats['modules_linked']} / {len(modules)}")
        print(f"Taxonomías vinculadas: {stats['taxonomies_linked']} / {len(taxonomies)}")
        print(f"\nPor tipo de link:")
        for link_type, count in sorted(stats['by_type'].items()):
            print(f"   {link_type}: {count} links")
        
        # 4. Subir a Supabase
        uploaded, failed = self.upload_links_to_supabase(links)
        
        print(f"\n{'=' * 60}")
        print("📊 RESUMEN DE CARGA")
        print(f"{'=' * 60}")
        print(f"✅ Subidos exitosamente: {uploaded}")
        if failed > 0:
            print(f"❌ Fallidos: {failed}")
        
        print(f"\n{'=' * 60}")
        print("✅ VINCULACIÓN COMPLETADA")
        print(f"{'=' * 60}")
        print(f"\n💾 Links disponibles en: kuneo.module_taxonomy_link")
        
        return stats


def main():
    linker = TaxonomyLinker()
    linker.run()


if __name__ == "__main__":
    main()
