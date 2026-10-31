import fs from 'node:fs';
import {reference} from '../lib/reference-snapshot.ts';
import {buildFacts} from '../lib/build-facts.ts';
const contents=JSON.stringify(buildFacts(reference));
const file=new URL('../data/question-facts.json',import.meta.url);
if(fs.readFileSync(file,'utf8')!==contents)fs.writeFileSync(file,contents);
console.log(`Question bank ready: ${JSON.parse(contents).length} facts.`);
