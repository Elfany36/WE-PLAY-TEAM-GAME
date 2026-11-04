export type StrokeSegment={strokeId:string;color:string;size:number;points:number[];closed:boolean;round?:number;turn?:number;canvasEpoch?:number};
type Queued=StrokeSegment&{seq?:number;requestId?:string};
/** Reliable ordered strokes: unlike held movement, older segments cannot be replaced. */
export class SketchQueue{
 private waiting:Queued[]=[];private sending=false;private generation=0;private sequences=new Map<string,number>();private listeners:(()=>void)[]=[];
 private send:(segment:StrokeSegment&{seq:number;requestId:string})=>Promise<void>;
 private onError:(error:unknown)=>void;
 constructor(send:(segment:StrokeSegment&{seq:number;requestId:string})=>Promise<void>,onError:(error:unknown)=>void=()=>{}){this.send=send;this.onError=onError}
 get pending(){return this.waiting.length+(this.sending?1:0)}
 enqueue(segment:StrokeSegment){
  const tail=this.waiting.at(-1);
  if(tail&&!tail.requestId&&tail.strokeId===segment.strokeId&&!tail.closed&&tail.turn===segment.turn&&tail.round===segment.round&&tail.canvasEpoch===segment.canvasEpoch&&tail.color===segment.color&&tail.size===segment.size&&tail.points.length+segment.points.length<=128){tail.points.push(...segment.points);tail.closed=segment.closed}
  else{if(this.waiting.length>=256){this.onError(Error('The connection is catching up. Wait before drawing again.'));return false}this.waiting.push({...segment,points:[...segment.points]})}
  void this.pump();return true;
 }
 reset(){this.generation++;this.waiting=[];this.sequences.clear();this.sending=false;this.finish()}
 idle(){return this.pending?new Promise<void>(resolve=>this.listeners.push(resolve)):Promise.resolve()}
 private finish(){if(!this.pending){for(const resolve of this.listeners)resolve();this.listeners=[]}}
 private async pump(){
  if(this.sending||!this.waiting.length){this.finish();return}this.sending=true;const generation=this.generation,packet=this.waiting.shift()!;
  packet.seq??=(this.sequences.get(packet.strokeId)||0)+1;packet.requestId??=crypto.randomUUID();let error:unknown;
  for(let attempt=0;attempt<3;attempt++){try{await this.send(packet as StrokeSegment&{seq:number;requestId:string});error=undefined;break}catch(e){error=e;const status=(e as {status?:number}).status;if(status&&status<500&&status!==429)break;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,120*2**attempt))}if(generation!==this.generation)return}
  if(generation!==this.generation)return;this.sending=false;
  if(error){this.waiting=[];this.onError(error)}else{this.sequences.set(packet.strokeId,packet.seq!);if(packet.closed)this.sequences.delete(packet.strokeId)}
  this.finish();if(this.waiting.length)void this.pump();
 }
}
