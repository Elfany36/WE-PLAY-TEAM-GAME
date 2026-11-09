import {PIRATE_MODELS} from './pirate-models.ts';
/** Each game owns its collection. Legacy token/board IDs remain readable for saved looks. */
function collection(title:string,subject:string,note:string,items:string){
 return {title,subject,note,models:items.split(';').map(item=>{const [id,label]=item.trim().split('|');return {id,label}})};
}
export const MODEL_COLLECTIONS={
 pirate:{title:'Pirate crew locker',subject:'pirate crew',note:'Six crews with different speed, jump and power. Pick an outfit before starting; live changes apply next round.',models:PIRATE_MODELS.map(m=>({id:m.id,label:m.name}))},
 solitaire:collection('The card cabinet','deck crest','A personal deck with matching backs and table details.','classic|Club ivory;botanical|Botanical;royal|Royal silk;constellation|Constellation;art-deco|Art deco;porcelain|Porcelain;sunset|Sunset;lotus|Lotus;nautical|Nautical;stained-glass|Stained glass;woodcut|Woodcut;moonstone|Moonstone;origami|Origami;heritage|Heritage;aurora|Aurora'),
 sketch:collection('The artists’ studio','artist companion','Original studio mascots keep your identity clear while you draw and guess.','pencil|Graphite pal;painter|Palette painter;brush|Brush buddy;marker|Marker mate;crayon|Crayon captain;fountain|Fountain pen;chalk|Chalk charm;watercolor|Watercolor sprite;robot|Studio robot;beret|Beret bird;pastel|Pastel pal;ink|Ink imp;quill|Quill owl;spray|Spray sprite;pixel|Pixel painter'),
 generals:collection('Generals command atelier','army set','Uniform backs keep enemy ranks secret. Finishes never change the arbiter rules.','classic|Royal ivory;brass|Brushed brass;navy|Naval academy;jade|Jade command;obsidian|Obsidian guard;capiz|Capiz pearl;narra|Carved narra;chrome|Chrome sentinel;crystal|Crystal corps;copper|Copper brigade;ceramic|Ceramic legion;aurora|Aurora guard;midnight|Midnight command;sunrise|Sunrise regiment;heritage|Heritage gold'),
 fleet:collection('Hidden Fleet design dock','fleet finish','Five model footprints stay identical across ship, aircraft, vehicle and island themes.','classic|Harbor steel;pearl|Pearl fleet;stealth|Stealth graphite;copper|Copper convoy;arctic|Arctic expedition;coral|Coral patrol;cobalt|Cobalt command;mint|Mint rescue;royal|Royal admiral;sunset|Sunset squadron;neon|Neon horizon;wood|Timber island;crystal|Crystal passage;storm|Storm watch;celestial|Celestial flotilla'),
 ladders:collection('Garden trail companions','trail companion','Your companion moves along the numbered path.',
  'sprout|Garden sprout;snail|Trail snail;frog|Pond frog;ladybird|Ladybird;butterfly|Butterfly;bee|Honey bee;tortoise|Tortoise;mushroom|Toadstool;boot|Hiking boot;compass|Trail compass;watering-can|Watering can;acorn|Acorn scout;hedgehog|Hedgehog;firefly|Firefly;sunflower|Sunflower'),
 memory:collection('Memory garden mascots','garden mascot','Your mascot identifies your seat. Matching cards stay the same for everyone.',
  'daisy|Daisy keeper;owl|Memory owl;lotus|Lotus bloom;butterfly|Pair butterfly;bee|Busy bee;fox|Garden fox;fawn|Fawn;frog|Pond friend;snail|Thinking snail;acorn|Acorn keeper;moon|Moon moth;sun|Sun keeper;fern|Fern friend;berry|Berry sprite;book|Field journal'),
 snake:collection('Xenzia snake species','snake','Your selected head and scale pattern follow your snake.',
  'classic|Garden snake;coral|Coral stripes;dragon|Horned dragon;robot|Circuit snake;cobra|Royal cobra;viper|Diamond viper;python|Spotted python;ribbon|Ribbon snake;leaf|Leaf serpent;ice|Frost serpent;flame|Ember serpent;sea|Sea serpent;star|Starlight snake;pixel|Pixel snake;lotus|Lotus serpent'),
 uno:collection('UNO table identities','card crest','Your crest marks your seat. Card colors and playable faces keep their rules.',
  'classic|Club cards;reverse|Reverse swirl;skip|Skip shield;wild|Wild diamond;draw-two|Double draw;comet|Comet dealer;sun|Sunburst;moon|Midnight dealer;lightning|Lightning draw;crown|Table crown;flower|Bloom cards;wave|Wave shuffle;pixel|Pixel hand;confetti|Confetti deal;flip|Flip eclipse'),
 property:collection('Town trail tokens','town token','Your town token follows every move around the property board.',
  'house|Town cottage;tram|Town tram;bike|City bicycle;sailboat|Harbor sailboat;lighthouse|Lighthouse;bakery|Corner bakery;key|City key;briefcase|Business case;train|Little train;taxi|Town taxi;windmill|Windmill;fountain|Town fountain;hotel|Grand hotel;tree|Park tree;airship|Sky airship'),
 phone:collection('Doodle relay creators','creator badge','Your creative tool appears beside your name while drawing and revealing albums.',
  'pencil|Sketch pencil;brush|Paint brush;marker|Bold marker;crayon|Wax crayon;palette|Paint palette;pen|Fountain pen;quill|Ink quill;camera|Story camera;megaphone|Story speaker;notebook|Doodle journal;eraser|Pink eraser;chalk|Chalk artist;stamp|Ink stamp;spray|Spray artist;tablet|Drawing tablet'),
 kart:collection('Kart garage','ride','Bodywork changes your look. Steering, speed and collision size stay consistent.',
  'classic|Club racer;formula|Formula;buggy|Dune buggy;mini|Mini coupe;van|Camper van;hover|Hover pod;hotrod|Hot rod;rally|Rally hatch;roadster|Roadster;pickup|Trail pickup;prototype|Le Mans prototype;muscle|Muscle coupe;taxi|Track taxi;kawaii|Bubble coupe;solar|Solar racer'),
 terra:collection('Terra expedition gear','explorer','Expedition outfits keep the same explorer size, tools and abilities.',
  'explorer|Trail explorer;ranger|Forest ranger;miner|Cave miner;surveyor|Surveyor;botanist|Botanist;crystal|Crystal seeker;copper|Copper prospector;iron|Iron warden;arctic|Arctic explorer;desert|Desert scout;spelunker|Spelunker;engineer|Workshop engineer;medic|Expedition medic;astral|Astral explorer;archaeologist|Archaeologist'),
 chess:collection('Chess piece sets','piece set','All six chess pieces keep their recognizable shape and side markers.',
  'classic|Club ivory;crystal|Cut crystal;wood|Carved walnut;neon|Neon edge;marble|White marble;obsidian|Obsidian;royal|Royal brass;porcelain|Porcelain;glass|Sea glass;slate|Slate stone;rose|Rose quartz;copper|Brushed copper;frost|Frosted ice;celestial|Celestial;botanical|Botanical'),
 dama:collection('Filipino Dama pieces','dama set','Your disc finish changes; crowned dama and the two sides stay clear.',
  'classic|Club discs;narra|Narra wood;capiz|Capiz shell;bamboo|Bamboo;sun|Golden sun;pearl|Pearl;coral|Coral stone;jade|Jade;basalt|Basalt;weave|Woven edge;brass|Brass;ceramic|Ceramic;river|River stone;festival|Festival;star|Star inlay'),
 scidama:collection('Water Patrol pieces','science set','Your chip design keeps water values and crown multipliers readable.',
  'classic|Water Patrol;droplet|Water drop;ripple|Ripple;river|River flow;reservoir|Reservoir;glacier|Glacier;coral|Coral reef;lotus|Lotus pond;wave|Ocean wave;shell|Sea shell;rain|Rainfall;spring|Fresh spring;current|Water current;crystal|Crystal water;lab|Laboratory'),
 sumo:collection('Sumo stable','wrestler','Every wrestler keeps the same ring footprint and dash strength.',
  'classic|Club rikishi;masked|Masked champion;robot|Mecha rikishi;bear|Mountain bear;panda|Bamboo panda;tiger|Tiger champion;lion|Lionheart;fox|Fox wrestler;bull|Iron bull;oni|Festival oni;samurai|Armored rikishi;kappa|River kappa;tanuki|Tanuki;penguin|Snow champion;dragon|Dragon champion'),
 tank:collection('Tank workshop','tank hull','Hull and turret designs share the same aim, armor and collision dimensions.',
  'classic|Club tank;scout|Scout;bulwark|Bulwark;twin|Twin barrel;ranger|Forest ranger;desert|Desert patrol;arctic|Arctic patrol;crusader|Crusader;stealth|Stealth hull;rail|Rail turret;rescue|Rescue rover;copper|Copper crawler;neon|Neon sentinel;siege|Siege hull;amphibious|River patrol'),
 pong:collection('Pong paddle lab','paddle','Surface designs keep the same paddle length and rebound rules.',
  'classic|Club paddle;neon|Neon strip;wood|Wood grain;carbon|Carbon weave;crystal|Crystal edge;wave|Wave paddle;pixel|Pixel paddle;flame|Ember paddle;frost|Frost paddle;circuit|Circuit board;sun|Solar paddle;moon|Lunar paddle;garden|Vine paddle;retro|Retro arcade;star|Star paddle'),
 marble:collection('Marble cabinet','marble','All glass designs use the same marble radius, weight and rolling physics.',
  'classic|Clear glass;orbit|Orbit;star|Star core;prism|Prism;swirl|Ribbon swirl;cat-eye|Cat eye;galaxy|Galaxy;earth|Blue planet;lava|Lava core;frost|Frost globe;pearl|Pearl;confetti|Confetti;petal|Petal glass;honey|Honeycomb;tide|Tidal glass'),
 blocks:collection('Block Drop pilots','block pilot','Your block mascot identifies your well. Piece colors and grid rules stay unchanged.',
  'tee|T-block pilot;line|I-block pilot;square|O-block pilot;elbow|L-block pilot;hook|J-block pilot;zig|S-block pilot;zag|Z-block pilot;stack|Stack keeper;robot|Block robot;rocket|Stack rocket;crown|Combo crown;gem|Prism pilot;castle|Stack castle;satellite|Orbit pilot;heart|Heart stack'),
 pool:collection('Pool cue rack','cue design','Your selected cue appears when lining up a shot. Ball numbers and groups keep their colors.',
  'classic|Club maple;ebony|Ebony;ivory|Ivory inlay;rosewood|Rosewood;copper|Copper trim;carbon|Carbon fiber;jade|Jade inlay;pearl|Pearl inlay;flame|Flame splice;wave|Wave splice;royal|Royal crown;neon|Neon rail;checker|Checkered grip;dragon|Dragon inlay;star|Star points'),
} as const;
export type GameModelFamily=keyof typeof MODEL_COLLECTIONS;
export const LEGACY_MODEL_SETS={token:['pawn','rocket','fox','leaf','boat','cat','crown','gem'],board:['classic','crystal','wood','neon']} as const;
export type ModelFamily=GameModelFamily|keyof typeof LEGACY_MODEL_SETS;
export const MODEL_SETS={...Object.fromEntries(Object.entries(MODEL_COLLECTIONS).map(([family,c])=>[family,c.models.map(m=>m.id)])),...LEGACY_MODEL_SETS} as unknown as Record<ModelFamily,readonly string[]>;
const modeFamilies:Record<string,GameModelFamily>={pirate:'pirate',solitaire:'solitaire',sketch:'sketch',generals:'generals',fleet:'fleet',ladders:'ladders',memory:'memory',snake:'snake',uno:'uno',property:'property',phone:'phone',circuit:'kart',terra:'terra',chess:'chess',dama:'dama',scidama:'scidama',sumo:'sumo',tanks:'tank',pong:'pong',marble:'marble',blocks:'blocks',pool:'pool'};
export function modelFamily(mode:string):ModelFamily{return modeFamilies[mode]||'token'}
export function modelLabel(family:ModelFamily,id:string){return (family in MODEL_COLLECTIONS?MODEL_COLLECTIONS[family as GameModelFamily].models.find(m=>m.id===id)?.label:undefined)||id.replaceAll('-',' ')}
/** Named customization colors are separate from the twelve gameplay seat colors. */
export const CUSTOM_COLORS=[
 ['#56e98b','Mint'],['#ff785a','Coral'],['#4dbbff','Sky'],['#ac83ff','Lilac'],
 ['#ffcf3d','Sunflower'],['#ff70b5','Rose'],['#25dfcf','Turquoise'],['#fff092','Lemon'],
 ['#ffa347','Tangerine'],['#e48cff','Orchid'],['#a4e74b','Lime'],['#71e8ff','Ice'],
 ['#f4f0e6','Ivory'],['#283546','Midnight'],['#b23b4b','Garnet'],['#195f52','Forest'],
 ['#315cc7','Cobalt'],['#6c3b96','Plum'],['#b77842','Copper'],['#dfb477','Sand'],
 ['#e99087','Peach'],['#8798ab','Slate'],['#a8c9a5','Sage'],['#8d5b49','Cocoa'],
].map(([fill,name])=>({fill,name}));
