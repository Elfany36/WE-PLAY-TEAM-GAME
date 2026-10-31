import type {Lesson} from './curriculum';
// Parsed structure and accepted declarations supplement the portable regex checklist.
// This is focused exercise feedback, not a complete conformance/accessibility validator.
export function browserExerciseChecks(lesson:Lesson,html:string,css:string,results:boolean[]){
 if(typeof DOMParser==='undefined')return results;
 const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script,style,template,textarea').forEach(e=>e.remove());
 const text=(e:Element|null)=>!!e?.textContent?.trim();
 const all=(s:string)=>Array.from(doc.querySelectorAll(s));
 const hasText=(s:string)=>all(s).some(text),query=(s:string)=>!!doc.querySelector(s);
 const aliases:Record<string,string>={'challenge-1':'css-4','challenge-2':'css-5','challenge-4':'css-12','challenge-5':'html-11','challenge-7':'html-10','challenge-8':'html-12'};
 const id=aliases[lesson.id]||lesson.id;
 const items=(s:string)=>all(s).some(e=>Array.from(e.children).filter(n=>n.tagName==='LI'&&text(n)).length>=3);
 const validRadios=()=>all('form fieldset').some(e=>{const radios=Array.from(e.querySelectorAll('input[type="radio"][name="path"]'));return radios.length>=2&&radios.every(r=>!!r.closest('label')?.textContent?.trim())&&new Set(radios.map(r=>r.getAttribute('value'))).size>=2});
 const htmlChecks:Record<string,boolean[]>={
 'html-1':[hasText('h1'),hasText('p')],
 'html-2':[query('a[href^="https://"]'),hasText('a[href^="https://"]')],
 'html-3':[query('ul'),items('ul')],
 'html-4':[query('img[src="/plant.svg"]'),all('img[src="/plant.svg"]').some(e=>!!e.getAttribute('alt')?.trim())],
 'html-5':[query('header'),hasText('main h1'),query('footer')],
 'html-6':[hasText('form label[for="email"]'),query('form input[id="email"][type="email"]'),hasText('form button[type="submit"]')],
 'html-7':[query('ol'),items('ol')],
 'html-8':[query('figure'),all('figure img[src="/plant.svg"]').some(e=>!!e.getAttribute('alt')?.trim()),all('figure').some(e=>{const caption=e.querySelector('figcaption');return text(caption)&&(e.firstElementChild===caption||e.lastElementChild===caption)})],
 'html-9':[query('details'),all('details').some(e=>e.firstElementChild?.tagName==='SUMMARY'&&text(e.firstElementChild)),hasText('details p')],
 'html-10':[hasText('table > caption'),all('table thead tr').some(e=>Array.from(e.children).filter(c=>c.matches('th[scope="col"]')&&text(c)).length>=2),all('table tbody tr').some(e=>Array.from(e.children).filter(c=>c.tagName==='TD'&&text(c)).length>=2)],
 'html-11':[hasText('form fieldset > legend'),all('form fieldset').some(e=>e.querySelectorAll('input[type="radio"][name="path"]').length>=2),validRadios()],
 'html-12':[all('nav[aria-label]').some(e=>!!e.getAttribute('aria-label')?.trim()),hasText('nav a[href="#garden"]'),doc.querySelectorAll('[id="garden"]').length===1&&hasText('main[id="garden"] h1')],
 'challenge-0':[hasText('.card h1'),hasText('.card p'),hasText('.card button')],
 'challenge-3':[hasText('.recipe h1'),items('.recipe ul')]
 };
 const next=results.map((ok,i)=>ok&&(htmlChecks[id]?.[i]??true));
 const rules:Record<string,[string,string][]>={
 'css-1':[['h1','color'],['body','background-color']], 'css-2':[['h1','font-size'],['h1','font-weight'],['p','line-height']], 'css-3':[['.card','padding'],['.card','margin'],['.card','border']], 'css-4':[['.nav','display'],['.nav','justify-content'],['.nav','align-items']], 'css-5':[['.grid','display'],['.grid','grid-template-columns'],['.grid','gap']], 'css-6':[['.grid','grid-template-columns'],['.grid','grid-template-columns']],
 'css-7':[['.btn','padding'],['.btn:hover','background-color'],['.btn:focus-visible','outline']], 'css-8':[[':root','--accent'],['.callout','color']], 'css-9':[['.card','box-sizing'],['.card','width'],['.card','max-width'],['.card','padding']], 'css-10':[['h1','font-size'],['p','line-height']], 'css-11':[['.banner','position'],['.banner','top']], 'css-12':[['.gallery','display'],['.gallery','grid-template-columns'],['.gallery','gap']],
 'challenge-0':[['.card','background'],['.card','padding'],['.card','border-radius']], 'challenge-3':[['.recipe','background'],['.recipe','padding']], 'challenge-6':[['.welcome','display'],['.welcome','gap'],['h1','font-size'],['.welcome','padding']]
 };
 if(!rules[id])return next;
 try{
  const sheet=new CSSStyleSheet();sheet.replaceSync(css);const parsed:CSSStyleRule[]=[];
  const walk=(list:CSSRuleList)=>{for(const rule of Array.from(list)){if(rule instanceof CSSStyleRule)parsed.push(rule);if('cssRules'in rule)walk((rule as CSSGroupingRule).cssRules)}};walk(sheet.cssRules);
  const offset=id==='challenge-0'?3:id==='challenge-3'?2:0;
  rules[id].forEach(([selector,prop],i)=>{
   const candidates=parsed.filter(r=>r.selectorText.split(',').some(s=>s.trim()===selector));
   const chosen=candidates.filter(r=>!!(r.style.getPropertyValue(prop)||(prop==='background'?r.style.getPropertyValue('background-color'):''))).at(-1);
   const value=chosen?.style.getPropertyValue(prop)||(prop==='background'?chosen?.style.getPropertyValue('background-color'):'')||'';
   let meaningful=['padding','gap','border-radius'].includes(prop)?/[1-9]/.test(value):true;
   if(prop==='outline'||prop==='border'){const style=chosen?.style;const lineStyle=style?.getPropertyValue(prop+'-style')||'';const width=style?.getPropertyValue(prop+'-width')||'';meaningful=!!lineStyle&&!['none','hidden'].includes(lineStyle)&&!/^(0|0px)$/.test(width)}
   const subject=selector.replace(/:(hover|focus-visible)\b/g,'');
   next[i+offset]=!!next[i+offset]&&query(subject)&&!!value&&meaningful;
  });
 }catch{return next.map((v,i)=>lesson.checks[i].kind==='css'?false:v)}
 return next;
}
