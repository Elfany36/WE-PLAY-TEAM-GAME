'use client';
import {useId,useState,type ReactNode} from 'react';
import {ChevronDown,Eye,EyeOff} from 'lucide-react';

export default function Disclosure({title,hint,children,initiallyOpen=true,className=''}:{title:string;hint?:string;children:ReactNode;initiallyOpen?:boolean;className?:string}){
 const [open,setOpen]=useState(initiallyOpen),id=useId();
 return <section className={'studio-disclosure '+className+(open?' is-open':' is-closed')}>
  <header><div><h2>{title}</h2>{hint&&<p>{hint}</p>}</div><button type="button" className="disclosure-toggle" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>{open?<EyeOff size={17}/>:<Eye size={17}/>}<span>{open?'Hide':'Show'} {title.toLowerCase()}</span><ChevronDown size={15}/></button></header>
  <div id={id} hidden={!open}>{children}</div>
 </section>;
}
