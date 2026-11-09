'use client';
import {createPortal} from 'react-dom';
import type {ReactNode} from 'react';
import {useGameWindow} from '../games/GameWindow';
/** Keep normal room controls in place; put optional fullscreen actions in its menu. */
export default function WindowSettings({children,urgent=false}:{children:ReactNode;urgent?:boolean}){
 const view=useGameWindow();
 if(!view?.active||urgent)return <>{children}</>;
 return view.settingsTarget?createPortal(children,view.settingsTarget):null;
}
