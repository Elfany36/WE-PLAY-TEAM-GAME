'use client';
import {createContext,useContext} from 'react';
/** Undefined retains standalone guides; null waits for the dock to mount. */
export const GameInfoContext=createContext<HTMLElement|null|undefined>(undefined);
export const useGameInfoTarget=()=>useContext(GameInfoContext);
