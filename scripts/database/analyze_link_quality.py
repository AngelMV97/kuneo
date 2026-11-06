"""
ANÁLISIS DE CALIDAD DE VINCULACIÓN TAXONOMÍAS-MÓDULOS
Verifica que no hay cross-contamination entre asignaturas
"""

import json
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import defaultdict

class LinkQualityAnalyzer:
    def __init__(self):
        load_dotenv(Path(__file__).parent.parent.parent / "server" / ".env")
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.client: Client = create_client(supabase_url, supabase_key)
        
        self.SUBJECT_MAPPER = {
            'mathematics': 'matematicas',
            'natural_sciences': 'ciencias_naturales',
            'social_studies': 'ciencias_sociales',
            'language': 'lenguaje',
            'english': 'ingles'
        }
    
    def analyze_cross_contamination(self):
        """Verifica que no haya links entre asignaturas diferentes"""
        print("\n" + "=" * 70)
        print("ANÁLISIS DE CROSS-CONTAMINATION")
        print("=" * 70)
        
        # Obtener todos los links
        print("Cargando links...")
        links_result = self.client.schema("kuneo").table("module_taxonomy_link").select(
            "id, link_type, module_id, taxonomy_id"
        ).limit(15000).execute()
        
        # Obtener módulos
        print("Cargando módulos...")
        modules_result = self.client.schema("kuneo").table("modules").select(
            "id, subject"
        ).limit(2000).execute()
        modules_dict = {m['id']: m for m in modules_result.data}
        
        # Obtener taxonomías
        print("Cargando taxonomías...")
        taxonomies_result = self.client.schema("kuneo").table("curriculum_taxonomy").select(
            "id, subject"
        ).limit(2000).execute()
        taxonomies_dict = {t['id']: t for t in taxonomies_result.data}
        
        links = links_result.data
        print(f"\nTotal links analizados: {len(links)}")
        
        # Analizar cross-contamination
        contaminated = []
        by_module_subject = defaultdict(lambda: defaultdict(int))
        skipped = 0
        
        for link in links:
            module = modules_dict.get(link['module_id'])
            taxonomy = taxonomies_dict.get(link['taxonomy_id'])
            
            if not module or not taxonomy:
                skipped += 1
                continue
            
            module_subject = module['subject']
            taxonomy_subject = taxonomy['subject']
            
            # Normalizar subject del módulo a español
            module_subject_normalized = self.SUBJECT_MAPPER.get(module_subject, module_subject)
            
            # Contar por subject del módulo
            by_module_subject[module_subject][taxonomy_subject] += 1
            
            # Verificar si hay mismatch
            if module_subject_normalized != taxonomy_subject:
                contaminated.append({
                    'link_id': link['id'],
                    'link_type': link['link_type'],
                    'module_subject': module_subject,
                    'taxonomy_subject': taxonomy_subject
                })
        
        if skipped > 0:
            print(f"⚠️  {skipped} links omitidos (módulo o taxonomía no encontrada)")
        
        # Reportar
        if contaminated:
            print(f"\n❌ ENCONTRADOS {len(contaminated)} LINKS CON CROSS-CONTAMINATION:")
            
            # Agrupar por tipo de mismatch
            mismatches = defaultdict(int)
            for c in contaminated:
                key = f"{c['module_subject']} → {c['taxonomy_subject']}"
                mismatches[key] += 1
            
            print("\nDesglose de mismatches:")
            for mismatch, count in sorted(mismatches.items(), key=lambda x: x[1], reverse=True):
                print(f"  {mismatch}: {count} links")
            
            # Mostrar algunos ejemplos
            print(f"\nPrimeros 5 ejemplos de cross-contamination:")
            for c in contaminated[:5]:
                print(f"  - Link {c['link_id'][:8]}... ({c['link_type']}): "
                      f"módulo {c['module_subject']} → taxonomía {c['taxonomy_subject']}")
        else:
            print(f"\n✅ NO SE ENCONTRÓ CROSS-CONTAMINATION")
            print("   Todos los links conectan módulos y taxonomías de la misma asignatura")
        
        # Mostrar distribución correcta
        print(f"\n" + "-" * 70)
        print("DISTRIBUCIÓN DE LINKS POR ASIGNATURA (módulo subject):")
        print("-" * 70)
        
        for module_subject in sorted(by_module_subject.keys()):
            total = sum(by_module_subject[module_subject].values())
            print(f"\n{module_subject.upper()} ({total} links):")
            for tax_subject, count in sorted(by_module_subject[module_subject].items(), 
                                            key=lambda x: x[1], reverse=True):
                percentage = (count / total) * 100
                print(f"  → {tax_subject}: {count} ({percentage:.1f}%)")
        
        return len(contaminated) == 0
    
    def analyze_unused_taxonomies(self):
        """Analiza por qué tantas taxonomías no tienen links"""
        print("\n" + "=" * 70)
        print("ANÁLISIS DE TAXONOMÍAS SIN VINCULAR")
        print("=" * 70)
        
        # Obtener todas las taxonomías
        all_tax = self.client.schema("kuneo").table("curriculum_taxonomy").select(
            "id, subject, grade_range, discipline, thematic, subthematic"
        ).limit(2000).execute()
        
        # Obtener taxonomías vinculadas
        linked_tax_ids = set()
        page = 0
        while True:
            start = page * 1000
            end = start + 999
            result = self.client.schema("kuneo").from_("module_taxonomy_link").select(
                "taxonomy_id"
            ).range(start, end).execute()
            
            if not result.data:
                break
            
            linked_tax_ids.update(t['taxonomy_id'] for t in result.data)
            page += 1
            
            if len(result.data) < 1000:
                break
        
        print(f"\nTotal taxonomías: {len(all_tax.data)}")
        print(f"Taxonomías vinculadas: {len(linked_tax_ids)}")
        print(f"Taxonomías sin vincular: {len(all_tax.data) - len(linked_tax_ids)}")
        
        # Analizar taxonomías sin vincular por subject
        unlinked_by_subject = defaultdict(list)
        for tax in all_tax.data:
            if tax['id'] not in linked_tax_ids:
                unlinked_by_subject[tax['subject']].append(tax)
        
        print(f"\n" + "-" * 70)
        print("TAXONOMÍAS SIN VINCULAR POR ASIGNATURA:")
        print("-" * 70)
        
        for subject in sorted(unlinked_by_subject.keys()):
            unlinked = unlinked_by_subject[subject]
            print(f"\n{subject.upper()}: {len(unlinked)} sin vincular")
            
            # Contar por grade_range
            by_grade = defaultdict(int)
            for tax in unlinked:
                by_grade[tax['grade_range']] += 1
            
            print("  Por grado:")
            for grade, count in sorted(by_grade.items()):
                print(f"    {grade}: {count}")
            
            # Mostrar algunos ejemplos
            print("  Ejemplos:")
            for tax in unlinked[:3]:
                print(f"    - {tax['discipline']} → {tax['thematic']} → {tax['subthematic']}")
        
        # Comparar con distribución de módulos
        print(f"\n" + "-" * 70)
        print("COMPARACIÓN: MÓDULOS vs TAXONOMÍAS POR ASIGNATURA")
        print("-" * 70)
        
        # Contar módulos por subject
        modules_result = self.client.schema("kuneo").table("modules").select(
            "subject"
        ).limit(2000).execute()
        
        modules_by_subject = defaultdict(int)
        for m in modules_result.data:
            modules_by_subject[m['subject']] += 1
        
        # Contar taxonomías por subject
        tax_by_subject = defaultdict(int)
        for t in all_tax.data:
            tax_by_subject[t['subject']] += 1
        
        print(f"\n{'Asignatura':<25} {'Módulos':<15} {'Taxonomías':<15} {'Ratio':<10}")
        print("-" * 70)
        
        for module_subject in sorted(modules_by_subject.keys()):
            tax_subject = self.SUBJECT_MAPPER.get(module_subject, module_subject)
            mod_count = modules_by_subject[module_subject]
            tax_count = tax_by_subject.get(tax_subject, 0)
            ratio = f"{mod_count}/{tax_count}" if tax_count > 0 else "N/A"
            
            print(f"{module_subject:<25} {mod_count:<15} {tax_count:<15} {ratio:<10}")
        
        # Taxonomías sin módulos correspondientes
        print(f"\n" + "-" * 70)
        print("ASIGNATURAS EN TAXONOMÍAS SIN MÓDULOS EQUIVALENTES:")
        print("-" * 70)
        
        module_subjects_normalized = set(self.SUBJECT_MAPPER.get(s, s) for s in modules_by_subject.keys())
        tax_subjects_only = set(tax_by_subject.keys()) - module_subjects_normalized
        
        if tax_subjects_only:
            for subject in tax_subjects_only:
                print(f"  - {subject}: {tax_by_subject[subject]} taxonomías sin módulos")
        else:
            print("  (Todas las asignaturas tienen módulos correspondientes)")
    
    def analyze_link_quality_by_type(self):
        """Analiza la calidad de los links por tipo"""
        print("\n" + "=" * 70)
        print("ANÁLISIS DE CALIDAD POR TIPO DE LINK")
        print("=" * 70)
        
        # Cargar módulos y taxonomías primero
        modules_result = self.client.schema("kuneo").table("modules").select(
            "id, subject, core_concept, grade_range"
        ).limit(2000).execute()
        modules_dict = {m['id']: m for m in modules_result.data}
        
        taxonomies_result = self.client.schema("kuneo").table("curriculum_taxonomy").select(
            "id, subject, discipline, thematic, subthematic, grade_range"
        ).limit(2000).execute()
        taxonomies_dict = {t['id']: t for t in taxonomies_result.data}
        
        # Obtener sample de links por tipo
        for link_type in ['primary', 'secondary', 'related']:
            links_result = self.client.schema("kuneo").table("module_taxonomy_link").select(
                "id, link_type, module_id, taxonomy_id"
            ).eq("link_type", link_type).limit(5).execute()
            
            print(f"\n{link_type.upper()} LINKS - Primeros 5 ejemplos:")
            print("-" * 70)
            
            for link in links_result.data:
                module = modules_dict.get(link['module_id'])
                taxonomy = taxonomies_dict.get(link['taxonomy_id'])
                
                if not module or not taxonomy:
                    continue
                
                module_subject_norm = self.SUBJECT_MAPPER.get(module['subject'], module['subject'])
                match_indicator = "✓" if module_subject_norm == taxonomy['subject'] else "✗"
                
                print(f"\n{match_indicator} Módulo: {module['subject']} | {module['core_concept']} | {module['grade_range']}")
                print(f"  → Taxonomía: {taxonomy['subject']} | {taxonomy['discipline']} → {taxonomy['thematic']} | {taxonomy['grade_range']}")
    
    def run_full_analysis(self):
        """Ejecuta análisis completo"""
        print("\n" + "=" * 70)
        print("ANÁLISIS DE CALIDAD DE VINCULACIÓN TAXONOMÍAS-MÓDULOS")
        print("=" * 70)
        
        # 1. Cross-contamination
        no_contamination = self.analyze_cross_contamination()
        
        # 2. Taxonomías sin usar
        self.analyze_unused_taxonomies()
        
        # 3. Calidad por tipo de link
        self.analyze_link_quality_by_type()
        
        # Resumen final
        print("\n" + "=" * 70)
        print("RESUMEN FINAL")
        print("=" * 70)
        
        if no_contamination:
            print("\n✅ VINCULACIÓN CORRECTA: No hay cross-contamination entre asignaturas")
        else:
            print("\n❌ PROBLEMA DETECTADO: Hay cross-contamination que debe corregirse")
        
        print("\n📊 RECOMENDACIONES:")
        print("  1. Revisar por qué algunas taxonomías no tienen módulos equivalentes")
        print("  2. Considerar si ciertos microtópicos necesitan módulos dedicados")
        print("  3. Verificar que la granularidad de taxonomías coincide con módulos")


def main():
    analyzer = LinkQualityAnalyzer()
    analyzer.run_full_analysis()


if __name__ == "__main__":
    main()
