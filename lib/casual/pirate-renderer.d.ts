import type {publicPirate} from './pirate.ts';
export type PirateRenderWorld=ReturnType<typeof publicPirate>['world'];
export type PirateRenderOptions={effects:boolean;shake:boolean;camera:'follow'|'action'|'arena';focusId:string;ownId?:string;countdown:number;paused:boolean;finished:boolean;insets?:Partial<import('./pirate-camera').CameraInsets>;pointer?:{u:number;v:number;scale:number}|null};
export function loadPirateArt():Promise<unknown>;
export function createPirateRenderer(canvas:HTMLCanvasElement,art:unknown):{resize(width:number,pixelRatio?:number,height?:number):void;point(clientX:number,clientY:number):{x:number;y:number};aim(u:number,v:number):{x:number;y:number};camera():{x:number;y:number;z:number;width:number;height:number};render(world:PirateRenderWorld,options:PirateRenderOptions,dt?:number):void;dispose():void};
