import type {CasualState} from './engine.ts';
import {CasualError} from './error.ts';
import {finishBattle} from './hidden-battle.ts';
import {appendChat,chatText} from '../room-chat.ts';
import {SKETCH_WORDS,BOT_SKETCH_WORDS,sketchMatches,normalizeGuess} from './sketch-words.ts';

export const SKETCH_COLORS=['#243346','#ffffff','#e14f64','#f29a48','#f3cc4d','#65b96d','#3e9f93','#509bd5','#7463bf','#b76ba8','#8a604b','#9da7b1'] as const;
export const MAX_SKETCH_POINTS=6000,MAX_SKETCH_STROKES=256;
export type SketchStroke={id:string;color:string;size:number;points:number[];seq:number;closed:boolean};
export type SketchGame={kind:'sketch';stage:'choose'|'draw'|'reveal';ids:string[];artistId:string;currentId:string;turn:number;cycle:number;cycles:number;seconds:number;deadline:number;startedAt:number;choices:string[];word:string;used:string[];eligible:string[];guessed:Record<string,{at:number;points:number}>;scores:Record<string,number>;strokes:SketchStroke[];canvasEpoch:number;pointCount:number;feedback:Record<string,{at:number;text:string}>;guessAt:Record<string,number>;revealedLetters:number[];hintAt:number;artistAwarded:boolean};
const participants=(s:CasualState)=>s.players.filter(p=>!p.retired&&p.role!=='spectator');
function random(s:CasualState){let x=s.random||1;x^=x<<13;x^=x>>>17;x^=x<<5;s.random=x>>>0;return s.random/4294967296}
function event(s:CasualState,text:string,now:number){s.events=[...s.events.slice(-11),{id:++s.eventId,text,at:now}]}
function choices(s:CasualState,g:SketchGame){
 let pool=SKETCH_WORDS.filter(w=>(!s.settings.sketchCategory||s.settings.sketchCategory==='all'||w.category===s.settings.sketchCategory)&&!g.used.includes(w.word));
 if(pool.length<3){g.used=[];pool=SKETCH_WORDS.filter(w=>!s.settings.sketchCategory||s.settings.sketchCategory==='all'||w.category===s.settings.sketchCategory)}
 const result:string[]=[];if(s.players.find(p=>p.id===g.artistId)?.bot){const templates=pool.filter(w=>BOT_SKETCH_WORDS.includes(w.word));if(templates.length)result.push(templates[Math.floor(random(s)*templates.length)].word)}
 while(result.length<3&&pool.length){const i=Math.floor(random(s)*pool.length),[entry]=pool.splice(i,1);if(!result.includes(entry.word))result.push(entry.word)}return result;
}
function beginTurn(s:CasualState,g:SketchGame,now:number){
 g.stage='choose';g.artistId=g.ids[(g.turn-1)%g.ids.length];g.currentId=g.artistId;g.cycle=Math.floor((g.turn-1)/g.ids.length)+1;g.deadline=now+15000;g.startedAt=0;g.word='';g.guessed={};g.strokes=[];g.canvasEpoch++;g.pointCount=0;g.feedback={};g.guessAt={};g.revealedLetters=[];g.hintAt=Number.MAX_SAFE_INTEGER;g.artistAwarded=false;g.eligible=participants(s).filter(p=>p.id!==g.artistId).map(p=>p.id);g.choices=choices(s,g);
}
export function newSketch(s:CasualState,now:number):SketchGame{
 const ids=participants(s).map(p=>p.id),g:SketchGame={kind:'sketch',stage:'choose',ids,artistId:ids[0],currentId:ids[0],turn:1,cycle:1,cycles:s.settings.sketchRounds||3,seconds:s.settings.sketchSeconds||60,deadline:0,startedAt:0,choices:[],word:'',used:[],eligible:[],guessed:{},scores:Object.fromEntries(ids.map(id=>[id,0])),strokes:[],canvasEpoch:0,pointCount:0,feedback:{},guessAt:{},revealedLetters:[],hintAt:0,artistAwarded:false};beginTurn(s,g,now);return g;
}
function startDrawing(g:SketchGame,index:number,now:number){g.word=g.choices[index];g.used.push(g.word);g.stage='draw';g.startedAt=now;g.deadline=now+g.seconds*1000;g.choices=[];g.hintAt=now+g.seconds*1000/3}
function reveal(s:CasualState,g:SketchGame,now:number){
 if(g.stage==='reveal')return;
 if(!g.artistAwarded&&g.word){const points=Math.min(300,Math.round(300*g.eligible.filter(id=>g.guessed[id]).length/Math.max(1,g.eligible.length)));g.scores[g.artistId]=(g.scores[g.artistId]||0)+points;g.artistAwarded=true}
 g.stage='reveal';g.choices=[];g.deadline=now+5000;g.hintAt=Number.MAX_SAFE_INTEGER;event(s,g.word?'Answer: '+g.word+'.':'The artist left. Next drawing.',now);
}
function nextTurn(s:CasualState,g:SketchGame,now:number){
 const alive=new Set(participants(s).map(p=>p.id));if(alive.size<2){finishBattle(s,[],'The drawing table needs at least two players. Open a new lobby to continue.',now);return}
 do{g.turn++}while(g.turn<=g.cycles*g.ids.length&&!alive.has(g.ids[(g.turn-1)%g.ids.length]));
 if(g.turn>g.cycles*g.ids.length){const best=Math.max(...g.ids.filter(id=>alive.has(id)).map(id=>g.scores[id]||0));finishBattle(s,g.ids.filter(id=>alive.has(id)&&g.scores[id]===best),'Final sketch. The highest score wins; tied leaders share the win.',now);return}beginTurn(s,g,now);
}
export function advanceSketch(s:CasualState,now:number){
 const g=s.game as SketchGame;
 if(now>=g.deadline){if(g.stage==='choose')startDrawing(g,0,now);else if(g.stage==='draw')reveal(s,g,now);else nextTurn(s,g,now);return true}
 if(g.stage==='draw'&&now>=g.hintAt){const indexes=Array.from(g.word).flatMap((c,i)=>/[a-z]/i.test(c)&&!g.revealedLetters.includes(i)?[i]:[]),maximum=Math.min(2,Math.max(0,Math.floor(normalizeGuess(g.word).length/3)));if(g.revealedLetters.length<maximum&&indexes.length)g.revealedLetters.push(indexes[Math.floor(random(s)*indexes.length)]);g.hintAt=g.revealedLetters.length<maximum?g.startedAt+g.seconds*1000*2/3:Number.MAX_SAFE_INTEGER;return true}return false;
}
export function sketchAction(s:CasualState,a:Record<string,unknown>,id:string,now:number){
 const g=s.game as SketchGame;if(a.turn!==g.turn)throw new CasualError('That drawing turn has ended.',409);if(id!==g.artistId)throw new CasualError('Only the artist can draw.',403);
 if(a.action==='sketch-choose'){if(g.stage!=='choose'||!Number.isInteger(a.choice)||(a.choice as number)<0||(a.choice as number)>=g.choices.length)throw new CasualError('Choose an available word.');startDrawing(g,a.choice as number,now);return}
 if(g.stage!=='draw')throw new CasualError('This canvas is not accepting strokes.',409);
 if(a.canvasEpoch!==g.canvasEpoch)throw new CasualError('The canvas changed. Start a new stroke.',409);
 if(a.action==='sketch-clear'){g.strokes=[];g.pointCount=0;g.canvasEpoch++;return}
 if(a.action==='sketch-undo'){const last=g.strokes.pop();if(last)g.pointCount-=last.points.length/2;g.canvasEpoch++;return}
 if(a.action!=='sketch-stroke')throw new CasualError('Choose a drawing action.');
 const strokeId=a.strokeId as string,points=a.points as number[],seq=a.seq as number;
 let stroke=g.strokes.at(-1);if(stroke?.id!==strokeId){if(g.strokes.some(p=>p.id===strokeId))throw new CasualError('That stroke is already complete.',409);if(g.strokes.length>=MAX_SKETCH_STROKES)throw new CasualError('Canvas is full. Clear it to keep drawing.');if(seq!==1)throw new CasualError('Start the stroke from its first segment.',409);stroke={id:strokeId,color:a.color as string,size:a.size as number,points:[],seq:0,closed:false};g.strokes.push(stroke)}
 if(seq<=stroke.seq)return;if(stroke.closed||seq!==stroke.seq+1||stroke.color!==a.color||stroke.size!==a.size)throw new CasualError('The stroke changed. Start a new one.',409);
 if(g.pointCount+points.length/2>MAX_SKETCH_POINTS)throw new CasualError('Canvas is full. Clear it to keep drawing.');
 stroke.points.push(...points);stroke.seq=seq;stroke.closed=a.closed===true;g.pointCount+=points.length/2;
}
/** Generic room chat goes through this guard too: there is no chat bypass. */
export function sketchChat(s:CasualState,id:string,text:string,messageId:string,now:number){
 const g=s.game as SketchGame,p=s.players.find(p=>p.id===id)!;
 if(s.phase!=='playing'||g.stage==='reveal'){s.chat=appendChat(s.chat,id,p.name,text,messageId,now);return}
 if(p.role==='spectator')throw new CasualError('Spectators can chat between drawings.',403);
 if(id===g.artistId)throw new CasualError('Artists cannot send hints through chat.',403);
 if(g.guessed[id])throw new CasualError('You guessed it. Chat opens after the answer is revealed.',403);
 if(g.stage!=='draw'||!g.eligible.includes(id))throw new CasualError('Wait for the next drawing to guess.',409);
 if(now-(g.guessAt[id]||0)<600)throw new CasualError('Give your last guess a moment.',429);
 const clean=chatText(text);
 if(sketchMatches(clean,g.word)){
  const points=100+Math.floor(400*Math.max(0,g.deadline-now)/(g.seconds*1000)),chat=appendChat(s.chat,id,p.name,'Guessed the word! +'+points,messageId,now);g.guessAt[id]=now;g.guessed[id]={at:now,points};g.scores[id]=(g.scores[id]||0)+points;g.feedback[id]={at:now,text:'Correct! +'+points};
  s.chat=chat;event(s,p.name+' guessed the word.',now);
  if(g.eligible.every(player=>g.guessed[player]||!participants(s).some(p=>p.id===player)))reveal(s,g,now);
 }else{s.chat=appendChat(s.chat,id,p.name,clean,messageId,now);g.guessAt[id]=now;g.feedback[id]={at:now,text:'Keep guessing.'}}
}
export function leaveSketch(s:CasualState,id:string,now:number){const g=s.game as SketchGame;if(id===g.artistId)reveal(s,g,now);else{g.eligible=g.eligible.filter(p=>p!==id);if(g.stage==='draw'&&g.eligible.every(p=>g.guessed[p]))reveal(s,g,now)}}
export function publicSketch(g:SketchGame,id:string,now:number){
 const mayKnow=id===g.artistId||!!g.guessed[id]||g.stage==='reveal',mask=Array.from(g.word).map((c,i)=>!/[a-z]/i.test(c)||g.revealedLetters.includes(i)?c:'_').join('');
 return{kind:g.kind,stage:g.stage,artistId:g.artistId,currentId:g.currentId,turn:g.turn,cycle:g.cycle,cycles:g.cycles,seconds:g.seconds,deadline:g.deadline,startedAt:g.startedAt,choices:g.stage==='choose'&&id===g.artistId?[...g.choices]:[],word:mayKnow?g.word:undefined,mask:g.stage==='choose'?'':mask,eligible:g.eligible,guessed:g.guessed,scores:g.scores,strokes:g.strokes,canvasEpoch:g.canvasEpoch,pointCount:g.pointCount,feedback:g.feedback[id],canGuess:g.stage==='draw'&&g.eligible.includes(id)&&!g.guessed[id]&&now<g.deadline,chatLocked:g.stage!=='reveal'&&(id===g.artistId||!!g.guessed[id]||!g.eligible.includes(id))};
}
