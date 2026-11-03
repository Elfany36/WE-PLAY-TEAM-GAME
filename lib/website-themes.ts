export const WEBSITE_THEMES=[
 {id:'indigo',name:'Indigo Studio',accent:'#6353d3',background:'#161526',description:'The classic slate workspace'},
 {id:'pink',name:'Pink Blossom',accent:'#ed8ac6',background:'#2a1423',description:'Soft pink and rose'},
 {id:'cobalt',name:'Cobalt Club',accent:'#86b6f5',background:'#142136',description:'Bright blue and midnight'},
 {id:'mint',name:'Mint Arcade',accent:'#8ee2bd',background:'#142a25',description:'Fresh mint and sea glass'},
 {id:'amber',name:'Golden Hour',accent:'#efc47f',background:'#302619',description:'Warm amber and honey'},
 {id:'lavender',name:'Lavender Dream',accent:'#c7a0ee',background:'#281a35',description:'Lilac and violet'},
 {id:'cherry',name:'Cherry Pop',accent:'#ee92a0',background:'#301b21',description:'Cherry red and blush'},
 {id:'ocean',name:'Ocean Dive',accent:'#85d6e5',background:'#132b33',description:'Turquoise and deep water'},
 {id:'forest',name:'Forest Retreat',accent:'#a3dba3',background:'#192d20',description:'Green leaves and moss'},
 {id:'graphite',name:'Graphite',accent:'#c6cbd1',background:'#202125',description:'A quiet monochrome workspace'},
 {"id":"tangerine","name":"Tangerine Sky","accent":"#eeb696","background":"#2c1b11","description":"Sunset orange and warm cream"},
 {"id":"teal","name":"Tidal Teal","accent":"#9aead7","background":"#132b25","description":"Sea green and soft aqua"},
 {"id":"plum","name":"Plum Velvet","accent":"#e3a0e3","background":"#291529","description":"Rich plum and orchid"},
 {"id":"copper","name":"Copper Hearth","accent":"#d9b8ab","background":"#261c18","description":"Earthy copper and clay"},
 {"id":"sand","name":"Sandstone","accent":"#d1c7b2","background":"#23201a","description":"Quiet sand and parchment"},
 {"id":"ice","name":"Arctic Ice","accent":"#afc8d4","background":"#192024","description":"Cool blue and silver"},
 {"id":"slate","name":"Slate Blue","accent":"#b8bfcc","background":"#1c1e22","description":"Soft blue-gray and ink"},
 {"id":"rosewood","name":"Rosewood","accent":"#d2b1ba","background":"#241a1c","description":"Muted rose and warm wood"},
] as const;
export type WebsiteTheme=typeof WEBSITE_THEMES[number]['id'];
export const WEBSITE_THEME_IDS=WEBSITE_THEMES.map(theme=>theme.id);
export function websiteTheme(value:unknown):WebsiteTheme{return WEBSITE_THEMES.find(theme=>theme.id===value)?.id||'indigo'}
export const WEBSITE_STYLES=[{id:'studio',name:'Studio',description:'Soft corners and a calm workspace'},{id:'arcade',name:'Arcade',description:'Crisp corners, bold edges and a lively grid'},{id:'notebook',name:'Notebook',description:'Paper lines, rounded tabs and editorial spacing'}] as const;
export type WebsiteStyle=typeof WEBSITE_STYLES[number]['id'];
export function websiteStyle(value:unknown):WebsiteStyle{return WEBSITE_STYLES.find(style=>style.id===value)?.id||'studio'}
