import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {dirname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
/** Keep two preceding releases' immutable URLs usable by already-open tabs. */
export function restoreClientAssets(destination){
 const root=resolve(destination),pack=JSON.parse(gunzipSync(readFileSync(new URL('../compat/previous-client-assets.json.gz',import.meta.url))).toString('utf8'));
 if(pack.schema!==1||!Array.isArray(pack.files))throw Error('Unsupported compatibility asset pack');
 let restored=0;
 for(const file of pack.files){
  if(!/^_next\/static\/[a-zA-Z0-9_./~-]+\.(js|css)$/.test(file.path))throw Error('Invalid retained asset path');
  const target=resolve(root,file.path);if(!target.startsWith(root+sep))throw Error('Retained asset escapes output');
  const data=Buffer.from(file.base64,'base64');
  if(data.length!==file.bytes||createHash('sha256').update(data).digest('hex')!==file.sha256)throw Error('Retained asset integrity failed: '+file.path);
  if(existsSync(target)){if(!readFileSync(target).equals(data))throw Error('Immutable asset collision: '+file.path);continue}
  mkdirSync(dirname(target),{recursive:true});writeFileSync(target,data);restored++;
 }
 return {releases:pack.releases.length,checked:pack.files.length,restored};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.argv[2])throw Error('Pass the built client asset directory');
 console.log('Previous release assets:',restoreClientAssets(process.argv[2]));
}
