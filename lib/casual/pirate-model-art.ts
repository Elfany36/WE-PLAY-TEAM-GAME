import {pirateModel} from './pirate-models.ts';
/** Original pirate portraits; the animated match uses the uploaded sprite sheets. */
export function piratePortrait(id:string,color:string){
 const m=pirateModel(id),c=m.character,ink='#1d283b',skin=c===2?'#83ba61':c===5?'#76afcb':c===3?'#d19b7e':'#f2c79e';
 const rect=(x:number,y:number,w:number,h:number,fill:string)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${fill}" stroke="${ink}" stroke-width="2"/>`;
 let body=c===5?`<path d="M20 61q-8-30 26-33 31-3 34 24l12-10-4 22 4 10-15-5q-10 21-44 10L16 86l7-17Z" fill="${skin}" stroke="${ink}" stroke-width="3"/>`:
 rect(c===3?21:30,43,c===3?58:40,38,color)+rect(c===3?22:33,c===2?15:21,c===3?56:34,c===2?48:35,skin)+rect(26,48,10,25,skin)+rect(66,48,10,25,skin)+rect(31,81,17,10,ink)+rect(55,81,17,10,ink);
 body+=`<path d="M35 56h33v9H35Z" fill="${color}"/><path d="M32 73h38v7H32Z" fill="${ink}"/>${rect(47,72,9,9,'#e7ba64')}<circle cx="43" cy="38" r="3" fill="${ink}"/><circle cx="60" cy="38" r="3" fill="${ink}"/><path d="M45 47q8 5 14-1" fill="none" stroke="${ink}" stroke-width="2"/>`;
 const hats:Record<string,string>={
  cap:`<path d="M29 24q3-19 24-17l16 17Z" fill="${color}" stroke="${ink}" stroke-width="3"/><path d="M25 24h49v7H25Z" fill="${color}" stroke="${ink}" stroke-width="2"/>`,
  bandana:`<path d="M28 24h45v9H28Zm43 4 16 6-13 7Z" fill="${color}" stroke="${ink}" stroke-width="2"/>`,
  tricorn:`<path d="m17 28 14-17 21 7 21-7 13 17-34 6Z" fill="${ink}" stroke="#e5bb6b" stroke-width="3"/><path d="m49 21 4-4 4 4-4 4Z" fill="#f5ecd8"/>`,
  leaf:`<path d="M49 20Q24 8 43 4L53 17Q58 0 72 9L56 24Z" fill="${color}" stroke="${ink}" stroke-width="2"/>`,
  helmet:`<path d="M23 31V18q29-20 56 0v13Z" fill="#94a8b4" stroke="${ink}" stroke-width="3"/><path d="M48 8h8v23h-8Z" fill="${color}"/>`,
  goggles:`${rect(28,29,46,9,ink)}${rect(31,29,17,12,'#9edbea')}${rect(54,29,17,12,'#9edbea')}`,
  mask:`<path d="M29 34h43v11H29Z" fill="${color}" stroke="${ink}" stroke-width="2"/>`,
  crown:`<path d="m29 26-2-18 16 10 10-15 11 15 13-10-3 18Z" fill="#e4ba65" stroke="${ink}" stroke-width="2"/>`,
  sailor:`<path d="M24 28V17h45v11Z" fill="#f4eee0" stroke="${ink}" stroke-width="2"/><path d="M22 28h51" stroke="${color}" stroke-width="7"/>`,
  feather:`<path d="M31 28 18 5q27-4 24 22Z" fill="${color}" stroke="${ink}" stroke-width="2"/><path d="M25 9 38 30" stroke="#f4ecd8" stroke-width="2"/>`,
  hood:`<path d="M24 47V24q29-34 53 0v23l-10-7V27q-15-13-31 0v13Z" fill="${color}" stroke="${ink}" stroke-width="3"/>`,
  storm:`<path d="m18 82 12-50 43 1 13 48-20-8-16 12-16-12Z" fill="${color}" stroke="${ink}" stroke-width="3"/>`,
  belt:`${rect(20,67,61,12,ink)}${rect(45,65,14,16,'#e4ba65')}`,
 };
 const hat=hats[m.gear]||hats.cap;
 return `<ellipse cx="51" cy="92" rx="32" ry="5" fill="#142b3d22"/>${m.gear==='storm'?hat:''}${body}${m.gear==='storm'?hats.tricorn:hat}<g transform="translate(76 77)"><circle r="11" fill="#253447" stroke="#f0d496" stroke-width="2"/><path d="M1-11v-6l6-3" fill="none" stroke="#d99d5d" stroke-width="3"/><circle cx="7" cy="-20" r="3" fill="#f9c35c"/></g>`;
}
