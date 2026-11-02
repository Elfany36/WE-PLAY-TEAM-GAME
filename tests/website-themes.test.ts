import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WEBSITE_THEMES,websiteTheme} from '../lib/website-themes.ts';
import {themeInitScript} from '../lib/client-state.ts';
const luminance=(hex:string)=>{const c=hex.slice(1).match(/../g)!.map(h=>parseInt(h,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
test('all ten website palettes meet 4.5:1 text contrast in both appearances',()=>{
 const css=readFileSync('app/website-themes.css','utf8');assert.equal(WEBSITE_THEMES.length,10);assert(WEBSITE_THEMES.some(t=>t.id==='pink'));
 for(const theme of WEBSITE_THEMES)for(const mode of ['light','dark']){
  const selector=`:root[data-site-theme=${theme.id}][data-theme=${mode}]`,block=css.slice(css.indexOf(selector)+selector.length).match(/^\{([^}]+)\}/)![1],vars=Object.fromEntries([...block.matchAll(/--([\w-]+):(#\w+)/g)].map(m=>[m[1],m[2]]));
  for(const [a,b]of [['text','surface'],['text','page'],['muted','surface'],['muted','surface-soft'],['subtle','surface-raised'],['accent','surface'],['button-text','button-bg'],['button-text','button-hover'],['success-text','success-bg'],['warning-text','warning-bg']]){const ratio=(Math.max(luminance(vars[a]),luminance(vars[b]))+.05)/(Math.min(luminance(vars[a]),luminance(vars[b]))+.05);assert(ratio>=4.5,`${theme.id} ${mode} ${a}/${b}: ${ratio}`)}
 }
});
test('saved palettes apply before rendering, including corrupt or blocked storage recovery',()=>{
 assert.equal(websiteTheme('<script>'),'indigo');
 for(const palette of WEBSITE_THEMES){const root={dataset:{}};new Function('localStorage','document','matchMedia',themeInitScript)({getItem:(key:string)=>JSON.stringify(key==='markup-theme'?'dark':palette.id)},{documentElement:root},()=>({matches:false}));assert.deepEqual(root.dataset,{theme:'dark',siteTheme:palette.id})}
 const root={dataset:{}};new Function('localStorage','document','matchMedia',themeInitScript)({getItem:()=>{throw Error('blocked')}},{documentElement:root},()=>({matches:false}));assert.deepEqual(root.dataset,{theme:'light',siteTheme:'indigo'});
});
