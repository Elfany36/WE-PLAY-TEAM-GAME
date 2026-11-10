/** Bound pen work per event without discarding the beginning of a coalesced path. */
export function sketchSamples<T>(events:readonly T[]|undefined,fallback:T):readonly T[]{
 const limit=32;
 if(!events?.length)return[fallback];
 if(events.length<=limit)return events;
 return Array.from({length:limit},(_,i)=>events[Math.round(i*(events.length-1)/(limit-1))]);
}
