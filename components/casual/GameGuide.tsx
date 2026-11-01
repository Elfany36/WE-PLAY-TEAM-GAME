'use client';
import {BookOpen,ChevronDown} from 'lucide-react';
export default function GameGuide({children,label='Controls & quick guide'}:{children:React.ReactNode;label?:string}){return <details className="game-guide"><summary><BookOpen size={18}/><span>{label}</span><ChevronDown size={16}/></summary><div>{children}</div></details>}
