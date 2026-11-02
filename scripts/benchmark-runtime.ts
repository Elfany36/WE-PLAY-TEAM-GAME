import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {questionAt} from '../lib/question-bank.ts';
import {createArena,applyAction,publicArena} from '../lib/arena-engine.ts';

// Repeatable CPU samples, not timing assertions: compare on the same host.
function sample(name:string,run:()=>unknown,count:number){
 for(let i=0;i<20;i++)run();
 const timings:number[]=[];let result:unknown;
 for(let round=0;round<5;round++){
  const start=performance.now();for(let i=0;i<count;i++)result=run();
  timings.push((performance.now()-start)/count);
 }
 timings.sort((a,b)=>a-b);
 return{name,iterations:count,medianMs:timings[2],digest:createHash('sha256').update(JSON.stringify(result)).digest('hex')};
}
let arena=createArena('ABCDEFGH','host','private','Host',1000);
arena=applyAction(arena,{action:'configure',mode:'quiz',topic:'All'},'host',1000).state;
arena=applyAction(arena,{action:'start',seed:73519},'host',1000).state;
console.log(JSON.stringify([
 sample('quiz question, unchanged index',()=>questionAt(73519,17,'quiz','All'),1000),
 sample('quiz private room projection',()=>publicArena(arena,'host',2000),1000),
],null,2));
