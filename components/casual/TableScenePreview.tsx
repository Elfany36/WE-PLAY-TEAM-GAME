'use client';
import {memo} from 'react';
export default memo(function TableScenePreview({theme,mode}:{theme:string;mode:string}){const kind=['chess','dama','scidama','ladders'].includes(mode)?'board':mode==='pool'?'pool':'cards';return <img className="table-scene-art" src={'map-previews/v19/table-'+theme+'-'+kind+'.svg'} alt="" width={320} height={216} loading="lazy" decoding="async"/>});
