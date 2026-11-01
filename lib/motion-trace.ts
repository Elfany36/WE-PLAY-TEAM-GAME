type Sample={at:number;tick:number;entities:{id:string;x:number;y:number;angle?:number}[];camera?:{x:number;y:number;angle?:number}};
let enabled:boolean|undefined;
/** Optional bounded QA trace measures displayed movement, not just RAF frequency. */
export function traceMotion(canvas:HTMLCanvasElement,at:number,tick:number,entities:Sample['entities'],camera?:Sample['camera']){if(enabled===undefined){try{enabled=localStorage.getItem('markup-motion-debug')==='1'}catch{enabled=false}}if(!enabled)return;const el=canvas as HTMLCanvasElement&{motionTrace?:Sample[]};const trace=el.motionTrace??=[];trace.push({at,tick,entities:entities.map(e=>({id:e.id,x:e.x,y:e.y,angle:e.angle})),...(camera?{camera:{...camera}}:{})});if(trace.length>600)trace.shift()}
