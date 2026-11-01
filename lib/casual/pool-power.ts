/** Extra travel at the low end gives touch and keyboard players finer control. */
export function poolShotSpeed(power:number){return 70+Math.pow(Math.max(.1,Math.min(1,power)),1.3)*730}
export function poolPowerForSpeed(speed:number){return Math.max(.1,Math.min(1,Math.pow(Math.max(0,(speed-70)/730),1/1.3)))}
