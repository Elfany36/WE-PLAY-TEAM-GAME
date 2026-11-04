'use client';
import {memo} from 'react';
const suits:Record<string,string>={'♠':'spades','♥':'hearts','♦':'diamonds','♣':'clubs'};
export const playingCardPath=(rank:number,suit:string)=>'playing-cards/'+suits[suit]+'-'+(rank===1?'ace':rank===11?'jack':rank===12?'queen':rank===13?'king':rank)+'.svg';
/** Complete conventional card faces, including mirrored indices and courts. */
export default memo(function PlayingCardFace({rank,suit}:{rank:number;suit:string}){
 return <img className="sol-card-art" src={playingCardPath(rank,suit)} alt="" width={1500} height={2100} decoding="async" draggable={false}/>;
});
