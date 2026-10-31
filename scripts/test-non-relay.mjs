import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
// These historical mixed suites execute Doodle Relay. Keep them intact and excluded.
const excluded=new Set(['arcade-v2.test.ts','chat.test.ts','expansion.test.ts','expansion-api.test.ts']);
const files=readdirSync('tests').filter(name=>name.endsWith('.test.ts')&&!excluded.has(name)).sort().map(name=>'tests/'+name);
const result=spawnSync(process.execPath,['--experimental-strip-types','--test','--test-isolation=none',...files],{stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
