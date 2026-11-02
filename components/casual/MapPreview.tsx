'use client';
import {memo} from 'react';
export default memo(function MapPreview({theme,kind,size=48}:{theme:string;kind:string;size?:number}){return <img className="map-preview" src={'map-previews/v19/'+kind+'-'+theme+(kind==='snake'?'-'+size:'')+'.svg'} alt="" width={320} height={216} loading="lazy" decoding="async"/>});
