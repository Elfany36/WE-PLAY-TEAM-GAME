'use client';
import {Pause,Play,RotateCcw} from 'lucide-react';
import {memo} from 'react';
import {SOLITAIRE_NAMES,solitaireProgress,solSpider} from '../../lib/casual/solitaire';
import type {CasualPublic} from '../../lib/casual/engine';
const timed=new Set(['snake','circuit','terra','sumo','tanks','pong','marble','blocks','pool','pirate']);
export function ImmersiveRoundActions({room,busy,onAction}:{room:CasualPublic;busy:boolean;onAction:(action:string)=>unknown}){
 if(room.phase==='paused')return room.canResume?<button type="button" disabled={busy} aria-label="Resume game" title="Resume game" onClick={()=>onAction('resume')}><Play size={18}/></button>:null;
 if(!room.isHost)return null;
 if(room.phase==='finished')return <button type="button" disabled={busy} aria-label="Play again" title="Play again" onClick={()=>onAction('start')}><RotateCcw size={18}/></button>;
 return room.phase==='playing'&&timed.has(room.mode)?<button type="button" disabled={busy} aria-label="Pause game" title="Pause game" onClick={()=>onAction('pause')}><Pause size={18}/></button>:null;
}
function status(room:CasualPublic){
 const g=room.game;if(!g)return'';
 if(room.phase==='paused')return room.canResume?'Paused · ready to resume':'Paused · waiting for host';
 if(room.phase==='finished')return room.result?.reason||'Round complete';
 if((g.kind==='generals'||g.kind==='fleet')&&g.stage==='deploy')return g.kind==='fleet'?'Deploy your hidden fleet':'Deploy your army';
 if(g.kind==='solitaire'){const board=g.boards[room.viewingId||room.youId]||g.boards[g.currentId];return SOLITAIRE_NAMES[g.variant as keyof typeof SOLITAIRE_NAMES]+(board?' · '+solitaireProgress(board,g.variant)+'/'+(['pyramid','tripeaks'].includes(g.variant)?28:solSpider(g.variant)?104:52)+' · '+board.moves+' moves':'')}
 if(g.kind==='sketch')return (room.players.find(p=>p.id===g.artistId)?.name||'Artist')+(g.stage==='choose'?' is choosing a word':g.stage==='reveal'?' · answer revealed':' is drawing');
 if(!timed.has(room.mode)||g.kind==='pool'&&!g.moving){const id=g.kind==='property'&&g.debt?g.debt.payer:g.currentId;return (room.players.find(p=>p.id===id)?.name||'Player')+'’s turn'}
 const seconds=Math.max(0,Math.ceil((g.deadline-room.serverNow)/1000));return 'Round '+room.round+(Number.isFinite(seconds)&&seconds<36000?' · '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'):'');
}
export default memo(function ImmersiveRoundHud({room}:{room:CasualPublic}){return <>{status(room)}</>},(a,b)=>status(a.room)===status(b.room));
