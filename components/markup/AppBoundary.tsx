'use client';
import {Component,type ReactNode} from 'react';
export default class AppBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<main className="app-recovery" role="alert"><span>MARKUP · A MOMENT TO RESET</span><h1>Let’s get you back to building.</h1><p>This view could not open. Your saved work remains in this browser. Reload to try again or return to the overview.</p><div><button onClick={()=>location.reload()}>Reload this view</button><button onClick={()=>{location.href=location.pathname}}>Open overview</button></div></main>:this.props.children;}
}
