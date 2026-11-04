'use client';
import {BookOpen,ChevronDown} from 'lucide-react';
import {createPortal} from 'react-dom';
import {useGameInfoTarget} from './GameInfoContext';
export default function GameGuide({children,label='Controls & quick guide'}:{children:React.ReactNode;label?:string}){const target=useGameInfoTarget(),content=<details className="game-guide"><summary><BookOpen size={18}/><span>{label}</span><ChevronDown size={16}/></summary><div>{children}</div></details>;return target===undefined?content:target?createPortal(content,target):null}
