/** Six distinct fighter bodies, with fifteen pirate outfits. Outfits within a crew share stats. */
export const PIRATE_MODELS=[
 {id:'bomb-guy',name:'Bomb Guy',character:0,gear:'cap'},
 {id:'bald-pirate',name:'Bald Pirate',character:1,gear:'bandana'},
 {id:'cucumber',name:'Cucumber',character:2,gear:'leaf'},
 {id:'big-guy',name:'Big Guy',character:3,gear:'belt'},
 {id:'captain',name:'Captain',character:4,gear:'tricorn'},
 {id:'whale',name:'Whale',character:5,gear:'sailor'},
 {id:'powder-runner',name:'Powder Runner',character:0,gear:'goggles'},
 {id:'reef-rogue',name:'Reef Rogue',character:1,gear:'mask'},
 {id:'jade-cutlass',name:'Jade Cutlass',character:2,gear:'tricorn'},
 {id:'iron-boatswain',name:'Iron Boatswain',character:3,gear:'helmet'},
 {id:'royal-admiral',name:'Royal Admiral',character:4,gear:'crown'},
 {id:'tidal-corsair',name:'Tidal Corsair',character:5,gear:'tricorn'},
 {id:'storm-captain',name:'Storm Captain',character:4,gear:'storm'},
 {id:'coral-scout',name:'Coral Scout',character:0,gear:'feather'},
 {id:'midnight-privateer',name:'Midnight Privateer',character:1,gear:'hood'},
] as const;
export const pirateModel=(id:unknown)=>PIRATE_MODELS.find(m=>m.id===id)||PIRATE_MODELS[0];
