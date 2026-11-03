import {modelDataUrl} from '../../lib/casual/model-visuals';
import type {ModelFamily} from '../../lib/casual/appearance';
const images=new Map<string,HTMLImageElement>();
/** SVGs decode once per look, then the frame loop only blits a bounded cached image. */
export function paintGameModel(c:CanvasRenderingContext2D,family:ModelFamily,model:string,color:string,x:number,y:number,w:number,h:number,options:Parameters<typeof modelDataUrl>[3]={}){
 const key=[family,model,color,options.part].join(':');let image=images.get(key);
 if(!image){image=new Image();image.src=modelDataUrl(family,model,color,options);if(images.size>=256)images.delete(images.keys().next().value!);images.set(key,image)}
 if(!image.complete||!image.naturalWidth)return false;
 c.drawImage(image,x,y,w,h);return true;
}
