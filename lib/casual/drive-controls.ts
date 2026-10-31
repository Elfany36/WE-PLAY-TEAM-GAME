/** Untouched or released keys must always produce finite neutral input. */
export function driveInput(keys:Record<string,boolean|undefined>){
 return {action:'drive' as const,throttle:Number(!!(keys.up||keys.w))-Number(!!(keys.down||keys.s)),steer:Number(!!(keys.right||keys.d))-Number(!!(keys.left||keys.a)),drift:!!keys.space};
}
