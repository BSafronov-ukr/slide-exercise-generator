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
 const api={normalize,parseNumbers,grade,fresh,unlocked,submit};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PracticeCore=api;
})(typeof window!=='undefined'?window:this);
