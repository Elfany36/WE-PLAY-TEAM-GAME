import type {ReferenceData,ReferenceEntry} from './reference-types.ts';
import {questionDefinition,type Fact} from './question-bank.ts';
export function buildFacts(reference:ReferenceData):Fact[]{
// Editor and specification datasets sometimes spell the same function with or
// without empty parentheses. Keep one scored identity per kind/context/name.
const canonical=new Map<string,ReferenceEntry>();
for(const e of reference.entries){const key=[e.kind,e.context||'',e.name.replace(/\(\)$/,'')].join('|');if(!canonical.has(key)||e.name.endsWith('()'))canonical.set(key,e)}
function cleanText(s:string){return s.replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[*`]/g,'').replace(/\\n/g,'\n').replace(/\s+/g,' ').trim();}
function label(e:ReferenceEntry){if(e.kind==='HTML element')return '<'+e.name+'>';if(e.context)return e.name+' ('+(e.context==='global'?'global attribute':e.context)+')';return e.name;}
const candidates=[...canonical.values()].filter(e=>e.description&&e.description.length>30&&e.description.length<2200&&e.status.standard_track===true&&e.status.experimental===false&&e.status.deprecated===false&&!/^[-_]/.test(e.name)&&e.references.some(r=>/whatwg\.org|w3\.org|csswg\.org|developer\.mozilla\.org/.test(r.url)));
const occurrences=new Map<string,number>();for(const e of candidates){const d=cleanText(e.description);occurrences.set(d,(occurrences.get(d)||0)+1)}
const initialFacts:Fact[]=candidates.filter(e=>occurrences.get(cleanText(e.description))===1).map(e=>({id:e.id,label:label(e),description:cleanText(e.description),source:(e.references.find(r=>/whatwg\.org|w3\.org|csswg\.org/.test(r.url))||e.references[0]).url,kind:e.kind,referenceId:e.id}));
const stemCounts=new Map<string,number>();for(const f of initialFacts){const stem=questionDefinition(f);stemCounts.set(stem,(stemCounts.get(stem)||0)+1)}
const facts:Fact[]=initialFacts.filter(f=>stemCounts.get(questionDefinition(f))===1);

return facts;
}
