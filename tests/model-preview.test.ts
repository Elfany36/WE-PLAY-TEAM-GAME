import {test} from 'node:test';import assert from 'node:assert/strict';
import {modelSvg} from '../lib/casual/model-visuals.ts';
test('board previews expose all pieces, sides, crowns and values through the real model renderer',()=>{
 const pieces=['k','q','r','b','n','p'].map(piece=>modelSvg('chess','wood','#4dbbff',{piece}));assert.equal(new Set(pieces).size,6);assert.notEqual(modelSvg('chess','wood','#4dbbff',{piece:'q',dark:true}),pieces[1]);
 assert.notEqual(modelSvg('dama','narra','#4dbbff',{king:true}),modelSvg('dama','narra','#4dbbff',{king:false}));assert.match(modelSvg('scidama','droplet','#4dbbff',{value:90}),/>90</);assert.match(modelSvg('scidama','droplet','#4dbbff',{value:110}),/>110</);
});
test('material sets keep their material and side marker while applying a visible signature accent',()=>{
 for(const [family,model]of [['chess','wood'],['dama','narra'],['scidama','coral']] as const){const blue=modelSvg(family,model,'#4dbbff'),rose=modelSvg(family,model,'#ff70b5');assert.notEqual(blue,rose);assert(blue.includes('#4dbbff'));assert(rose.includes('#ff70b5'));assert.notEqual(modelSvg(family,model,'#4dbbff',{dark:true}),blue)}
});
test('snake and tank detail views change artwork without altering model identity',()=>{
 assert.notEqual(modelSvg('snake','cobra','#4dbbff'),modelSvg('snake','cobra','#4dbbff',{part:'head'}));const tank=['hull','turret',undefined].map(part=>modelSvg('tank','scout','#4dbbff',{part:part as any}));assert.equal(new Set(tank).size,3);
});
