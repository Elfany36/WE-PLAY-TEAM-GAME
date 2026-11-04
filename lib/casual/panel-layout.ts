export type DockSide='left'|'right'|'above'|'below';
export type PanelId='players'|'chat'|'guide';
export type PanelLayout=Record<PanelId,{side:DockSide;width:number;height:number}>;
export const defaultPanelLayout:PanelLayout={players:{side:'right',width:300,height:410},chat:{side:'right',width:300,height:450},guide:{side:'right',width:300,height:320}};
export function readPanelLayout(value:unknown):PanelLayout{
 const result=structuredClone(defaultPanelLayout);
 for(const id of ['players','chat','guide'] as const){const p=(value as Partial<PanelLayout>|null)?.[id];if(!p)continue;
  if(['left','right','above','below'].includes(p.side))result[id].side=p.side;
  if(Number.isFinite(p.width))result[id].width=Math.max(260,Math.min(480,p.width));
  if(Number.isFinite(p.height))result[id].height=Math.max(220,Math.min(800,p.height));
 }return result;
}
/** Build only occupied columns; hidden panels retain a restore header in place. */
export function panelGrid(layout:PanelLayout,width:number,collapsed:Partial<Record<PanelId,boolean>>={}){
 const ids=['guide','players','chat'] as const,left=ids.filter(id=>layout[id].side==='left'),right=ids.filter(id=>layout[id].side==='right');
 const sideWidth=(left.length?Math.max(...left.map(id=>layout[id].width)):0)+(right.length?Math.max(...right.map(id=>layout[id].width)):0);
 const stack=width<820||width-sideWidth-(left.length?20:0)-(right.length?20:0)<440;
 if(stack){const order=[...ids.filter(id=>layout[id].side==='above'),'game',...ids.filter(id=>layout[id].side!=='above')];return{gridTemplateAreas:order.map(id=>'"'+id+'"').join(' '),gridTemplateColumns:'minmax(0,1fr)',gridTemplateRows:'none'};}
 const columns=[...(left.length?[Math.max(...left.map(id=>layout[id].width))+'px']:[]),'minmax(0,1fr)',...(right.length?[Math.max(...right.map(id=>layout[id].width))+'px']:[])];
 const rows:string[][]=[],heights:string[]=[];const height=(id:PanelId)=>collapsed[id]?60:layout[id].height;
 for(const id of ids.filter(id=>layout[id].side==='above')){rows.push(columns.map(()=>id));heights.push(height(id)+'px')}
 const middle=Math.max(1,left.length,right.length);for(let i=0;i<middle;i++){rows.push([...(left.length?[left[i]||'.']:[]),'game',...(right.length?[right[i]||'.']:[])]);const h=Math.max(...[left[i],right[i]].filter((id):id is PanelId=>!!id).map(height),0);heights.push(i===middle-1?'minmax('+h+'px,auto)':h+'px')}
 for(const id of ids.filter(id=>layout[id].side==='below')){rows.push(columns.map(()=>id));heights.push(height(id)+'px')}
 return{gridTemplateAreas:rows.map(row=>'"'+row.join(' ')+'"').join(' '),gridTemplateColumns:columns.join(' '),gridTemplateRows:heights.join(' ')};
}
