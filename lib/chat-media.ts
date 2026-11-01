export const CHAT_GIFS=[{id:'celebrate',name:'Level up!',caption:'🎉 Level up!'},{id:'heart',name:'Good vibes',caption:'💜 Good vibes'},{id:'star',name:'Great move',caption:'🌟 Great move!'}] as const;
export const CHAT_EFFECTS=[{id:'none',name:'Classic'},{id:'glow',name:'Neon'},{id:'party',name:'Confetti'},{id:'gold',name:'Golden'}] as const;
export type ChatDecoration={gifId?:string;effect?:string};
export function chatDecoration(value:ChatDecoration){
 if(value.gifId!==undefined&&!CHAT_GIFS.some(g=>g.id===value.gifId))throw new Error('Choose an animation from the GIF tray.');
 if(value.effect!==undefined&&!CHAT_EFFECTS.some(e=>e.id===value.effect))throw new Error('Choose a text style from the style tray.');
 return{...(value.gifId?{gifId:value.gifId}:{}),...(value.effect&&value.effect!=='none'?{effect:value.effect}:{})};
}
