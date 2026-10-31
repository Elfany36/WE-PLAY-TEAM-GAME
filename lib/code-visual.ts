export function cssDemonstration(code:string){
 let html='<main id="lesson" class="card panel"><span class="eyebrow">A SMALL EXAMPLE</span><h1 class="title">Structure meets style.</h1><h2>A little room to grow.</h2><p class="caption">This text belongs to the example.</p><p class="muted">Supporting information.</p><a class="link" href="#example">Try this link</a> <button type="button">Try this button</button></main>';
 let css=':root{--accent:#cbed91}body{font:16px/1.6 system-ui,sans-serif;color:#233e30;padding:20px;background:#fff}button{padding:10px 16px;border:1px solid #718a61;background:var(--accent);border-radius:6px;color:#233e30}button:hover{background:#e1f1cc}a{color:#315e3b}h1{font-size:24px}h2{font-size:18px}.eyebrow{font-size:11px}.card{background:#f0f4e9;border:1px solid #a6bb91;padding:16px;max-width:100%;box-sizing:border-box}';
 if(/\.gallery|\.featured/.test(code)){
  html='<div class="gallery"><article class="featured">Build</article><article>Style</article><article>Learn</article><article>Play</article></div>';
  css+='.gallery{display:grid;grid-template-columns:1fr 1fr;gap:8px}.gallery article{background:#e5efd8;padding:20px;border:1px solid #a6bb91;border-radius:7px}';
 }else if(/\.nav|\.stack|\.tags|\.item/.test(code)){
  html='<div class="nav stack tags"><div class="item">Build</div><div class="item">Style</div><div class="item">Learn</div></div>';
  css+='.nav,.stack,.tags{display:flex;gap:10px;min-height:130px;border:1px dashed #718a61;padding:12px}.item{padding:12px;background:#e5efd8;border:1px solid #a6bb91;border-radius:6px}';
 }else if(/\.parent|\.child/.test(code)){
  html='<div class="parent">Parent box<div class="child">Child box</div></div>';
  css+='.parent{position:relative;min-height:140px;padding:20px;border:1px dashed #718a61;color:#336646}.child{background:#e5efd8;padding:10px;color:#503d75}';
 }else if(/\.tip/.test(code))html='<p class="tip">Small steps add up.</p>';
 else if(/\.sticker/.test(code)){html='<div class="sticker">Built with curiosity</div>';css+='.sticker{display:inline-block;background:#e5efd8;border:1px solid #718a61;border-radius:8px;padding:20px;margin:15px}';}
 else if(/\.badge/.test(code))html='<p>Learning <span class="badge">HTML + CSS</span></p>';
 else if(/\.notice|@keyframes/.test(code)){html='<p class="notice">Watch this text fade.</p>';css+='@keyframes fade{from{opacity:0}to{opacity:1}}.notice{animation:fade 1s ease-in-out infinite alternate}@media(prefers-reduced-motion:reduce){.notice{animation:none}}';}
 else if(/input:/.test(code))html='<label for="example">Focus this field</label><input id="example" type="text" placeholder="Click or use Tab">';
 else if(/\bpre\s*\{/.test(code))html='<pre>HTML\n  + CSS\n    = a page</pre>';
 return {html,css:css+'\n'+code};
}
