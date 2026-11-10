import {piratePresentation} from './pirate-presentation.ts';
import type {PirateFighter} from './pirate-runtime.js';
type PreviewFighter=Pick<PirateFighter,'id'|'ch'|'x'|'y'|'vx'|'vy'|'face'|'dead'|'st'|'hs'|'fz'|'hz'|'on'|'lastSeq'|'jumpSeq'|'dashSeq'> & Partial<PirateFighter>;
type Intent={seq:number;at:number;dx:number;jumpHeld:boolean;jumpSeq:number;down?:boolean;dashHeld?:boolean;dashSeq?:number};
type World={map:string;elapsed?:number;lg?:number;ice?:number;jumpPads?:{x:number;y:number;sq:number}[]};
type Frame={actor:PreviewFighter;world:World;snapshotAt:number;count:number;pose:PreviewFighter;jumpSeq:number;dashSeq:number;held?:Intent};
/** Keep local intent at its actual issue time; receipt delay must not turn into retroactive input. */
export class PiratePrediction{
 private inputs=new Map<string,Intent[]>();
 private frames=new Map<string,Frame>();
 reset(){this.inputs.clear();this.frames.clear()}
 /** Discard presentation history after suspension while retaining unacknowledged intent. */
 rebase(){this.frames.clear()}
 forget(id:string){this.inputs.delete(id);this.frames.delete(id)}
 record(id:string,input:Intent){const list=this.inputs.get(id)||[];list.push(input);if(list.length>64)list.shift();this.inputs.set(id,list);const frame=this.frames.get(id);if(frame&&input.at<=frame.snapshotAt+frame.count*1000/60)this.frames.delete(id)}
 pose<T extends PreviewFighter>(actor:T,world:World,snapshotAt:number,now:number):T{
  const list=this.inputs.get(actor.id)||[],confirmed=list.filter(p=>p.seq<=actor.lastSeq).at(-1),pending=list.filter(p=>p.seq>actor.lastSeq),step=1000/60;
  const count=Math.max(0,Math.min(18,Math.floor((now-snapshotAt)/step))),saved=this.frames.get(actor.id),cached=saved?.actor===actor&&saved.world===world&&saved.snapshotAt===snapshotAt&&saved.count<=count?saved:undefined;
  let pose=cached?.pose as T||actor,jumpSeq=cached?.jumpSeq??actor.jumpSeq,dashSeq=cached?.dashSeq??actor.dashSeq,held=cached?.held??confirmed;
  // Between authority receipts, reuse completed movement frames instead of replaying
  // the entire latency window on every paint. A late intent invalidates the cache.
  for(let i=cached?.count||0;i<count;i++){
   const at=snapshotAt+(i+1)*step;for(const input of pending)if(input.at<=at)held=input;
   const jump=!!held&&held.jumpSeq>jumpSeq,dash=!!held&&(held.dashSeq||0)>dashSeq;if(jump)jumpSeq=held!.jumpSeq;if(dash)dashSeq=held!.dashSeq!;
   pose=piratePresentation(pose,world.map,{dx:held?.dx||0,jump,jumpHeld:!!held?.jumpHeld,down:!!held?.down,dash,dashHeld:!!held?.dashHeld},step+.001,{elapsed:(world.elapsed||0)+i,lg:Math.max(0,(world.lg||0)-i),ice:Math.max(0,(world.ice||0)-i),jumpPads:world.jumpPads});
  }
  this.frames.set(actor.id,{actor,world,snapshotAt,count,pose,jumpSeq,dashSeq,held});
  return pose;
 }
}
