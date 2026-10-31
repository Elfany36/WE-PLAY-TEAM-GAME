import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {guides} from '../lib/guides.ts';
import {referenceRecipes} from '../lib/reference-recipes.ts';
import {exerciseSolutions} from '../lib/exercise-solutions.ts';
import tasks from '../data/code-tasks.json' with {type:'json'};
import {cssDemonstration} from '../lib/code-visual.ts';
const require=createRequire(import.meta.url),postcss=createRequire(require.resolve('vite'))('postcss');
let count=0;
function verify(label,css){assert.doesNotThrow(()=>postcss.parse(css),label);count++;}
for(const guide of guides)verify('guide '+guide.id,guide.css);
for(const r of referenceRecipes)verify('reference example '+r.name,r.css);
for(const [id,s] of Object.entries(exerciseSolutions))verify('exercise '+id,s.css);
for(const task of tasks.filter(t=>t.topic==='CSS')){const completed=task.code.replace('____',task.answer);verify('task '+task.id,completed);verify('context '+task.id,cssDemonstration(completed).css);}
for(const file of ['app/globals.css','app/themes.css','app/arcade.css','app/practice.css','app/studio.css','app/expansion.css','app/room.css','app/refinements.css','app/arcade-v2.css'])verify(file,fs.readFileSync(file,'utf8'));
console.log(JSON.stringify({ok:true,cssDocumentsParsed:count,note:'Syntax parsing only; browser behavior is checked separately.'}));
