'use client';
import {memo} from 'react';
import {Sparkles,Layers,Flag,Trophy,BrainCircuit} from 'lucide-react';
import type {CasualPublic,CasualState} from '../../lib/casual/engine';
import {tableScene} from '../../lib/casual/scenes';
import {ARCADE_COLORS} from '../../lib/casual/arcade-colors';
export default memo(function TableHud({room}:{room:CasualPublic}){
 const g=room.game as CasualState['game'];if(!g||!['ladders','memory','uno','chess','dama','scidama','pool','property','phone','blocks'].includes(g.kind))return null;
 const id='currentId'in g?g.currentId:room.youId,p=room.players.find(p=>p.id===id),scene=tableScene(room.settings.scene),color=ARCADE_COLORS[(p?.color||0)%12],thinking=room.botThinking?.playerId===id,items:{label:string;value:string|number}[]=[];
 if(g.kind==='memory')items.push({label:'Pairs',value:g.deck.filter(c=>c.matchedBy).length/2+' / '+g.deck.length/2},{label:'Turn',value:g.turn});
 if(g.kind==='ladders')items.push({label:'Square',value:g.positions[id]||'Start'},{label:'Goal',value:100});
 if(g.kind==='uno')items.push({label:'Direction',value:g.direction===1?'Clockwise':'Reverse'},{label:'Turn',value:g.turn});
 if(g.kind==='chess'||g.kind==='dama'||g.kind==='scidama')items.push({label:'Move',value:g.turn},{label:'Pieces',value:g.pieces.filter(x=>x.owner===id).length});
 if(g.kind==='pool')items.push({label:'Table',value:g.moving?'Rolling':g.groups[id]||'Open'},{label:'Turn',value:g.turn});
 if(g.kind==='property')items.push({label:'Balance',value:'$'+(g.players[id]?.cash||0).toLocaleString()},{label:'Stage',value:g.stage});
 if(g.kind==='phone')items.push({label:'Stage',value:g.stage+1},{label:'Ready',value:Object.keys(g.submitted).length+' / '+room.players.filter(p=>!p.retired).length});
 if(g.kind==='blocks'){const b=g.boards.find(b=>b.id===room.youId);items.push({label:'Score',value:b?.score||0},{label:'Lines',value:b?.lines||0})}
 return <div className="table-hud" style={{'--table-accent':scene.accent,'--table-ink':scene.felt} as React.CSSProperties}><div className="table-hud-emblem"><Sparkles size={22}/></div><div className="table-hud-title"><small>{scene.name}</small><strong>{room.phase==='finished'?'A round to remember':thinking?<><BrainCircuit size={15}/>{p?.name} is thinking…</>:p?.isYou?'Your next great move':p?.name?p.name+'’s turn':'Make it a good round'}</strong></div><div className="table-hud-stats">{items.map((item,i)=><span key={item.label}>{i?<Flag size={14}/>:g.kind==='blocks'?<Trophy size={14}/>:<Layers size={14}/>}<small>{item.label}</small><strong>{item.value}</strong></span>)}</div><i className="table-hud-rail" style={{background:color.fill}}/></div>;
});
