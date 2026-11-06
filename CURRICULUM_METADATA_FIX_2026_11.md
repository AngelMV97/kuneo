# Corrección de metadatos curriculares — 3 de noviembre de 2026

La competencia de Inglés `1a68a9fb-28f2-4b41-bb2c-8fa96cb2dadb` contiene «entorno inmediato». El normalizador histórico usaba `keyword in text`: encontraba `media` dentro de `inmediato`, infería `estadistica` y añadía un error sobre promedios. La búsqueda híbrida incorporó esas etiquetas como coincidencias textuales y amplificó el problema. Los errores comunes no formaban parte del texto buscado, pero compartían la misma causa de derivación.

Cambios:
- Normalizador: límites de palabra y reglas de contexto para estadística; no toma frecuencia habitual, datos personales o mediana longitud como evidencia suficiente.
- Servidor: contrasta las etiquetas y errores heurísticos conocidos con el texto original al leer el catálogo; conserva el enunciado, evidencias, ejemplo, IDs y grados. Las etiquetas desconocidas se conservan para visualización, pero no producen por sí solas una coincidencia textual.
- La competencia de la captura ya no muestra los metadatos erróneos al abrirla desde Competencias. La búsqueda no excluye asignaturas completas: Ciencias Sociales y Ciencias pueden tratar datos y gráficos.

Consulta real con OpenAI y Supabase: «estadistica» devuelve 47 coincidencias, 38 de Matemáticas, 7 de Ciencias y 2 de Ciencias Sociales. No se suman resultados de Inglés por los falsos indicios examinados. Energía mantiene 27 y función/funciones 69. Fracciones baja de 98 a 70 al eliminar etiquetas sustentadas solo por fragmentos como `parte` dentro de otras palabras. Son cifras de recuperación, no una certificación pedagógica de todas las coincidencias.

36 pruebas del servidor y regresiones directas del normalizador Python aprobadas. No hubo cambios de interfaz en esta corrección. El inventario local `reports/curriculum-metadata-audit.json` registra 508 filas donde las heurísticas conservadoras descartan algún metadato conocido; no significa que 508 competencias completas estén equivocadas. Los datos originales se conservan.

No se ejecutó ninguna escritura en Supabase ni se regeneraron embeddings. Basta reiniciar el servidor para invalidar su caché. Otros consumidores que lean directamente los campos originales todavía pueden ver esos metadatos: sanear físicamente el catálogo y revisar los casos ambiguos es un trabajo posterior, que debe conservar IDs y revisar las propuestas antes de escribir. No conviene reimportar el normalizador completo: genera UUID nuevos y rompería las asociaciones existentes.
