const groups={
 animals:'cat,dog,rabbit,elephant,giraffe,lion,tiger,zebra,panda,kangaroo,penguin,owl,parrot,turtle,frog,crocodile,dolphin,whale,octopus,crab',
 food:'apple,banana,pear,grapes,strawberry,pineapple,watermelon,lemon,cherry,carrot,broccoli,mushroom,pizza,hamburger,sandwich,taco,egg,cake,cookie,ice cream',
 nature:'tree,flower,leaf,cactus,acorn,pine cone,mountain,volcano,river,waterfall,island,beach,desert,cave,cloud,rainbow,snowflake,sun,moon,star',
 home:'chair,table,sofa,bed,pillow,blanket,lamp,clock,mirror,curtain,door,window,bookshelf,bathtub,shower,toothbrush,hairbrush,cup,bowl,spoon',
 clothes:'shirt,jacket,coat,sweater,dress,skirt,trousers,shorts,sock,shoe,boot,sandal,slipper,glove,scarf,hat,cap,helmet,crown,belt',
 vehicles:'car,bus,truck,taxi,bicycle,motorcycle,scooter,train,tram,airplane,helicopter,rocket,sailboat,canoe,submarine,ferry,tractor,ambulance,fire truck,skateboard',
 places:'school,hospital,library,bakery,restaurant,supermarket,museum,cinema,airport,station,playground,farm,castle,bridge,lighthouse,tent,igloo,windmill,house,treehouse',
 jobs:'chef,doctor,nurse,firefighter,farmer,teacher,painter,pilot,astronaut,mechanic,carpenter,scientist,dentist,gardener,baker,plumber,photographer,musician,magician,lifeguard',
 play:'football,basketball,tennis,badminton,volleyball,baseball,golf,bowling,surfing,skiing,skating,swimming,cycling,archery,boxing,fishing,kite,swing,seesaw,trampoline',
 tools:'hammer,saw,screwdriver,wrench,pliers,ladder,bucket,broom,shovel,rake,watering can,flashlight,compass,binoculars,telescope,microscope,camera,computer,keyboard,headphones',
 fantasy:'dragon,unicorn,mermaid,fairy,wizard,witch,pirate,robot,giant,ghost,vampire,werewolf,goblin,troll,yeti,monster,spaceship,treasure chest,magic wand,flying carpet',
 scenes:'birthday party,snowman,sandcastle,campfire,hot air balloon,ferris wheel,roller coaster,treasure map,footprints,paper airplane,snow globe,pot of gold,beehive,birdhouse,scarecrow,traffic light,umbrella,carousel,fountain,parachute',
} as const;
export const SKETCH_WORDS=Object.entries(groups).flatMap(([category,words])=>words.split(',').map(word=>({word,category})));
export const SKETCH_CATEGORIES=['all',...Object.keys(groups)] as const;
export const SKETCH_ALIASES:Record<string,string[]>={airplane:['aeroplane'],trousers:['pants'],flashlight:['torch'],football:['soccer'],sofa:['couch'],hamburger:['burger'],bicycle:['bike'],motorcycle:['motorbike'],television:['tv']};
export const normalizeGuess=(s:string)=>s.normalize('NFKC').toLowerCase().trim().replace(/^(a|an|the)\s+/,'').replace(/[^a-z0-9]/g,'');
export function sketchMatches(guess:string,word:string){const normalized=normalizeGuess(guess);return[word,...(SKETCH_ALIASES[word]||[])].some(w=>normalizeGuess(w)===normalized)}
export const BOT_SKETCH_WORDS=['sun','house','tree','fish','cat','flower','star','moon','car','mountain','snowman','sailboat'];
