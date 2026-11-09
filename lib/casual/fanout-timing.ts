import type {CasualState} from './engine.ts';
/** Only committed physics updates drive continuous fanout; table changes stay immediate. */
export function continuousRoom(state:CasualState|null|undefined,now:number){
 const g=state?.game;return !!g&&state!.phase==='playing'&&now>=('startAt'in g?g.startAt:0)&&(['snake','circuit','terra','sumo','tanks','pong','marble','blocks','pirate'].includes(g.kind)||g.kind==='pool'&&g.moving);
}
export function roomFanoutScene(state:CasualState){return state.code+':'+state.mode+':'+state.round+':'+state.phase+':'+(state.game&&'startAt'in state.game?state.game.startAt:0)}
