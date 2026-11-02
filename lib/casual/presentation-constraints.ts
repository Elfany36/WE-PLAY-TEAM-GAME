import type {Pose} from '../game-motion.ts';
import {constrainKart,type CircuitGame,type Driver} from './circuit.ts';
import {constrainTank,partyScale,tankWalls,type PartyGame,type ClubActor} from './party.ts';

/** Reconciliation is visual only, but its hull must still respect solid scenery. */
export function kartPresentationPose(game:CircuitGame,actor:Driver,pose:Pose):Pose{
 const copy={...actor,...pose,angle:pose.angle??actor.angle};
 constrainKart(game,copy);
 return {x:copy.x,y:copy.y,angle:copy.angle};
}

export function tankPresentationPose(game:PartyGame,actor:ClubActor,pose:Pose):Pose{
 const copy={...actor,...pose,angle:pose.angle??actor.angle};
 constrainTank(copy,tankWalls(game.map,partyScale(game)),partyScale(game));
 return {x:copy.x,y:copy.y,angle:copy.angle};
}
