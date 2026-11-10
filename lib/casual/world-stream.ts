import type {CasualPublic} from './engine.ts';

const continuous = new Set(['snake','circuit','terra','sumo','tanks','pong','marble','blocks','pirate']);

/** A countdown can expire while its last snapshot is still in transit. */
export function expectsWorldUpdates(room:CasualPublic|null,receiptAge=0){
 if(room?.phase!=='playing'||!room.game)return false;
 const moving=continuous.has(room.mode)||room.mode==='pool'&&room.game.moving;
 return !!moving&&room.serverNow+Math.max(0,receiptAge)>=(room.game.startAt||0);
}

/** A returning moving canvas must see a new receipt before replaying prediction. */
export function worldFrameReady(room:CasualPublic,received:number,wokeAt:number){
 return received>=wokeAt||!expectsWorldUpdates(room,Math.max(0,wokeAt-received));
}

/** Healthy streams arrive every 100 ms. Recover missing state independently of pongs. */
export function worldQuietLimit(interval=100){
 return Math.max(400,Math.min(650,(Number.isFinite(interval)&&interval>0?interval:100)*3));
}

/** Wake at the countdown boundary even if no further snapshot arrives. */
export function worldRecoveryDelay(room:CasualPublic|null,receiptAge:number,wait:number){
 if(room?.phase!=='playing'||!room.game||!continuous.has(room.mode))return wait;
 const remaining=(room.game.startAt||0)-room.serverNow-Math.max(0,receiptAge);
 return remaining>0?Math.min(wait,remaining):wait;
}
