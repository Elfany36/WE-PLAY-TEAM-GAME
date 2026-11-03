import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MODEL_SETS} from '../lib/casual/model-catalog.ts';
import {modelSvg,modelDataUrl} from '../lib/casual/model-visuals.ts';
import {FLEET_STYLES,FLEET_UNITS} from '../lib/casual/fleet.ts';
import {fleetDrawing} from '../lib/casual/tactical-visuals.ts';

test('all Generals collections conceal rank in both artwork and silhouette',()=>{
 for(const id of MODEL_SETS.generals){
  const backs=new Set(Array.from({length:15},(_,value)=>modelSvg('generals',id,'#315cc7',{piece:'back',value})));
  assert.equal(backs.size,1,id+' must not disclose rank through its back');
  assert.equal(new Set(Array.from({length:15},(_,value)=>modelSvg('generals',id,'#315cc7',{value}))).size,15,id);
 }
});
test('all fleet classes, themes and orientations have separate cached previews',()=>{
 for(const id of MODEL_SETS.fleet){const previews=new Set<string>();for(const fleetStyle of FLEET_STYLES)for(const unit of FLEET_UNITS)for(const vertical of [false,true]){
  const options={fleetStyle,fleetUnit:unit.id,vertical},svg=modelSvg('fleet',id,'#315cc7',options),url=modelDataUrl('fleet',id,'#315cc7',options);
  assert.equal(decodeURIComponent(url.split(',')[1]),svg);assert(!/NaN|undefined|Infinity/.test(svg));previews.add(svg);
 }assert.equal(previews.size,40,id)}
});
test('fleet drawing stays deterministic after cache eviction and has no SVG identifier collisions',()=>{
 const first=fleetDrawing('naval',0,'#315cc7',5,0);
 for(let i=0;i<300;i++)fleetDrawing('naval',i%15,'#'+i.toString(16).padStart(6,'0'),2,4);
 assert.equal(fleetDrawing('naval',0,'#315cc7',5,0),first);
 for(const style of FLEET_STYLES)for(let i=0;i<15;i++)for(const [variant,unit] of FLEET_UNITS.entries()){
  const art=fleetDrawing(style,i,'#315cc7',unit.length,variant);assert(!/\bid=|url\(|<filter|<animate|<script|onload|href=|NaN|undefined/.test(art));
 }
});
