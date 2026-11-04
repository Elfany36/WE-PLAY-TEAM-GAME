import type {publicSketch,SketchStroke} from './sketch.ts';
import {SKETCH_WORDS,BOT_SKETCH_WORDS} from './sketch-words.ts';
const circle=(x:number,y:number,r:number)=>Array.from({length:25},(_,i)=>[Math.round(x+Math.cos(i*Math.PI/12)*r),Math.round(y+Math.sin(i*Math.PI/12)*r)]).flat();
const line=(...points:number[])=>points;
export function sketchTemplate(word:string):number[][]{
 switch(word){
  case 'sun':return[circle(500,300,120),...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return line(Math.round(500+Math.cos(a)*155),Math.round(300+Math.sin(a)*155),Math.round(500+Math.cos(a)*205),Math.round(300+Math.sin(a)*205))})];
  case 'house':return[line(250,510,250,300,500,100,750,300,750,510,250,510),line(430,510,430,370,570,370,570,510),line(300,330,380,330,380,410,300,410,300,330)];
  case 'tree':return[line(450,540,450,350,550,350,550,540,450,540),circle(500,250,145)];
  case 'fish':return[line(230,300,280,220,430,190,600,230,720,300,600,370,430,410,280,380,230,300,110,190,110,410,230,300),circle(600,280,12)];
  case 'cat':return[line(310,250,310,90,440,190,560,190,690,90,690,250),circle(500,330,200),circle(430,300,14),circle(570,300,14),line(480,365,520,365,500,390,480,365),line(290,360,130,330,290,360,130,390),line(710,360,870,330,710,360,870,390)];
  case 'flower':return[line(500,550,500,280,420,410,330,380),circle(500,250,50),...Array.from({length:6},(_,i)=>circle(Math.round(500+Math.cos(i*Math.PI/3)*90),Math.round(250+Math.sin(i*Math.PI/3)*90),50))];
  case 'star':return[Array.from({length:11},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?85:200;return[Math.round(500+Math.cos(a)*r),Math.round(320+Math.sin(a)*r)]}).flat()];
  case 'moon':return[line(600,100,500,120,380,200,330,320,380,450,500,520,630,500,540,430,500,330,510,220,600,100)];
  case 'car':return[line(180,430,180,320,300,300,400,190,620,190,730,300,820,330,820,430,180,430),circle(330,440,65),circle(690,440,65),line(430,210,350,300,680,300,600,210,430,210)];
  case 'mountain':return[line(150,520,430,100,630,440,780,210,930,520,150,520),line(350,220,430,100,510,230,440,200,400,250,350,220)];
  case 'snowman':return[circle(500,460,130),circle(500,250,95),circle(470,230,8),circle(530,230,8),line(500,255,580,270,500,280),line(370,420,200,300),line(630,420,800,300)];
  case 'sailboat':return[line(200,430,800,430,700,540,300,540,200,430),line(500,420,500,100,730,380,500,380,300,380,500,100),line(100,570,250,585,400,570,550,585,700,570,850,585)];
  default:return[line(250,500,250,180,750,180,750,500,250,500),circle(500,340,100)];
 }
}
function recognized(strokes:SketchStroke[]){if(!strokes.length)return;return BOT_SKETCH_WORDS.find(word=>{const pattern=sketchTemplate(word);return strokes.length>=Math.min(2,pattern.length)&&pattern.slice(0,Math.min(2,pattern.length)).every((p,i)=>p.length===strokes[i]?.points.length&&p.every((v,j)=>Math.abs(v-strokes[i].points[j])<=2))})}
/** Receives only this bot's private projection, never the authoritative secret. */
export function chooseSketchMove(g:ReturnType<typeof publicSketch>,id:string,cursor:number,now:number):Record<string,unknown>|null{
 if(g.artistId===id){if(g.stage==='choose')return{action:'sketch-choose',choice:Math.max(0,g.choices.findIndex(w=>BOT_SKETCH_WORDS.includes(w)))};
  if(g.stage!=='draw'||!g.word)return null;const pattern=sketchTemplate(g.word),index=g.strokes.length;if(index>=pattern.length)return null;return{action:'sketch-stroke',canvasEpoch:g.canvasEpoch,strokeId:'studio-'+g.turn+'-'+id+'-'+index,seq:1,color:'#243346',size:8,points:pattern[index],closed:true};
 }
 if(!g.canGuess||now-g.startedAt<2200)return null;
 const known=recognized(g.strokes),pool=SKETCH_WORDS.map(w=>w.word).filter(word=>word.length===g.mask.length&&Array.from(g.mask).every((c,i)=>c==='_'||c===word[i]));const text=known||pool[cursor%Math.max(1,pool.length)];return text?{action:'chat',text,messageId:'guess-'+g.turn+'-'+id+'-'+now}:null;
}
