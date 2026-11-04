import type {CasualPublic} from './engine.ts';
import {casualLeaderboard} from './leaderboard.ts';

type FollowActor={id:string;alive:boolean;finishedAt?:number|null;score:number};
type FollowBout={a:string;b?:string;winner?:string|null};

export function spectatorPlayers(room:CasualPublic){return room.players.filter(p=>!p.retired&&p.role!=='spectator')}
/** Camera preference never changes the authenticated viewer or their private projection. */
export function spectatorFollowId(room:CasualPublic,preference=''){
 const players=spectatorPlayers(room),ids=new Set(players.map(p=>p.id)),g=room.game;
 if(preference&&ids.has(preference))return preference;
 if(!g)return players[0]?.id;
 if(g.kind==='solitaire')return casualLeaderboard(room).find(p=>ids.has(p.id))?.id||players[0]?.id;
 if(g.currentId&&ids.has(g.currentId))return g.currentId;
 if(g.kind==='sumo'&&g.bracket){const bout=g.bracket.bouts.find((b:FollowBout)=>!b.winner&&b.b);if(bout&&ids.has(bout.a))return bout.a}
 if(g.actors){const alive=(g.actors as FollowActor[]).filter(a=>a.alive&&a.finishedAt===null);if(alive.length)return [...alive].sort((a,b)=>b.score-a.score)[0].id}
 if(g.kind==='blocks'){const alive=(g.boards as FollowActor[]).filter(b=>b.alive);if(alive.length)return [...alive].sort((a,b)=>b.score-a.score)[0].id}
 if(g.kind==='terra')return g.explorers.find((p:{id:string;hp:number})=>p.hp>0&&ids.has(p.id))?.id||players[0]?.id;
 return casualLeaderboard(room).find(p=>ids.has(p.id))?.id||players[0]?.id;
}
export function spectatorView(room:CasualPublic,preference=''):CasualPublic{
 if(!room.players.some(p=>p.isYou&&p.role==='spectator'))return room;
 return{...room,viewingId:spectatorFollowId(room,preference)};
}
