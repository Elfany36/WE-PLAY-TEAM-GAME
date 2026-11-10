/** All arcade modes, three deterministic seeds, with state reloads and AI rejection checks.
 * Run with node --experimental-strip-types. RESULTS chooses the report path.
 */
import {writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
const output=process.env.RESULTS||'work/game-simulations.json';mkdirSync(dirname(output),{recursive:true});
import {CASUAL_MODES,applyCasualAction,advanceCasual,publicCasual} from '../lib/casual/engine.ts';
import {createLocalLobby} from '../lib/casual/local-play.ts';
const N=1800000000000,rows=[];
for(const mode of CASUAL_MODES)for(const seed of [41,93,997]){
 const started=performance.now(),row={mode,seed};try{
  let s=createLocalLobby({mode,role:'spectator',settings:{cards:20,speed:175,bots:2,roundSeconds:180,matchRounds:3},names:['Audit observer'],seed,now:N});s=applyCasualAction(s,{action:'start'},s.hostId,N);
  for(let i=1;i<=720&&s.phase==='playing';i++){
   s=advanceCasual(s,N+i*250).state;
   if(i%20===0){s=JSON.parse(JSON.stringify(s));const view=publicCasual(s,s.hostId,N+i*250);if(view.youId!==s.hostId)throw Error('Spectator identity changed');if(s.ai?.rejected)throw Error('Rejected bot action: '+s.ai.lastError)}
  }
  row.phase=s.phase;row.turn=s.game?.turn;row.tick=s.game?.tick??s.game?.world?.tick;row.botActions=s.ai?.cursor;row.rejected=s.ai?.rejected||0;row.reason=s.pauseReason||s.result?.reason;row.status=row.phase==='paused'||row.rejected?'failed':'passed';
 }catch(e){row.status='failed';row.error=e.stack}
 row.elapsedMs=Math.round(performance.now()-started);rows.push(row);console.log(JSON.stringify(row));writeFileSync(output,JSON.stringify(rows,null,2));
}
if(rows.some(r=>r.status!=='passed'))process.exitCode=1;
