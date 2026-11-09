import {test} from 'node:test';import assert from 'node:assert/strict';
import {CASUAL_MODES,applyCasualAction,advanceCasual,publicCasual,activePlayers,type CasualState} from '../lib/casual/engine.ts';
import {createLocalLobby,changeLocalRole,computerLimit,spectatorComputerCount} from '../lib/casual/local-play.ts';
import {localViewer} from '../lib/casual/local-view.ts';
import {spectatorView,spectatorFollowId,spectatorPlayers} from '../lib/casual/spectator-view.ts';
import {casualBody} from '../lib/casual/api.ts';
const now=10000,settings={cards:20,speed:350,bots:2};

test('all arcade games support a real spectator host and AI participants',()=>{
 for(const mode of CASUAL_MODES){let state=createLocalLobby({mode,role:'spectator',settings,names:['Observer'],seed:41,now});assert.equal(state.phase,'lobby');assert.equal(state.players[0].role,'spectator');state=applyCasualAction(state,{action:'start'},state.hostId,now);assert.equal(activePlayers(state).length,2);assert(activePlayers(state).every(p=>p.bot));assert.equal(localViewer(state,activePlayers(state)[0].id),state.hostId);
  const view=publicCasual(state,state.hostId,now),watched=spectatorView(view,activePlayers(state)[1].id);assert.equal(watched.youId,state.hostId);assert.equal(watched.viewingId,activePlayers(state)[1].id);assert.deepEqual(watched.game,view.game);if(mode!=='phone')assert(!JSON.stringify(state.game).includes(state.hostId),mode);else assert((state.game as any).chains.every((chain:any)=>chain.owner!==state.hostId));assert.throws(()=>applyCasualAction(state,{action:'flip',round:state.round,turn:1,card:0},state.hostId,now),/Spectators/);
  if(mode==='uno'){assert.deepEqual(watched.game.hand,[]);assert.deepEqual(watched.game.playable,[])}if(mode==='phone'){assert.equal(watched.game.task,null);assert.equal(watched.game.draft,undefined)}if(mode==='generals')assert.equal(watched.game.pieces.length,0);if(mode==='fleet')assert(Object.values(watched.game.fleets).every((p:any)=>!p.length));
 }
});
test('camera follow remains public after AI deployment, movement, and perspective changes',()=>{
 for(const mode of CASUAL_MODES){let s=createLocalLobby({mode,role:'spectator',settings,names:['Watcher'],seed:93,now});s=applyCasualAction(s,{action:'start'},s.hostId,now);for(let n=1;n<=6;n++)s=advanceCasual(s,now+n*1000).state;const view=publicCasual(s,s.hostId,now+6000),ids=spectatorPlayers(view).map(p=>p.id);assert(ids.length);assert(ids.includes(spectatorFollowId(view,'retired-player')!));for(const id of ids){const next=spectatorView(view,id);assert.equal(next.youId,s.hostId);assert.deepEqual(next.game,view.game);if(mode==='generals')assert(next.game.pieces.every((p:any)=>p.rank===undefined));if(mode==='fleet')for(const owner of ids)assert(next.game.fleets[owner].every((p:any)=>next.game.shots.some((shot:any)=>shot.target===owner&&shot.sunk===p.id)))}assert.equal(localViewer(s,ids[0],ids[1]),s.hostId);assert.equal(s.ai?.rejected||0,0,mode)}
});
test('local player sessions keep shared-device turns and role changes occur between rounds',()=>{
 let s=createLocalLobby({mode:'ladders',settings:{...settings,bots:0},names:['First','Second'],humans:2,seed:1,now});assert.equal(s.players.length,2);s=applyCasualAction(s,{action:'start'},s.hostId,now);const id=(s.game as any).currentId;s=applyCasualAction(s,{action:'roll',round:s.round,turn:1},id,now);assert.equal(localViewer(s),(s.game as any).currentId);assert.throws(()=>changeLocalRole(s,'spectator',now),/after this round|Watch AI/);s=applyCasualAction(s,{action:'end'},s.hostId,now);assert.throws(()=>changeLocalRole(s,'spectator',now),/Watch AI/);s=createLocalLobby({mode:'ladders',settings,names:['First'],seed:1,now});s=changeLocalRole(s,'spectator',now);assert.equal(localViewer(s,'local-1'),s.hostId);assert(s.settings.bots!>=2);s=changeLocalRole(s,'player',now);assert.equal(s.players.find(p=>p.id===s.hostId)!.role,'player');
});
test('watch mode supports full eight-seat AI matches and named two-seat opponents',()=>{
 assert.equal(computerLimit('pool','player'),1);assert.equal(computerLimit('pool','spectator'),2);assert.equal(computerLimit('snake','spectator'),8);assert.equal(computerLimit('uno','spectator'),8);assert.equal(spectatorComputerCount('pool',0),2);
 let s=createLocalLobby({mode:'snake',role:'spectator',settings:{...settings,bots:8},names:['Watcher'],seed:7,now});s=applyCasualAction(s,{action:'start'},s.hostId,now);assert.equal(activePlayers(s).length,8);assert.equal(new Set(activePlayers(s).map(p=>p.name)).size,8);assert(activePlayers(s).every(p=>p.name&&p.bot));
 assert.throws(()=>createLocalLobby({mode:'phone',settings,names:['First','Second'],humans:2,seed:1,now}),/separate devices/);
});
test('the HTTP boundary accepts the supported eight AI seats and rejects larger requests',async()=>{
 const request=(bots:number)=>new Request('https://example.com/api/casual',{method:'POST',body:JSON.stringify({action:'create',mode:'snake',name:'Observer',bots})});assert.equal((await casualBody(request(8))).bots,8);await assert.rejects(casualBody(request(9)),/bots/);
});
