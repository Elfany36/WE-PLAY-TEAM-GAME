'use client';
import {useCallback,useRef} from 'react';
/** Stable event identity with the current render's state, for memoized game views. */
export function useLiveCallback<T extends (...args:any[])=>any>(callback:T):T{
 const current=useRef(callback);current.current=callback;
 return useCallback(((...args:Parameters<T>)=>current.current(...args)) as T,[]);
}
