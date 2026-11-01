'use client';
import GameSurface from './GameSurface';
import LegacyGameSurface from './LegacyGameSurface';
/** Terra retains the exact prior viewport implementation. */
export default function FlexibleSurface({preserveLayout,...props}:React.ComponentProps<typeof GameSurface>&{preserveLayout?:boolean}){return preserveLayout?<LegacyGameSurface {...props}/>:<GameSurface {...props}/>}
