import type {CasualPublic} from './engine.ts';
const simultaneous=new Set(['snake','circuit','terra','sumo','tanks','pong','marble','blocks','pirate']);
export function casualPollPeriod(room:CasualPublic|null,live:boolean,elapsed=0,streaming=false){
 const game=room?.game,playing=room?.phase==='playing',fast=playing&&(simultaneous.has(room.mode)||room.mode==='pool'&&game?.moving||room.mode==='memory'&&(!live||game?.revealed?.length||game?.resolveAt));
 if(streaming&&playing&&(simultaneous.has(room!.mode)||room!.mode==='pool'&&game?.moving))return 2000;
 if(fast)return 200;
 if(!live)return 750;
 if(playing&&(room.mode==='phone'&&room.players.some(p=>p.bot&&!p.retired)||room.players.some(p=>p.bot&&p.id===game?.currentId)))return 350;
 const deadline=game?.deadline??game?.turnDeadline;
 return playing&&Number.isFinite(deadline)?Math.min(5000,Math.max(100,deadline-room.serverNow-elapsed)):5000;
}
