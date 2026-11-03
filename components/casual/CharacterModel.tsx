'use client';
import {memo} from 'react';
import {modelFamily,modelLabel,playerModel,playerColor,type Appearance} from '../../lib/casual/appearance';
import {modelDataUrl} from '../../lib/casual/model-visuals';
export default memo(function CharacterModel({mode,player,size=40}:{mode:string;player?:{color:number;appearance?:Appearance};size?:number}){
 const family=modelFamily(mode),model=playerModel(player,family);
 return <img className="character-model" data-family={family} data-model={model} src={modelDataUrl(family,model,playerColor(player).fill)} alt={modelLabel(family,model)} width={size} height={size} decoding="async"/>;
});
