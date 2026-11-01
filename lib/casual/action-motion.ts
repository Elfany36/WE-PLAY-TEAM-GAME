import {stepCircuit,type CircuitGame} from './circuit.ts';
import {stepTerra,type TerraGame} from './terra.ts';
import type {Pose} from '../game-motion.ts';
export type ActionGame=CircuitGame|TerraGame;
export const ACTION_STEP_MS=50,MAX_PREDICTION_MS=300;
/** Prediction never edits terrain; share immutable tiles instead of copying 9,600 cells per frame. */
export function cloneActionGame(game:ActionGame):ActionGame{if(game.kind==='terra'){const copy:TerraGame=structuredClone({...game,tiles:[]});copy.tiles=game.tiles;return copy}return structuredClone(game)}
export function stepActionPrediction(g:ActionGame,ids:string[],viewerId?:string){g.lastTickAt+=ACTION_STEP_MS;if(g.kind==='circuit'){const bots=g.drivers.map(d=>d.bot);if(viewerId)g.drivers.forEach(d=>d.bot=false);stepCircuit(g,ids,.05,g.lastTickAt);if(viewerId)g.drivers.forEach((d,i)=>d.bot=bots[i])}else{const inputs=g.inputs;g.inputs=Object.fromEntries(Object.entries(inputs).map(([id,input])=>[id,{...input,use:false}]));stepTerra(g,ids,.05,g.lastTickAt);g.inputs=inputs}}
export function actionPoses(g:ActionGame):Record<string,Pose>{return Object.fromEntries(g.kind==='circuit'?g.drivers.map(p=>[p.id,{x:p.x,y:p.y,angle:p.angle}]):g.explorers.map(p=>[p.id,{x:p.x,y:p.y}]))}
