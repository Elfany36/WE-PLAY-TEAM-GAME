import {readStored,writeStored} from './client-state.ts';
export type ControlAction={id:string;label:string;key:string;codes:string[]};
const a=(id:string,label:string,key:string,...codes:string[]):ControlAction=>({id,label,key,codes});
const move=[a('up','Move up','ArrowUp','ArrowUp','KeyW'),a('down','Move down','ArrowDown','ArrowDown','KeyS'),a('left','Move left','ArrowLeft','ArrowLeft','KeyA'),a('right','Move right','ArrowRight','ArrowRight','KeyD')];
const party=move.map(x=>({...x,key:({up:'w',down:'s',left:'a',right:'d'} as Record<string,string>)[x.id]}));
const board=[a('previous','Previous square','ArrowLeft','ArrowLeft'),a('next','Next square','ArrowRight','ArrowRight'),a('choose','Select focused square',' ','Space','Enter')];
export const CONTROL_PROFILES:Record<string,{note:string;actions:ControlAction[]}>= {
 solitaire:{note:'Select a card, then its destination; drag also works. Double-click sends an eligible card to its foundation.',actions:[a('draw','Draw stock',' ','Space'),a('undo','Undo move','z','KeyZ'),a('hint','Show legal hint','h','KeyH')]},
 sketch:{note:'Draw with the pointer. Type guesses in chat. Only the current artist can use drawing tools.',actions:[a('undo','Undo stroke','z','KeyZ'),a('eraser','Toggle eraser','e','KeyE')]},
 generals:{note:'Focus the board. Select a piece, then an adjacent tile; setup swaps pieces.',actions:[...move,a('choose','Select tile',' ','Space','Enter'),a('cancel','Cancel selection','Backspace','Backspace')]},
 fleet:{note:'Focus the grid. Move your target, select a tile, or rotate a model during deployment.',actions:[...move,a('choose','Select tile',' ','Space','Enter'),a('rotate','Rotate model','r','KeyR')]},
 snake:{note:'Arrow keys or WASD turn your snake. Touch arrows and swipes always work.',actions:move},
 circuit:{note:'Steer with keys; touch controls remain available.',actions:[...move.map(x=>({...x,label:({up:'Accelerate',down:'Reverse / brake',left:'Steer left',right:'Steer right'} as Record<string,string>)[x.id]})),a('drift','Drift',' ','Space'),a('item','Use item','e','KeyE'),a('recover','Recover kart','r','KeyR')]},
 terra:{note:'Aim with the pointer. Number keys select tool slots.',actions:[move[2],move[3],a('jump','Jump',' ','Space','ArrowUp','KeyW'),a('use','Use aimed tool','f','KeyF'),a('inventory','Inventory','e','KeyE')]},
 tanks:{note:'Aim with the pointer. Your key choices apply to your own seat.',actions:[...party,a('action','Fire',' ','Space')]},
 sumo:{note:'Move toward an opponent, then dash. Your key choices apply to your own seat.',actions:[...party,a('action','Dash',' ','Space')]},
 marble:{note:'Jump gaps and brake before corners.',actions:[...party,a('action','Jump',' ','Space'),a('brake','Brake','Shift','ShiftLeft','ShiftRight')]},
 pong:{note:'Move your paddle or drag it on the court.',actions:[party[0],party[1]]},
 blocks:{note:'Hold a movement key to repeat. Touch controls stay available.',actions:[move[2],move[3],a('soft','Soft drop','ArrowDown','ArrowDown','KeyS'),a('rotate','Rotate clockwise','ArrowUp','ArrowUp','KeyW','KeyX'),a('counter','Rotate counterclockwise','z','KeyZ'),a('drop','Hard drop',' ','Space'),a('hold','Hold piece','c','KeyC','ShiftLeft','ShiftRight')]},
 pool:{note:'Focus the table to aim with keys. Pointer aiming and the power slider still work.',actions:[a('left','Aim left','ArrowLeft','ArrowLeft','KeyA'),a('right','Aim right','ArrowRight','ArrowRight','KeyD'),a('shoot','Shoot',' ','Space')]},
 ladders:{note:'Roll with your shortcut or the on-screen button.',actions:[a('roll','Roll die','r','KeyR')]},
 memory:{note:'Focus a card to use these keys. Tab and pointer controls always work.',actions:board},
 chess:{note:'Focus the board to select squares. Tab and pointer controls always work.',actions:board},
 dama:{note:'Focus the board to select squares. Tab and pointer controls always work.',actions:board},
 scidama:{note:'Focus the board to select squares. Tab and pointer controls always work.',actions:board},
 uno:{note:'Choose cards with the pointer or Tab. These shortcuts use enabled table buttons.',actions:[a('draw','Draw card','d','KeyD'),a('pass','Keep drawn card','p','KeyP'),a('uno','Call UNO','u','KeyU')]},
 property:{note:'Shortcuts act only when the matching action is available.',actions:[a('roll','Roll dice','r','KeyR'),a('end','End turn','e','KeyE')]},
 phone:{note:'Type sentences normally. Drawing shortcuts work outside text fields.',actions:[a('eraser','Toggle eraser','e','KeyE'),a('undo','Undo stroke','z','KeyZ'),a('redo','Redo stroke','y','KeyY'),a('fill','Toggle bucket','f','KeyF')]},
};
export type ControlBindings=Record<string,string>;
const cache=new Map<string,ControlBindings>();
const storageKey='markup-controls-v25';
export function validControlCode(code:unknown):code is string{return typeof code==='string'&&/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Enter|Backspace|ShiftLeft|ShiftRight|Comma|Period|Slash|Semicolon|Quote|BracketLeft|BracketRight|Minus|Equal|Numpad[0-9])$/.test(code)}
export function validateControlBindings(mode:string,value:unknown):ControlBindings{
 if(!value||typeof value!=='object'||Array.isArray(value))return{};const allowed=CONTROL_PROFILES[mode]?.actions||[],out:ControlBindings={};
 for(const row of allowed){const code=(value as Record<string,unknown>)[row.id];if(validControlCode(code))out[row.id]=code}return out;
}
export function controlBindings(mode:string){let value=cache.get(mode);if(!value){const stored=readStored(storageKey,{});value=validateControlBindings(mode,stored?.[mode]);cache.set(mode,value)}return value}
export function saveControlBindings(mode:string,value:ControlBindings){const valid=validateControlBindings(mode,value);cache.set(mode,valid);const previous=readStored(storageKey,{});return writeStored(storageKey,{...(previous&&typeof previous==='object'?previous:{}),[mode]:valid})}
export function controlConflict(mode:string,action:string,code:string,bindings:ControlBindings){return CONTROL_PROFILES[mode]?.actions.find(row=>row.id!==action&&(bindings[row.id]?[bindings[row.id]]:row.codes).includes(code))?.label}
export function controlKey(event:{key:string;code?:string},mode:string,bindings=controlBindings(mode)){
 const profile=CONTROL_PROFILES[mode];if(!profile)return event.key;
 const code=event.code||({' ':'Space',Enter:'Enter',Shift:'ShiftLeft',ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight'} as Record<string,string>)[event.key]||(/^[a-z]$/i.test(event.key)?'Key'+event.key.toUpperCase():'');
 const row=profile.actions.find(row=>(bindings[row.id]?[bindings[row.id]]:row.codes).includes(code));
 // A remapped default must stop producing its old action.
 if(!row&&profile.actions.some(row=>bindings[row.id]&&row.codes.includes(code)))return '';
 return row?.key??event.key;
}
export function controlHint(mode:string,action:string){const row=CONTROL_PROFILES[mode]?.actions.find(row=>row.id===action);if(!row)return '';const custom=controlBindings(mode)[action];return controlCodeLabel(custom||row.codes[0])}
export function controlCodeLabel(code:string){return code.replace(/^Key/,'').replace(/^Digit/,'').replace('Arrow','').replace('Left',' Left').replace('Right',' Right').replace(/^ /,'').replace('Space','Space bar')}
if(typeof window!=='undefined')window.addEventListener('storage',event=>{if(event.key===storageKey||event.key===null)cache.clear()});
