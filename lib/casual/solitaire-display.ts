import type {TableScene} from './scenes.ts';
/** Personal display options never alter the shared deal or another player's table. */
export const SOLITAIRE_TABLES=[
 {id:'garden',name:'Classic baize',base:'#155b46',ink:'#f3f5e7',muted:'#d4e6d9',texture:'baize',back:'#234d86'},
 {id:'midnight',name:'Midnight felt',base:'#182b46',ink:'#f0f4ff',muted:'#cbd8e9',texture:'baize',back:'#344a75'},
 {id:'sunset',name:'Bordeaux leather',base:'#542c39',ink:'#fff2df',muted:'#ead3cc',texture:'leather',back:'#87283f'},
 {id:'aurora',name:'Blue painted wood',base:'#abd0d4',ink:'#173b48',muted:'#284f5b',texture:'painted-wood',back:'#255d85'},
 {id:'cobalt',name:'Royal blue baize',base:'#183f73',ink:'#f6f0dc',muted:'#d1dfed',texture:'baize',back:'#234d86'},
 {id:'cherry',name:'Rose velvet',base:'#603d53',ink:'#fff2e8',muted:'#ebd4df',texture:'baize',back:'#793954'},
 {id:'lagoon',name:'Walnut writing desk',base:'#664731',ink:'#fff1d9',muted:'#ecd9be',texture:'walnut',back:'#234d86'},
 {id:'royal',name:'Regency plum',base:'#37294c',ink:'#fff1d9',muted:'#e1d2ea',texture:'leather',back:'#5d3b7a'},
 {id:'blossom',name:'Ivory linen',base:'#ded9c9',ink:'#333d3c',muted:'#4c5753',texture:'linen',back:'#235c5c'},
 {id:'obsidian',name:'Slate studio',base:'#29353d',ink:'#f2f1e9',muted:'#cbd6d8',texture:'linen',back:'#384e63'},
] as const;
export function solitaireTable(id:unknown){return SOLITAIRE_TABLES.find(t=>t.id===id)||SOLITAIRE_TABLES[0]}
export type SolitaireDisplay={table:TableScene|null;scale:'fit'|'large'};
export function solitaireDisplay(value:unknown):SolitaireDisplay{const v=value as Partial<SolitaireDisplay>|null;return{table:SOLITAIRE_TABLES.some(t=>t.id===v?.table)?v!.table!:null,scale:v?.scale==='large'?'large':'fit'}}
export function solitaireMetrics(width:number,columns:number,large=false){
 const gap=width<500?7:12,card=Math.max(large?76:48,Math.min(large?132:108,Math.floor((width-gap*(columns-1))/columns))),height=card*1.4;
 return{card,height,gap,up:Math.max(24,Math.round(card*.36)),down:Math.max(9,Math.round(card*.14)),width:card*columns+gap*(columns-1)};
}
