'use client';
import {memo} from 'react';
import {Sparkles,Layers,Flag,Trophy,BrainCircuit} from 'lucide-react';
import type {CasualPublic,CasualState} from '../../lib/casual/engine';
import {tableScene} from '../../lib/casual/scenes';
import {playerColor} from '../../lib/casual/appearance';
import CharacterModel from './CharacterModel';
export default memo(function TableHud({room}:{room:CasualPublic}){
 const g=room.game as CasualState['game'];if(!g||!['ladders','memory','uno','chess','dama','scidama','pool','property','phone','blocks'].includes(g.kind))return null;
 const simultaneous=g.kind==='phone'||g.kind==='blocks',id=simultaneous?room.youId:g.kind==='property'&&g.debt?g.debt.payer:'currentId'in g?g.currentId:room.youId,p=room.players.find(p=>p.id===id),scene=tableScene(room.settings.scene),color=playerColor(p),thinking=room.botThinking?.playerId===id,items:{label:string;value:string|number}[]=[];
 const own=id===room.youId,active=room.phase==='playing'&&(g.kind==='phone'?!g.revealing&&!g.submitted[room.youId]:g.kind==='blocks'?!!g.boards.find(b=>b.id===room.youId)?.alive:own&&!(g.kind==='pool'&&g.moving));
 const title=room.phase==='finished'?'Round complete':room.phase==='paused'?'Game paused':g.kind==='phone'?g.revealing?'Album reveal':active?'Your task is ready':'Your part is sent':g.kind==='blocks'?active?'Your well is live':'Watching the remaining players':thinking?p?.name+' is thinking…':g.kind==='pool'&&g.moving?'Balls rolling':own?'Your turn':p?.name?p.name+'’s turn':'Round in progress';
 if(g.kind==='memory')items.push({label:'Pairs',value:g.deck.filter(c=>c.matchedBy).length/2+' / '+g.deck.length/2},{label:'Turn',value:g.turn});
 if(g.kind==='ladders')items.push({label:'Square',value:g.positions[id]||'Start'},{label:'Goal',value:100});
 if(g.kind==='uno')items.push({label:'Direction',value:g.direction===1?'Clockwise':'Reverse'},{label:'Turn',value:g.turn});
 if(g.kind==='chess'||g.kind==='dama'||g.kind==='scidama')items.push({label:'Move',value:g.turn},{label:'Pieces',value:g.pieces.filter(x=>x.owner===id).length});
 if(g.kind==='pool')items.push({label:'Table',value:g.moving?'Rolling':g.groups[id]||'Open'},{label:'Turn',value:g.turn});
 if(g.kind==='property')items.push({label:'Balance',value:'$'+(g.players[id]?.cash||0).toLocaleString()},{label:'Stage',value:g.stage});
 if(g.kind==='phone')items.push({label:'Stage',value:g.stage+1},{label:'Ready',value:Object.keys(g.submitted).length+' / '+room.players.filter(p=>!p.retired).length});
 if(g.kind==='blocks'){const b=g.boards.find(b=>b.id===room.youId);items.push({label:'Score',value:b?.score||0},{label:'Lines',value:b?.lines||0})}
 return <div className={'table-hud '+(active?'is-your-turn':'is-waiting')} data-owner={id} role="status" style={{'--table-accent':scene.accent,'--table-ink':scene.felt,'--turn-color':color.fill,'--turn-ink':color.ink} as React.CSSProperties}><div className="table-hud-emblem"><CharacterModel mode={room.mode} fleetStyle={room.settings.fleetStyle} player={p}/></div><div className="table-hud-title"><small>{scene.name}</small><strong>{thinking&&<BrainCircuit size={15}/>} {title}</strong></div><div className="table-hud-stats">{items.map((item,i)=><span key={item.label}>{i?<Flag size={14}/>:g.kind==='blocks'?<Trophy size={14}/>:<Layers size={14}/>}<small>{item.label}</small><strong>{item.value}</strong></span>)}</div></div>;
},(a,b)=>hudKey(a.room)===hudKey(b.room));
function hudKey(room:CasualPublic){const g=room.game;if(!g)return'';const id=g.kind==='phone'||g.kind==='blocks'?room.youId:g.kind==='property'&&g.debt?g.debt.payer:g.currentId,p=room.players.find(p=>p.id===id);return JSON.stringify([room.phase,room.settings.scene,room.youId,id,p?.name,p?.color,p?.appearance,room.botThinking?.playerId,g.kind,g.turn,g.kind==='memory'?g.deck.filter((c:any)=>c.matchedBy).length:null,g.kind==='ladders'?g.positions[id]:null,g.kind==='uno'?g.direction:null,['chess','dama','scidama'].includes(g.kind)?g.pieces.filter((p:any)=>p.owner===id).length:null,g.kind==='pool'?[g.moving,g.groups[id]]:null,g.kind==='property'?[g.players[id]?.cash,g.stage]:null,g.kind==='phone'?[g.stage,g.revealing,Object.keys(g.submitted).length,!!g.submitted[room.youId],room.players.filter(p=>!p.retired).length]:null,g.kind==='blocks'?g.boards.filter((b:any)=>b.id===room.youId).map((b:any)=>[b.score,b.lines,b.alive]):null])}
