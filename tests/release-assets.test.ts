import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,posix} from 'node:path';
import {restoreClientAssets} from '../scripts/retain-client-assets.mjs';
test('previous-release lazy imports retain complete immutable dependency graphs and restore idempotently',()=>{
 const dir=mkdtempSync(join(tmpdir(),'markup-asset-compat-'));
 try{
  const result=restoreClientAssets(dir),manifest=JSON.parse(readFileSync(new URL('../compat/previous-client-assets.manifest.json',import.meta.url),'utf8'));
  assert.equal(result.releases,2);assert.equal(result.restored,manifest.files.length);
  const names=new Set(manifest.files.map((f:{path:string})=>f.path));
  assert(names.has('_next/static/chunks/ActionWorld-DeXf8GqX.js'));
  assert(names.has('_next/static/chunks/ActionWorld-Ck2OWBM7.js'));
  for(const file of manifest.files){if(!file.path.endsWith('.js'))continue;const source=readFileSync(join(dir,file.path),'utf8');for(const match of source.matchAll(/\b(?:from\s*|import\s*\()(['"`])(\.[^'"`]+)\1/g)){const path=posix.normalize(posix.join(posix.dirname(file.path),match[2]));assert(names.has(path),'Missing prior dependency: '+path)}}
  assert.equal(restoreClientAssets(dir).restored,0);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
