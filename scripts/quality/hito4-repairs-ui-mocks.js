// Private browser fixture. Only authored synthetic answers are accepted here.
const fixture=globalThis.repairFixture={index:0,packet:null,pending:null,saved:null};
export const supabase={auth:{async getSession(){return {data:{session:{user:{id:'repair-synthetic-user'}}}};},onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}};}}};
export const dimensionInfo=[{id:'comprension',name:'Comprensión'},{id:'razonamiento',name:'Razonamiento'},{id:'metacognicion',name:'Metacognición'}];
export const modules={async getModule(){return fixture.packet.module;}};
export const learningApi={
 async activity(){return fixture.pending;},async resume(){return {...fixture.pending,feedback:fixture.saved};},
 async answer({answer}){
  if(answer!==fixture.packet.answer)throw Error('Esta vista solo comprueba la respuesta sintética documentada.');
  fixture.saved={...fixture.packet.feedback,success:true,attemptId:`repair-attempt-${fixture.index}`,submittedAnswer:answer,complete:false};return fixture.saved;
 },
 async hint(token,level){return {token,level,hints_used:level,hint:fixture.packet.activity.hint,card:level>1?fixture.packet.supports[level-2]:null};},
 async finishPractice(){return {overview:'Vista de revisión del piloto.',strengths:[],improvements:[],nextSteps:[],seconds:0,hints:0,correct:1,partial:0,incorrect:0};}
};
