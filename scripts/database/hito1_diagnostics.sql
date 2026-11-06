-- Hitos 0–1: diagnóstico opcional, solo lectura. No cambia RLS ni tablas.
select subject, grade_range, source, count(*) as competencias,
       count(*) filter (where embedding is null) as sin_embedding
from kuneo.competency_units group by subject, grade_range, source
order by subject, grade_range, source;

select count(*) as modulos,
       count(*) filter (where c.id is not null) as vinculados,
       count(*) filter (where m.source_unit_id is not null and c.id is null) as referencias_huerfanas
from kuneo.modules m left join kuneo.competency_units c on c.id = m.source_unit_id;

-- El vector no acredita por sí solo el modelo o la fecha de generación.
select vector_dims(embedding) as dimensiones, count(*)
from kuneo.competency_units where embedding is not null group by vector_dims(embedding);

-- Revisar la versión instalada de la RPC sin ejecutarla ni modificarla.
select pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='kuneo' and p.proname='search_competency_units';
