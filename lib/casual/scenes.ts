export const TABLE_SCENES=[
 {id:'garden',name:'Botanical Club',felt:'#174a43',feltLight:'#2b7b65',accent:'#dbed82',wood:'#ad7850',light:'#f7e9ca',dark:'#9ab8a0',ink:'#203d3d'},
 {id:'midnight',name:'Midnight Lounge',felt:'#172b50',feltLight:'#355b8d',accent:'#89e8ff',wood:'#626b98',light:'#e1e9fa',dark:'#8b9fc6',ink:'#172d4c'},
 {id:'sunset',name:'Sunset Terrace',felt:'#59334a',feltLight:'#98516b',accent:'#ffd47b',wood:'#bf8063',light:'#ffe6ca',dark:'#c89a8d',ink:'#4a293f'},
 {id:'aurora',name:'Aurora Hall',felt:'#263e55',feltLight:'#386d7c',accent:'#a6f5d7',wood:'#718e99',light:'#e0f0e8',dark:'#8aadb3',ink:'#203b4c'},
] as const;
export type TableScene=typeof TABLE_SCENES[number]['id'];
export const TABLE_SCENE_IDS=TABLE_SCENES.map(s=>s.id);
export function tableScene(id:unknown){return TABLE_SCENES.find(s=>s.id===id)||TABLE_SCENES[0]}
export const hasTableScene=(mode:string)=>['uno','memory','ladders','property','chess','dama','scidama','pool','blocks','phone'].includes(mode);
