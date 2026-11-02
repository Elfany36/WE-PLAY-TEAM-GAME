import factData from '../data/question-facts.json' with {type:'json'};
import taskData from '../data/code-tasks.json' with {type:'json'};
export type CodeTask={id:string;topic:string;difficulty?:string;prompt:string;code:string;answer:string;alternatives?:string[];explanation:string;source:string};
export type Fact={id:string;label:string;description:string;source:string;kind:string;referenceId:string};
export type Question={id:string;format:'blank'|'choice'|'matching';prompt:string;code?:string;choices?:{id:string;label:string}[];items?:{id:string;label:string}[];answer:string|string[];alternatives?:string[];explanation:string;source:string;sources?:string[];referenceId?:string};
export const facts:Fact[]=factData as Fact[];
export const codeTasks:CodeTask[]=taskData as CodeTask[];
export const bankStats={facts:facts.length,questionVariants:facts.length*3,codeTasks:codeTasks.length,matching:'Seeded groups of four source-backed facts',cutoff:'29 October 2026'};
export function rng(seed:number){let a=seed|0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function shuffle<T>(a:T[],random:()=>number){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b;}
export function normalizeAnswer(x:unknown){return String(x??'').normalize('NFKC').trim().replace(/^<\/?([\w-]+)>$/,'$1').replace(/^['"]|['"]$/g,'').replace(/;$/,'').trim().toLowerCase();}
export function isCorrect(q:Question,answer:unknown){if(typeof answer!=='string'&&!Array.isArray(answer))return false;if(Array.isArray(q.answer))return Array.isArray(answer)&&q.answer.length===answer.length&&q.answer.every((v,i)=>v===answer[i]);return typeof answer==='string'&&[q.answer,...q.alternatives||[]].some(x=>normalizeAnswer(x)===normalizeAnswer(answer));}
// Hide self-identifying names in question stems; keep the complete source definition in feedback.
export function questionDefinition(f:Fact){
 const bare=f.label.replace(/\s*\(.*\)$/,'').replace(/[<>]/g,'');
 const escaped=bare.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 if(bare.length<3&&!['px','em','fr','vh','vw','ms','ch'].includes(bare)&&['HTML element','CSS value','CSS selector'].includes(f.kind))return f.description.replace(new RegExp('(^|[^\\w-])<?'+escaped+'>?(?=\\s+(?:HTML\\s+)?element\\b)','gi'),'$1[identifier]');
 return f.description.replace(new RegExp('(^|[^\\w-])'+escaped+'(?=$|[^\\w-])','gi'),'$1[identifier]');
}
export function publicQuestion(q:Question){const {answer,alternatives,explanation,source,sources,...publicPart}=q;return publicPart;}
export type GameMode='blanks'|'survival'|'quiz';
const orderCache=new Map<string,(Fact|CodeTask)[]>();
function questionOrder<T extends Fact|CodeTask>(key:string,pool:T[],seed:number):T[]{
 const known=orderCache.get(key);if(known)return known as T[];
 const order=shuffle(pool,rng(seed));if(orderCache.size>=32)orderCache.delete(orderCache.keys().next().value!);orderCache.set(key,order);return order;
}
const questionCache=new Map<string,Question>();
/** A question stays identical until its seed/index changes; never cache player state. */
export function questionAt(seed:number,index:number,mode:GameMode,topic='All'):Question{
 const key=JSON.stringify([seed,index,mode,topic]);let question=questionCache.get(key);
 if(!question){question=buildQuestion(seed,index,mode,topic);if(questionCache.size>=256)questionCache.delete(questionCache.keys().next().value!)}
 else questionCache.delete(key);
 questionCache.set(key,question);
 // Consumers may edit answer/choice arrays without corrupting subsequent rooms.
 return structuredClone(question);
}
function buildQuestion(seed:number,index:number,mode:GameMode,topic:string):Question{
 const random=rng((seed+Math.imul(index+1,131071))|0);
 if(mode!=='quiz'){
  const pool=codeTasks.filter(x=>topic==='All'||x.topic===topic);if(!pool.length)throw Error('No code tasks available');
  const order=questionOrder('code:'+seed+':'+topic,pool,seed);const t=order[index%order.length];
  return {id:'code:'+t.id+':'+index+':seed:'+seed,format:'blank',prompt:t.prompt,code:t.code,answer:t.answer,alternatives:t.alternatives,explanation:t.explanation,source:t.source};
 }
 const pool=facts.filter(f=>topic==='All'||f.kind.startsWith(topic));
 if(pool.length<4)throw Error('Not enough facts for this topic');
 const order=questionOrder('quiz:'+seed+':'+topic,pool,seed),fact=order[index%order.length];const format=(['choice','blank','matching'] as const)[Math.floor(random()*3)];
 const distractors=shuffle(pool.filter(f=>f.id!==fact.id&&f.kind===fact.kind&&f.label!==fact.label),random);const fallback=shuffle(pool.filter(f=>f.id!==fact.id&&f.label!==fact.label),random);
 const options=[fact,...(distractors.length>=3?distractors:fallback).slice(0,3)];const keys=options.map(()=>Math.floor(random()*0xffffffff).toString(36));
 if(format==='blank')return {id:'fact:'+fact.id+':blank:'+index+':seed:'+seed,format,prompt:'Name the '+fact.kind.toLowerCase()+' described below. Include a parent/context in parentheses when needed.\n\n'+questionDefinition(fact),answer:fact.label,alternatives:[fact.label.replace(/[<>]/g,''),fact.label.replace(/ \(.*\)$/,'').replace(/[<>]/g,'')],explanation:fact.label+' — '+fact.description,source:fact.source,referenceId:fact.referenceId};
 if(format==='choice')return {id:'fact:'+fact.id+':choice:'+index+':seed:'+seed,format,prompt:'Which '+fact.kind.toLowerCase()+' matches this definition?\n\n'+questionDefinition(fact),choices:shuffle(options.map((f,i)=>({id:keys[i],label:f.label})),random),answer:keys[0],explanation:fact.label+' — '+fact.description,source:fact.source,referenceId:fact.referenceId};
 return {id:'fact:'+fact.id+':matching:'+index+':seed:'+seed,format,prompt:'Match each identifier to its source definition. Use each definition once.',items:options.map((f,i)=>({id:'i'+i,label:f.label})),choices:shuffle(options.map((f,i)=>({id:keys[i],label:questionDefinition(f)})),random),answer:keys,explanation:options.map(f=>f.label+' — '+f.description).join('\n\n'),source:fact.source,sources:[...new Set(options.map(f=>f.source))],referenceId:fact.referenceId};
}
