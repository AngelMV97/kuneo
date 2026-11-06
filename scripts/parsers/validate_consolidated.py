import json
from collections import Counter
from pathlib import Path

# Cargar archivo consolidado
file_path = Path(__file__).parent.parent.parent / 'data' / 'processed' / 'normalized' / 'competency_units' / 'all_competency_units.json'

with open(file_path, encoding='utf-8') as f:
    data = json.load(f)

# Contar por fuente
dbas = [u for u in data if u['source'] == 'dba']
standards = [u for u in data if u['source'] == 'standard']

print("=" * 60)
print("📊 RESUMEN ARCHIVO CONSOLIDADO")
print("=" * 60)
print(f"\nTotal: {len(data)} competency units")
print(f"  DBAs: {len(dbas)}")
print(f"  Estándares: {len(standards)}")

# Por materia
print("\n📚 Por materia:")
subjects = Counter([u['curriculum']['subject'] for u in data])
for subject, count in sorted(subjects.items()):
    subject_dbas = len([u for u in data if u['curriculum']['subject'] == subject and u['source'] == 'dba'])
    subject_standards = len([u for u in data if u['curriculum']['subject'] == subject and u['source'] == 'standard'])
    print(f"  {subject}:")
    print(f"    Total: {count}")
    print(f"    DBAs: {subject_dbas}, Estándares: {subject_standards}")

# Por grupo de grados (estándares)
print("\n📅 Estándares por grupo de grados:")
grade_ranges = Counter([u['curriculum'].get('grade_range') for u in standards if u['curriculum'].get('grade_range')])
for grade_range, count in sorted(grade_ranges.items()):
    print(f"  {grade_range}: {count}")

# Por grado (DBAs)
print("\n📅 DBAs por grado:")
grades = Counter([u['curriculum'].get('grade_range') for u in dbas if u['curriculum'].get('grade_range')])
for grade, count in sorted(grades.items(), key=lambda x: int(x[0]) if x[0] and x[0].isdigit() else 0):
    print(f"  Grado {grade}: {count}")

print("\n" + "=" * 60)
print("✅ Validación completada!")
print("=" * 60)
