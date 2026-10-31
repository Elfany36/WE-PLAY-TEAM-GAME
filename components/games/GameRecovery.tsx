'use client';
import {Component,type ReactNode} from 'react';
import {reloadRoomView} from '../../lib/room-lifecycle';

/** A rejected lazy import must not replace the whole application with a blank screen. */
export default class GameRecovery extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return{failed:true}}
 render(){return this.state.failed?<section className="game-recovery" role="alert"><h2>Let’s bring your game back.</h2><p>The view could not load. Reload to download the current version and reconnect to your online room.</p><button className="button dark" onClick={reloadRoomView}>Reload game view</button><small>Local games start over after a reload.</small></section>:this.props.children}
}
