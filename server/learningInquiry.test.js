const {test}=require('node:test'),assert=require('node:assert/strict');
const {inquiryPlan,validateInquiry,CASES}=require('./learningInquiry');
const {cleanActivityPresentation,validatePresentation}=require('./learningPresentation');
const moduleFixture={subject:'natural_sciences',core_concept:'ciencias_naturales',learning_objective:'Formulo hipótesis con base en el conocimiento cotidiano, teorías y modelos científicos.'};
test('generic inquiry uses eight independent briefs; specific scientific content and other subjects remain unchanged',()=>{
 assert.equal(new Set(Array.from({length:8},(_,i)=>inquiryPlan(moduleFixture,7,i).id)).size,8);
 assert.ok(inquiryPlan({...moduleFixture,learning_objective:'Formulo hipótesis, con base en el conocimiento cotidiano, teorías y modelos científicos'},9,0));
 for(const changed of [{subject:'english'},{core_concept:'evaporacion'},{learning_objective:'Explico la evaporación y comparo variables.'},{learning_objective:'Formulo hipótesis sobre las causas de extinción de un grupo taxonómico.'}])assert.equal(inquiryPlan({...moduleFixture,...changed},7,0),null);
 for(let i=0;i<8;i++){const plan=inquiryPlan(moduleFixture,7,i);assert.ok(/simulad/i.test(plan.data));assert.doesNotThrow(()=>validateInquiry({question:`En un caso con ${plan.anchor}, se revisan los registros.`},plan));assert.throws(()=>validateInquiry({question:'Tres vasos al sol tienen distintos líquidos.'},plan),/Invalid inquiry context/);}
 assert.equal(CASES.length,8);
 const raw={question:'Se observa cómo absorbe agua el papel.'},fixed=validateInquiry(raw,inquiryPlan(moduleFixture,7,0));assert.ok(fixed.question.startsWith('Caso simulado.'));assert.equal(raw.question,'Se observa cómo absorbe agua el papel.');
 assert.throws(()=>validateInquiry({question:'Se registra el sonido detectado: sí, no.'},inquiryPlan(moduleFixture,7,3)),/no inventes resultados/);
});
test('matching refuses the two-column answer/third-relation table shown in the report, including paraphrased copies',()=>{
 const first='| Recipiente | Nivel inicial | Nivel final |\n| --- | --- | --- |\n| 1 | 600 | 400 |\n| 2 | 600 | 500 |';
 const controls={type:'matching',left_items:['Recipiente 1','Recipiente 2'],right_items:['El nivel bajó mucho.','El nivel bajó poco.']};
 for(const description of ['A. El nivel bajó mucho.','A. Gran descenso del nivel.']){
 const a={...controls,question:first+'\n\n| Cambios en el nivel | Hipótesis explicativa |\n| --- | --- |\n| '+description+' | 1. Una causa posible. |\n| B. El nivel bajó poco. | 2. Otra causa posible. |\n\nRelaciona los recipientes con los cambios y las hipótesis.'};assert.throws(()=>cleanActivityPresentation(a),/Invalid activity presentation/);
 }
 assert.doesNotThrow(()=>cleanActivityPresentation({...controls,question:first+'\n\nRelaciona los recipientes con el cambio registrado.'}));
});
test('matching refuses solution assignments, model instructions, grouped tasks and unsupported triple relations',()=>{
 const a={type:'matching',question:'Relaciona cada explicación con una revisión verificable.',left_items:['Estudiante A','Estudiante B'],right_items:['Repite la medición.','Verifica las condiciones.']};
 for(const s of ['Repite la medición. (Asignado a Estudiante A)','Estudiante A (error) o revisión a considerar?\n(No repetir a la misma izquierda)','Nota interna para el generador: corregir esto.','Respuesta correcta: estudiante B'])assert.throws(()=>validatePresentation({...a,right_items:[s,'Otra opción.']}),/Invalid activity presentation/);
 assert.throws(()=>validatePresentation({...a,question:'Relaciona cada estudiante con la fortaleza de su explicación y un posible error que debe revisar.'}),/varias relaciones/);
 assert.doesNotThrow(()=>validatePresentation(a));
});
test('provider deadline aborts have a fixed diagnostic category instead of unknown',()=>{
 const {failureReason}=require('./learningFailures');assert.equal(failureReason(Error('Request was aborted.')),'timeout');assert.equal(failureReason(Error('Request timed out.')),'timeout');
});
