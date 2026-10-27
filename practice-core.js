(function(root){
 'use strict';
 const normalize=s=>String(s).normalize('NFKC').trim().toLowerCase().replace(/[−–]/g,'-').replace(/[\s.,:;()]/g,'');
 function parseNumbers(input){
  return String(input).trim().split(/[,;\n]+/).map(part=>{
   const s=part.trim().replace(/[−–]/g,'-').replace(/^[a-z]\)\s*/i,'');
   const match=s.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*([^\d]*)$/i);
   if(!match||!Number.isFinite(Number(match[1])))return NaN;
   return Number(match[1]);
  });
 }
 function grade(input,key){
  if(!String(input).trim())return {status:'invalid',message:'Type an answer before submitting.'};
  if(!key)return {status:'ungraded',message:'Attempt saved. This response needs comparison with the original solution; it has not been marked wrong.'};
  if(key.kind==='text'){
   const v=normalize(input),letter=String(input).trim().match(/^([a-z])[.)\s]/i);
   const ok=key.accepted.some(a=>normalize(a)===v||(letter&&normalize(a)===letter[1].toLowerCase()));
   return {status:ok?'correct':'incorrect',message:ok?'Correct. You can open Answers to review the working.':'That does not match the checked answer. Review your setup and try again.'};
  }
  if(key.kind==='numeric'){
   const values=parseNumbers(input);
   if(values.length!==key.values.length||values.some(Number.isNaN))return {status:'invalid',message:`Enter ${key.values.length} numeric value${key.values.length===1?'':'s'}, separated by commas, in the requested units. Use e for powers of ten.`};
   const match=expected=>values.every((v,i)=>Math.abs(v-expected[i])<=Math.max(key.absoluteTolerance??1e-6,Math.abs(expected[i])*(key.relativeTolerance??.02)));
   const ok=[key.values,...(key.alternatives||[])].some(match);
   return {status:ok?'correct':'incorrect',message:ok?'Correct within the stated rounding tolerance. Open Answers to review the working.':'That does not match the checked answer. Check your signs, units, and rounding.'};
  }
  return {status:'ungraded',message:'Attempt saved for comparison with the source solution.'};
 }
 const fresh=()=>({attempts:[],draft:'',revealed:false});
 const unlocked=s=>s.attempts.length>=2||s.attempts.some(a=>a.status==='correct');
 function submit(state,input,key){
  const s={...state,attempts:[...state.attempts]};
  if(unlocked(s))return {state:s,status:'locked',message:'This round is complete. Open Answers or start another round.'};
  const result=grade(input,key);
  if(result.status==='invalid')return {state:s,...result};
  if(s.attempts.some(a=>normalize(a.value)===normalize(input)))return {state:s,status:'invalid',message:'You already tried that answer. Revise it before using your second attempt.'};
  s.attempts.push({value:String(input).trim(),status:result.status});s.draft=String(input);
  return {state:s,...result};
 }
 function answerParts(e){
  const key=e.answerKey;
  if(e.answerParts?.length)return e.answerParts.map(p=>{
   const part=typeof p==='string'?{label:p}:p;
   return {...part,keyIndex:Number.isInteger(part.keyIndex)?part.keyIndex:null};
  });
  if(key?.kind==='numeric')return key.values.map((_,i)=>({label:key.labels?.[i]||`Answer ${i+1}`,keyIndex:i}));
  return [{label:'Your answer',keyIndex:key?0:null}];
 }
 function partKey(e,part){
  const key=e.answerKey,i=part.keyIndex;
  if(!key||i===null)return null;
  if(key.kind!=='numeric')return i===0?key:null;
  if(i<0||i>=key.values.length)return null;
  return {...key,values:[key.values[i]],alternatives:(key.alternatives||[]).map(a=>[a[i]])};
 }
 function partDrafts(e,s){
  const parts=answerParts(e);
  if(Array.isArray(s.drafts)&&s.drafts.length===parts.length)return [...s.drafts];
  const old=String(s.draft||'');
  if(parts.length===1)return [old];
  const legacy=old.split(/[,;\n]+/);
  if(e.answerKey?.kind==='numeric'&&legacy.length===e.answerKey.values.length)
   return parts.map(p=>p.keyIndex===null?'':legacy[p.keyIndex]?.trim()||'');
  return parts.map((_,i)=>i===0?old:'');
 }
 function submitParts(state,values,e){
  const parts=answerParts(e),s={...state,attempts:[...state.attempts]};
  if(unlocked(s))return {state:s,status:'locked',message:'This round is complete. Open Answers or start another round.'};
  if(!Array.isArray(values)||values.length!==parts.length)return {state:s,status:'invalid',message:'Enter one answer in each labeled box.',results:[]};
  const results=values.map((v,i)=>grade(v,partKey(e,parts[i])));
  if(results.some(r=>r.status==='invalid'))return {state:s,status:'invalid',message:'Check the highlighted answer boxes. No attempt was used.',results:results.map(r=>r.status==='invalid'?r:{status:'pending',message:''})};
  const joined=values.map(v=>String(v).trim()).join(', ');
  if(s.attempts.some(a=>Array.isArray(a.parts)?a.parts.length===values.length&&a.parts.every((v,i)=>normalize(v)===normalize(values[i])):normalize(a.value)===normalize(joined)))
   return {state:s,status:'invalid',message:'You already tried these answers. Revise at least one before using your second attempt.',results:[]};
  let status=results.some(r=>r.status==='incorrect')?'incorrect':results.some(r=>r.status==='ungraded')?'ungraded':'correct';
  // Alternative numeric tuples are checked together, so mixed branches cannot pass.
  const indices=parts.map(p=>p.keyIndex);
  if(status==='correct'&&e.answerKey?.kind==='numeric'&&indices.length===e.answerKey.values.length&&new Set(indices).size===indices.length){
   const ordered=e.answerKey.values.map((_,i)=>values[indices.indexOf(i)]);
   if(grade(ordered.join(', '),e.answerKey).status!=='correct'){
    status='incorrect';results.forEach(r=>{r.status='incorrect';r.message='These values do not form one accepted solution. Check the combination.'});
   }
  }
  s.attempts.push({value:joined,parts:values.map(String),results,status});s.drafts=values.map(String);s.draft=joined;
  const message=status==='correct'?'All answers are correct within the stated tolerance. Open Answers to review the working.':status==='incorrect'?'Review the feedback beside each answer. Correct entries can stay as they are.':'Answers saved. Parts without a checked key need comparison with the original slides.';
  return {state:s,status,message,results};
 }
 const api={normalize,parseNumbers,grade,fresh,unlocked,submit,answerParts,partKey,partDrafts,submitParts};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PracticeCore=api;
})(typeof window!=='undefined'?window:this);
