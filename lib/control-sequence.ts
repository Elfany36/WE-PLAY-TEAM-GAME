/** A reloaded client may have a corrected wall clock; authority still owns its sequence watermark. */
export function nextControlSequence(previous:number,acknowledged:number,now=Date.now()){
 return Math.max(now,previous+1,acknowledged+1);
}
