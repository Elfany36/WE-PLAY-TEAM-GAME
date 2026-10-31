export default function CodingPoster({mode}:{mode:'blanks'|'survival'|'quiz'}){
 const palette=mode==='blanks'?['#f8e8d6','#e5a66c','#67462f']:mode==='survival'?['#e4edda','#9bb879','#304934']:['#eee6f4','#b39cc7','#534261'];
 return <svg className={'coding-poster poster-'+mode} viewBox="0 0 380 180" aria-hidden="true" style={{background:palette[0]}}>
  <defs><pattern id={'dots-'+mode} width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill={palette[2]} opacity=".13"/></pattern></defs>
  <rect width="380" height="180" fill={'url(#dots-'+mode+')'}/><circle cx="332" cy="28" r="110" fill="none" stroke={palette[2]} opacity=".09"/>
  {mode==='blanks'?<g transform="translate(79 24) rotate(-4 110 70)">
   <rect x="8" y="8" width="230" height="133" rx="10" fill={palette[2]} opacity=".12"/><rect width="230" height="133" rx="10" fill="#fffdf8" stroke="#d9c7b4"/>
   <path d="M0 27h230" stroke="#e5dacb"/>{[14,25,36].map((x,i)=><circle key={x} cx={x} cy="14" r="3" fill={['#d79571','#e2c57f','#9bba82'][i]}/>)}
   <text x="17" y="56" fontFamily="monospace" fontSize="12" fill={palette[2]}>&lt;button class="</text><rect x="124" y="42" width="77" height="21" rx="4" fill="#f9d39e" stroke="#bf8650" strokeDasharray="3 3"/><text x="138" y="57" fontFamily="monospace" fontSize="12" fill={palette[2]}>your turn</text>
   <text x="18" y="81" fontFamily="monospace" fontSize="12" fill={palette[2]}>  Hello, possibility.</text><text x="18" y="105" fontFamily="monospace" fontSize="12" fill={palette[2]}>&lt;/button&gt;</text>
  </g>:mode==='survival'?<g>
   <rect x="102" y="15" width="170" height="151" rx="12" fill="#213c32"/><rect x="111" y="24" width="152" height="132" rx="5" fill="#182e27"/>
   {Array.from({length:32},(_,i)=>{const x=i%8,y=Math.floor(i/8);return <rect key={i} x={114+x*18} y={81+y*18} width="15" height="15" rx="3" fill={['#c4de97','#e2b985','#b9a2cd','#78aba1'][(x+y)%4]} opacity={y===0&&x>4?.12:1}/>})}
   {[0,1,2,3].map((n)=><rect key={n} className="poster-drop" x={150+(n%3)*18} y={32+(n===3?18:0)} width="15" height="15" rx="3" fill="#c4de97"/>)}
   <g transform="translate(246 77) rotate(7)"><rect width="76" height="38" rx="8" fill="#fffdf8" stroke="#9db584"/><text x="14" y="25" fontSize="15" fontFamily="monospace" fill="#304934">+100</text></g>
  </g>:<g>
   <g transform="translate(100 36) rotate(-14 65 65)"><rect width="130" height="116" rx="10" fill="#c4b0d4" stroke="#9781ab"/></g>
   <g transform="translate(133 24) rotate(7 65 65)"><rect x="5" y="5" width="137" height="126" rx="10" fill="#534261" opacity=".14"/><rect width="137" height="126" rx="10" fill="#fffdf8" stroke="#c2afcf"/><text x="17" y="29" fontFamily="monospace" fontSize="13" fill="#534261">display: ?</text><rect x="15" y="43" width="107" height="27" rx="5" fill="#e5ecd8" stroke="#a3b780"/><circle cx="28" cy="57" r="5" fill="#54774a"/><path d="m25 57 2 2 4-4" fill="none" stroke="white" strokeWidth="1.5"/><text x="41" y="61" fontFamily="monospace" fontSize="12" fill="#304934">grid</text><rect x="15" y="79" width="107" height="27" rx="5" fill="#f0eaf4"/><circle cx="28" cy="93" r="5" fill="none" stroke="#a38eb4"/><path d="M42 94h45" stroke="#b5a1c5" strokeWidth="4" strokeLinecap="round"/></g>
  </g>}
  <path d="m42 33 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill={palette[1]}/><path d="m331 132 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill={palette[2]} opacity=".5"/>
 </svg>;
}
