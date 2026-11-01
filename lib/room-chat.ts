import {chatDecoration,type ChatDecoration} from './chat-media.ts';
export const CHAT_TTL = 15 * 60 * 1000;
export const CHAT_GIFTS = [
 {id:'star',emoji:'🌟',name:'Superstar',text:'🌟 sent a Superstar to the room!'},
 {id:'coffee',emoji:'☕',name:'Coffee break',text:'☕ sent a Coffee break to the room!'},
 {id:'flower',emoji:'🌻',name:'Good vibes',text:'🌻 sent Good vibes to the room!'},
 {id:'trophy',emoji:'🏆',name:'Well played',text:'🏆 sent a Well played trophy to the room!'},
 {id:'confetti',emoji:'🎉',name:'Celebration',text:'🎉 sent a Celebration to the room!'},
 {id:'heart',emoji:'💚',name:'A little kindness',text:'💚 sent A little kindness to the room!'},
] as const;
export type ChatMessage={id:number;playerId:string;name:string;text:string;at:number;clientId:string;giftId?:string;gifId?:string;effect?:string};
export class ChatError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status}}
export function chatText(value:unknown){if(typeof value!=='string'||value.length>280)throw new ChatError('Write a message of 1–280 characters.');const text=value.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,' ').replace(/\s+/g,' ').trim();if(!text)throw new ChatError('Write a message before sending.');return text}
export function activeChat(history:ChatMessage[]|undefined,now:number){return(history||[]).filter(m=>now-m.at<CHAT_TTL).slice(-50)}
export function appendChat(history:ChatMessage[]|undefined,id:string,name:string,value:unknown,clientId:unknown,now:number,giftId?:unknown,decoration:ChatDecoration={}){
 const gift=giftId===undefined?undefined:CHAT_GIFTS.find(g=>g.id===giftId);
 if(giftId!==undefined&&!gift)throw new ChatError('Choose a gift from the gift tray.');
 const text=gift?gift.text:chatText(value),messages=activeChat(history,now);
 if(typeof clientId!=='string'||clientId.length<8||clientId.length>80)throw new ChatError('A chat message identifier is required.');
 if(messages.some(m=>m.playerId===id&&m.clientId===clientId))throw new ChatError('That message was already sent.',409);
 const last=[...messages].reverse().find(m=>m.playerId===id);if(last&&now-last.at<1000)throw new ChatError('Give your message a moment before sending another.',429);
 let media:ChatDecoration;try{media=chatDecoration(decoration)}catch(e){throw new ChatError((e as Error).message)}
 if(gift&&media.gifId)throw new ChatError('Send a gift or a GIF in one message.');
 return[...messages.slice(-49),{id:(messages.at(-1)?.id||0)+1,playerId:id,name,text,at:now,clientId,...(gift?{giftId:gift.id}:{}),...media}];
}
