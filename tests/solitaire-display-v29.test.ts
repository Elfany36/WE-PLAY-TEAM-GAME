import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {solitaireMetrics,solitaireDisplay,SOLITAIRE_TABLES} from '../lib/casual/solitaire-display.ts';
import {hasTableScene} from '../lib/casual/scenes.ts';
test('every Solitaire column uses the same portrait geometry as stock and foundations, including narrow screens and large-card preference',()=>{
 for(const width of [280,342,600,900,1440])for(const columns of [7,8,10])for(const large of [false,true]){const m=solitaireMetrics(width,columns,large);assert(Math.abs(m.height/m.card-1.4)<1e-12);assert(m.card>=(large?76:48));assert.equal(m.width,m.card*columns+m.gap*(columns-1));assert(m.up>=24&&m.down>=9);assert(m.up<m.height&&m.down<m.height)}
 assert(solitaireMetrics(1440,7,true).card>solitaireMetrics(1440,7,false).card);assert(solitaireMetrics(342,7).width>=342);
});
test('personal table preferences recover from corrupt storage and both new games expose room table choices',()=>{
 for(const bad of [null,2,'oops',{},[],{table:'missing',scale:'enormous'}])assert.deepEqual(solitaireDisplay(bad),{table:null,scale:'fit'});
 assert.deepEqual(solitaireDisplay({table:'aurora',scale:'large'}),{table:'aurora',scale:'large'});assert(hasTableScene('solitaire'));assert(hasTableScene('sketch'));
 const lum=(hex:string)=>{const v=hex.slice(1).match(/../g)!.map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722};
 for(const t of SOLITAIRE_TABLES)for(const text of [t.ink,t.muted]){const a=lum(t.base),b=lum(text);assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,t.name+' text contrast')}
});
test('all 52 traditional vector faces match their source manifest and contain no executable or external content',()=>{
 const root=new URL('../public/playing-cards/',import.meta.url),manifest=JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'));assert.equal(manifest.files.length,52);assert.equal(manifest.license,'CC0-1.0');
 for(const file of manifest.files){const bytes=readFileSync(new URL(file.name,root)),svg=bytes.toString();assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);assert(/viewBox="0 0 1500 2100"/.test(svg));assert(!/<(?:script|foreignObject|image|text)\b|\bon\w+=|(?:href|src)=/i.test(svg),file.name)}
});
