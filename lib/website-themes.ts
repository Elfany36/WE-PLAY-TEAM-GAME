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
] as const;
export type WebsiteTheme=typeof WEBSITE_THEMES[number]['id'];
export const WEBSITE_THEME_IDS=WEBSITE_THEMES.map(theme=>theme.id);
export function websiteTheme(value:unknown):WebsiteTheme{return WEBSITE_THEMES.find(theme=>theme.id===value)?.id||'indigo'}
