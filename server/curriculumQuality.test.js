const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanRow, contains } = require('./curriculumQuality');
const { prepare, rank } = require('./competencySearch');
test('inmediato cannot create media tags or mean misconceptions; source remains intact',()=>{
 const row={id:'english',subject:'english',grade_range:'1',content:{competency:'Comprende su entorno inmediato (casa y escuela)',concepts:['estadistica','lectura_inferencial'],misconceptions:['confundir promedio con valor representativo en todos los casos']}};
 const cleaned=cleanRow(row);
 assert.equal(cleaned.content.concepts.includes('estadistica'),false);
 assert.deepEqual(cleaned.content.misconceptions,[]);
 assert.equal(row.content.concepts.includes('estadistica'),true);
 assert.equal(rank([prepare(row)],'estadistica',{},[]).length,0);
 assert.equal(contains('entorno inmediato','media'),false);
});
test('genuine statistics stays searchable across subjects, including accented plural graph cues',()=>{
 const rows=[{id:'math',subject:'mathematics',grade_range:'4-5',content:{competency:'Organizo datos en tablas',concepts:['estadistica']}}, {id:'social',subject:'social_studies',grade_range:'8-9',content:{competency:'Interpreto gráficos de población',concepts:['estadistica']}}];
 assert.equal(rank(rows.map(prepare),'estadística',{},[]).length,2);
 assert.equal(rank(rows.map(prepare),'estadistica',{subject:'social_studies'},[])[0].id,'social');
});
test('unverified arbitrary concepts cannot create lexical matches',()=>{
 const row={id:'x',content:{competency:'Saludo a mis compañeros',concepts:['estadistica','etiqueta_inventada'],misconceptions:[]}};
 assert.equal(rank([prepare(row)],'estadistica',{},[]).length,0);
 assert.equal(rank([prepare(row)],'etiqueta inventada',{},[]).length,0);
});
test('frecuencia of writing, personal data and medium-length texts are not statistical evidence',()=>{
 for(const competency of ['Uso palabras con frecuencia','Escribo datos personales como nombre','Comprendo textos de mediana extensión','Redacto textos de mediana longitud']){
 const row={id:competency,content:{competency,concepts:['estadistica'],misconceptions:['pensar que la mediana siempre es igual al promedio']}};
 assert.equal(cleanRow(row).content.concepts.includes('estadistica'),false);
 assert.deepEqual(cleanRow(row).content.misconceptions,[]);
 }
});
