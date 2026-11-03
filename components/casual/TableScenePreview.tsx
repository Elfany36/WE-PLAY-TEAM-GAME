'use client';
import {memo} from 'react';
import {tableScene} from '../../lib/casual/scenes';
export default memo(function TableScenePreview({theme,mode}:{theme:string;mode:string}){
 if(mode==='generals'||mode==='fleet'){
  const s=tableScene(theme),cols=mode==='generals'?9:10,rows=mode==='generals'?8:10,cell=mode==='generals'?19:16,x=160-cols*cell/2,y=108-rows*cell/2;
  const tiles=Array.from({length:rows*cols},(_,i)=>'<rect x="'+(x+i%cols*cell)+'" y="'+(y+Math.floor(i/cols)*cell)+'" width="'+(cell-1)+'" height="'+(cell-1)+'" rx="1" fill="'+(mode==='generals'?(i%cols+Math.floor(i/cols))%2?s.dark:s.light:s.feltLight)+'" stroke="'+s.accent+'" stroke-opacity=".2" stroke-width=".5"/>').join('');
  const models=mode==='generals'?[[2,6],[6,1],[4,5]].map(([cx,cy])=>'<path d="M'+(x+cx*cell+4)+' '+(y+cy*cell+3)+'h11v13h-11Z" fill="'+s.felt+'" stroke="'+s.accent+'"/><path d="m'+(x+cx*cell+7)+' '+(y+cy*cell+7)+' 2 4 2-4" stroke="'+s.accent+'" fill="none"/>').join(''):'<path d="M'+(x+2*cell)+' '+(y+6*cell+4)+'h55l7 5-7 5h-55Z" fill="'+s.accent+'" stroke="'+s.ink+'"/><circle cx="'+(x+7.5*cell)+'" cy="'+(y+2.5*cell)+'" r="5" fill="#ffb48e"/>';
  const art='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 216"><rect width="320" height="216" rx="16" fill="'+s.felt+'"/><rect x="'+(x-9)+'" y="'+(y-9)+'" width="'+(cols*cell+18)+'" height="'+(rows*cell+18)+'" rx="9" fill="'+s.wood+'"/>'+tiles+models+'</svg>';
  return <img className="table-scene-art" src={'data:image/svg+xml,'+encodeURIComponent(art)} alt="" width={320} height={216} loading="lazy" decoding="async"/>;
 }
 const kind=['chess','dama','scidama','ladders'].includes(mode)?'board':mode==='pool'?'pool':'cards';return <img className="table-scene-art" src={'map-previews/v19/table-'+theme+'-'+kind+'.svg'} alt="" width={320} height={216} loading="lazy" decoding="async"/>;
});
