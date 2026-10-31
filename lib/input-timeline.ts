/** Pending controls replay only from their own issue time, never across earlier steps. */
export class InputTimeline<T extends {seq:number;at:number}>{
 private inputs=new Map<string,T[]>();
 reset(){this.inputs.clear()}
 push(id:string,input:T){const list=this.inputs.get(id)||[];list.push(input);if(list.length>64)list.shift();this.inputs.set(id,list)}
 acknowledge(id:string,seq:number){const list=this.inputs.get(id);if(list)this.inputs.set(id,list.filter(input=>input.seq>seq))}
 sample(id:string,time:number,seq:number){const list=this.inputs.get(id);if(!list)return;for(let i=list.length-1;i>=0;i--)if(list[i].at<=time)return list[i].seq>seq?list[i]:undefined}
}
