"""
ANÁLISIS COMPLETO DE DISTRIBUCIÓN DE LINKS
Usa paginación para cargar TODOS los 11,154 links
"""

import json
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import defaultdict

class FullLinkAnalyzer:
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
    
    def load_all_links(self):
        """Carga TODOS los links usando paginación"""
        print("Cargando todos los links...")
        all_links = []
        page_size = 1000
        page = 0
        
        while True:
            start = page * page_size
            end = start + page_size - 1
            
            result = self.client.schema("kuneo").table("module_taxonomy_link").select(
                "id, link_type, module_id, taxonomy_id"
            ).range(start, end).execute()
            
            if not result.data:
                break
            
            all_links.extend(result.data)
            print(f"  Cargados {len(all_links)} links...")
            page += 1
            
            if len(result.data) < page_size:
                break
        
        print(f"✅ Total links cargados: {len(all_links)}\n")
        return all_links
    
    def load_all_modules(self):
        """Carga TODOS los módulos"""
        print("Cargando todos los módulos...")
        all_modules = []
        page_size = 1000
        page = 0
        
        while True:
            start = page * page_size
            end = start + page_size - 1
            
            result = self.client.schema("kuneo").table("modules").select(
                "id, subject"
            ).range(start, end).execute()
            
            if not result.data:
                break
            
            all_modules.extend(result.data)
            page += 1
            
            if len(result.data) < page_size:
                break
        
        print(f"✅ Total módulos cargados: {len(all_modules)}\n")
        return {m['id']: m for m in all_modules}
    
    def load_all_taxonomies(self):
        """Carga TODAS las taxonomías"""
        print("Cargando todas las taxonomías...")
        all_taxonomies = []
        page_size = 1000
        page = 0
        
        while True:
            start = page * page_size
            end = start + page_size - 1
            
            result = self.client.schema("kuneo").table("curriculum_taxonomy").select(
                "id, subject, grade_range, discipline, thematic"
            ).range(start, end).execute()
            
            if not result.data:
                break
            
            all_taxonomies.extend(result.data)
            page += 1
            
            if len(result.data) < page_size:
                break
        
        print(f"✅ Total taxonomías cargadas: {len(all_taxonomies)}\n")
        return {t['id']: t for t in all_taxonomies}
    
    def analyze_distribution(self):
        """Analiza distribución completa de links"""
        print("=" * 80)
        print("ANÁLISIS COMPLETO DE DISTRIBUCIÓN DE LINKS")
        print("=" * 80 + "\n")
        
        # Cargar todos los datos
        links = self.load_all_links()
        modules = self.load_all_modules()
        taxonomies = self.load_all_taxonomies()
        
        # Estadísticas por asignatura del módulo
        stats_by_module_subject = defaultdict(lambda: {
            'total_links': 0,
            'by_link_type': defaultdict(int),
            'by_taxonomy_subject': defaultdict(int),
            'unique_modules': set(),
            'unique_taxonomies': set()
        })
        
        # Procesar links
        print("Procesando links...")
        cross_contamination_count = 0
        
        for link in links:
            module = modules.get(link['module_id'])
            taxonomy = taxonomies.get(link['taxonomy_id'])
            
            if not module or not taxonomy:
                continue
            
            module_subject = module['subject']
            taxonomy_subject = taxonomy['subject']
            module_subject_normalized = self.SUBJECT_MAPPER.get(module_subject, module_subject)
            
            # Verificar cross-contamination
            if module_subject_normalized != taxonomy_subject:
                cross_contamination_count += 1
            
            # Estadísticas
            stats = stats_by_module_subject[module_subject]
            stats['total_links'] += 1
            stats['by_link_type'][link['link_type']] += 1
            stats['by_taxonomy_subject'][taxonomy_subject] += 1
            stats['unique_modules'].add(link['module_id'])
            stats['unique_taxonomies'].add(link['taxonomy_id'])
        
        print("\n" + "=" * 80)
        print("DISTRIBUCIÓN COMPLETA POR ASIGNATURA")
        print("=" * 80 + "\n")
        
        for module_subject in sorted(stats_by_module_subject.keys()):
            stats = stats_by_module_subject[module_subject]
            
            print(f"{module_subject.upper()}")
            print("-" * 80)
            print(f"  Total links: {stats['total_links']}")
            print(f"  Módulos únicos vinculados: {len(stats['unique_modules'])}")
            print(f"  Taxonomías únicas vinculadas: {len(stats['unique_taxonomies'])}")
            
            print(f"\n  Por tipo de link:")
            for link_type, count in sorted(stats['by_link_type'].items()):
                percentage = (count / stats['total_links']) * 100
                print(f"    {link_type}: {count} ({percentage:.1f}%)")
            
            print(f"\n  Links a taxonomías (por subject):")
            for tax_subject, count in sorted(stats['by_taxonomy_subject'].items(), key=lambda x: x[1], reverse=True):
                percentage = (count / stats['total_links']) * 100
                marker = "✓" if tax_subject == self.SUBJECT_MAPPER.get(module_subject, module_subject) else "✗"
                print(f"    {marker} {tax_subject}: {count} ({percentage:.1f}%)")
            
            print()
        
        # Resumen de cobertura
        print("=" * 80)
        print("RESUMEN DE COBERTURA")
        print("=" * 80 + "\n")
        
        # Contar módulos totales por subject
        modules_count_by_subject = defaultdict(int)
        for module in modules.values():
            modules_count_by_subject[module['subject']] += 1
        
        # Contar taxonomías totales por subject
        taxonomies_count_by_subject = defaultdict(int)
        for taxonomy in taxonomies.values():
            taxonomies_count_by_subject[taxonomy['subject']] += 1
        
        print(f"{'Asignatura (módulos)':<30} {'Módulos':<12} {'Vinculados':<12} {'Cobertura':<12}")
        print("-" * 80)
        
        for module_subject in sorted(modules_count_by_subject.keys()):
            total_modules = modules_count_by_subject[module_subject]
            stats = stats_by_module_subject.get(module_subject, {})
            linked_modules = len(stats.get('unique_modules', set()))
            coverage = (linked_modules / total_modules * 100) if total_modules > 0 else 0
            
            print(f"{module_subject:<30} {total_modules:<12} {linked_modules:<12} {coverage:.1f}%")
        
        print()
        print(f"{'Asignatura (taxonomías)':<30} {'Taxonomías':<12} {'Vinculadas':<12} {'Cobertura':<12}")
        print("-" * 80)
        
        for tax_subject in sorted(taxonomies_count_by_subject.keys()):
            total_tax = taxonomies_count_by_subject[tax_subject]
            
            # Contar taxonomías vinculadas a este subject
            linked_tax = set()
            for module_subject, stats in stats_by_module_subject.items():
                module_subject_normalized = self.SUBJECT_MAPPER.get(module_subject, module_subject)
                if module_subject_normalized == tax_subject:
                    linked_tax.update(stats['unique_taxonomies'])
            
            coverage = (len(linked_tax) / total_tax * 100) if total_tax > 0 else 0
            
            print(f"{tax_subject:<30} {total_tax:<12} {len(linked_tax):<12} {coverage:.1f}%")
        
        # Cross-contamination
        print("\n" + "=" * 80)
        print("VERIFICACIÓN DE CROSS-CONTAMINATION")
        print("=" * 80 + "\n")
        
        if cross_contamination_count > 0:
            print(f"❌ ENCONTRADOS {cross_contamination_count} links con cross-contamination")
        else:
            print(f"✅ NO se encontró cross-contamination")
            print("   Todos los links conectan asignaturas correctamente")
        
        # Resumen final
        print("\n" + "=" * 80)
        print("RESPUESTA A LAS PREGUNTAS DEL USUARIO")
        print("=" * 80 + "\n")
        
        print("1. ¿Se mezclan materias como con la inferencia de conceptos?")
        if cross_contamination_count == 0:
            print("   ✅ NO - La vinculación está correcta, no hay mezcla de materias\n")
        else:
            print(f"   ❌ SÍ - Hay {cross_contamination_count} links con cross-contamination\n")
        
        print("2. ¿Por qué solo 502 de 1570 taxonomías (32%) están vinculadas?")
        print("   Razones identificadas:")
        
        # Analizar gaps
        for tax_subject in sorted(taxonomies_count_by_subject.keys()):
            total_tax = taxonomies_count_by_subject[tax_subject]
            
            # Buscar módulo subject correspondiente
            corresponding_module_subject = None
            for ms, ts in self.SUBJECT_MAPPER.items():
                if ts == tax_subject:
                    corresponding_module_subject = ms
                    break
            
            if corresponding_module_subject:
                total_modules = modules_count_by_subject.get(corresponding_module_subject, 0)
                stats = stats_by_module_subject.get(corresponding_module_subject, {})
                linked_tax_count = len(stats.get('unique_taxonomies', set()))
                
                if total_modules == 0:
                    print(f"   ❌ {tax_subject}: {total_tax} taxonomías pero NO HAY MÓDULOS")
                elif linked_tax_count < total_tax:
                    gap = total_tax - linked_tax_count
                    print(f"   ⚠️  {tax_subject}: {gap} taxonomías sin vincular de {total_tax} "
                          f"({total_modules} módulos disponibles)")
            else:
                print(f"   ❌ {tax_subject}: {total_tax} taxonomías pero NO tiene mapper a módulos")


def main():
    analyzer = FullLinkAnalyzer()
    analyzer.analyze_distribution()


if __name__ == "__main__":
    main()
