/** Mechanics and authored map geometry adapted from the user's Pirate Bomb Brawl upload. */
export type PiratePlatform={x:number;y:number;w:number;h?:number;s?:number;mv?:{ax?:number;ay?:number;sp:number;ph:number};dx?:number;dy?:number;bx?:number;by?:number};
export type PirateMap={id:string;n:string;d:string;w:number;h:number;gr:number;by:number;p:PiratePlatform[];sp:number[][];ch:number[][];bt:number[];hz?:number;tint?:string;th?:{k:string;s:number;top:number[][];body:number[][];bot:number[][]|null;thin:number[][][]};bg?:{k:string;px:number;py?:number;z?:number;ay?:number}[];dec?:(string|number)[][];wc?:string;wf?:string;dm?:number;jp?:number[][];lt?:(string|number)[][];fx?:string[];g0?:string;g1?:string};
export type PirateVariant='classic'|'spells'|'bomb-party'|'stomp'|'ko-race'|'hot-potato'|'chaos';
export type PirateMode={id:PirateVariant;n:string;d:string;nm?:number;spam?:number;chest?:number;bombs?:number;hint?:string;rain?:number;big?:number;skl?:number;stomp?:number;inf?:number;time?:number;kos?:number;pot?:number;st?:number;dm?:number;chaos?:number};
export type PirateSkill={n:string;k:string;c:string;r:number;d:string;i?:number};
export const PIRATE_CHARACTERS=[
 {
  "n": "Bomb Guy",
  "sp": 3.5,
  "jp": 12.6,
  "pw": 1,
  "w": 26,
  "h": 40
 },
 {
  "n": "Bald Pirate",
  "sp": 3.1,
  "jp": 12,
  "pw": 1.12,
  "w": 28,
  "h": 42
 },
 {
  "n": "Cucumber",
  "sp": 3.7,
  "jp": 12.8,
  "pw": 0.9,
  "w": 26,
  "h": 44
 },
 {
  "n": "Big Guy",
  "sp": 2.7,
  "jp": 11.4,
  "pw": 1.5,
  "w": 36,
  "h": 46
 },
 {
  "n": "Captain",
  "sp": 3.2,
  "jp": 12,
  "pw": 1.2,
  "w": 30,
  "h": 46
 },
 {
  "n": "Whale",
  "sp": 2.9,
  "jp": 11.6,
  "pw": 1.35,
  "w": 40,
  "h": 30
 }
] as const;
export const PIRATE_SKILLS:PirateSkill[]=[
 {
  "n": "Firebolt",
  "k": "fire",
  "c": "#ff7a3d",
  "r": 0,
  "d": "Fast fireball"
 },
 {
  "n": "Ice Blast",
  "k": "ice",
  "c": "#7fd8ff",
  "r": 0,
  "d": "Freezes on hit"
 },
 {
  "n": "Bomb Barrage",
  "k": "bombs",
  "c": "#c8d7ee",
  "r": 0,
  "d": "Throws 3 bombs"
 },
 {
  "n": "Proximity Mine",
  "k": "mine",
  "c": "#ff9f43",
  "r": 0,
  "d": "Trap that blows on touch"
 },
 {
  "n": "Thunder",
  "k": "thun",
  "c": "#fff06a",
  "r": 1,
  "d": "Strikes the nearest foe"
 },
 {
  "n": "Shockwave",
  "k": "wave",
  "c": "#ffffff",
  "r": 1,
  "d": "Blasts foes away"
 },
 {
  "n": "Dash Strike",
  "k": "dash",
  "c": "#ffb347",
  "r": 1,
  "d": "Charge through foes"
 },
 {
  "n": "Blink",
  "k": "blink",
  "c": "#9fe8ff",
  "r": 1,
  "d": "Teleport ahead"
 },
 {
  "n": "Cyclone",
  "k": "cyc",
  "c": "#8fffd0",
  "r": 1,
  "d": "Boomerang blade"
 },
 {
  "n": "Freeze Nova",
  "k": "nova",
  "c": "#bfefff",
  "r": 1,
  "d": "Ice burst around you"
 },
 {
  "n": "Poison Cloud",
  "k": "pois",
  "c": "#8be04a",
  "r": 1,
  "d": "Toxic cloud that slows"
 },
 {
  "n": "Mystery Dice",
  "k": "dice",
  "c": "#ff8ad8",
  "r": 1,
  "d": "Casts a random skill"
 },
 {
  "n": "Swap",
  "k": "swap",
  "c": "#ff9ae8",
  "r": 1,
  "d": "Trade places with a foe"
 },
 {
  "n": "Chain Lightning",
  "k": "chain",
  "c": "#ffe94a",
  "r": 2,
  "d": "Jumps between foes"
 },
 {
  "n": "Meteor Storm",
  "k": "storm",
  "c": "#ff5a4a",
  "r": 2,
  "d": "Three meteors fall"
 },
 {
  "n": "Gravity Well",
  "k": "well",
  "c": "#b06bff",
  "r": 2,
  "d": "Pulls foes in then pops"
 },
 {
  "n": "Homing Missiles",
  "k": "homing",
  "c": "#ff8a5a",
  "r": 2,
  "d": "Three seeking rockets"
 },
 {
  "n": "Ground Slam",
  "k": "slam",
  "c": "#d9b38c",
  "r": 2,
  "d": "Leap and smash down"
 },
 {
  "n": "Haste",
  "k": "haste",
  "i": 1,
  "c": "#7dff9b",
  "r": 0,
  "d": "Run much faster"
 },
 {
  "n": "Moon Jump",
  "k": "moon",
  "i": 1,
  "c": "#b69cff",
  "r": 0,
  "d": "Floaty big jumps"
 },
 {
  "n": "Heal",
  "k": "heal",
  "i": 1,
  "c": "#ff8a9a",
  "r": 0,
  "d": "Remove 40% damage"
 },
 {
  "n": "Holy Shield",
  "k": "holy",
  "i": 1,
  "c": "#ffe08a",
  "r": 1,
  "d": "Invincible for 6s"
 },
 {
  "n": "Rage",
  "k": "rage",
  "i": 1,
  "c": "#ff4040",
  "r": 1,
  "d": "Fast, strong hits"
 },
 {
  "n": "Life Steal",
  "k": "vamp",
  "i": 1,
  "c": "#ff3b6b",
  "r": 1,
  "d": "Your hits heal you"
 },
 {
  "n": "Mega Power",
  "k": "giant",
  "i": 1,
  "c": "#ff6bd6",
  "r": 2,
  "d": "Huge and strong"
 },
 {
  "n": "Ghost Form",
  "k": "ghost",
  "i": 1,
  "c": "#cfd8ff",
  "r": 2,
  "d": "Untargetable, shots pass"
 },
 {
  "n": "Extra Life",
  "k": "life",
  "i": 1,
  "c": "#ffd24a",
  "r": 3,
  "d": "Gain one heart"
 },
 {
  "n": "Time Stop",
  "k": "stop",
  "i": 1,
  "c": "#aef0ff",
  "r": 3,
  "d": "Freezes every foe"
 },
 {
  "n": "Knife Fan",
  "k": "dag",
  "c": "#e8eefc",
  "r": 0,
  "d": "Five fast knives"
 },
 {
  "n": "Fire Wall",
  "k": "fwall",
  "c": "#ff8a3d",
  "r": 1,
  "d": "Burning wall that launches"
 },
 {
  "n": "Grapple Hook",
  "k": "hook",
  "c": "#c9b38a",
  "r": 1,
  "d": "Yanks a foe to you"
 },
 {
  "n": "Stun Orb",
  "k": "stun",
  "c": "#fff06a",
  "r": 1,
  "d": "Stuns on hit"
 },
 {
  "n": "Blizzard",
  "k": "bliz",
  "c": "#bfefff",
  "r": 2,
  "d": "Snowstorm slows and freezes"
 },
 {
  "n": "Tornado",
  "k": "tor",
  "c": "#dfe8ff",
  "r": 2,
  "d": "Lifts and tosses foes"
 },
 {
  "n": "Laser Beam",
  "k": "laser",
  "c": "#ff4aa0",
  "r": 2,
  "d": "Piercing beam"
 },
 {
  "n": "Comet",
  "k": "comet",
  "c": "#ff9a3d",
  "r": 2,
  "d": "One huge meteor"
 },
 {
  "n": "Earthquake",
  "k": "quake",
  "c": "#d9b38c",
  "r": 2,
  "d": "Launches grounded foes"
 },
 {
  "n": "Fate Swap",
  "k": "fate",
  "c": "#ff7ad0",
  "r": 2,
  "d": "Swap damage with a foe"
 },
 {
  "n": "Jetpack",
  "k": "jet",
  "i": 1,
  "c": "#ffb347",
  "r": 1,
  "d": "Fly with endless jumps"
 },
 {
  "n": "Reflect Shield",
  "k": "refl",
  "i": 1,
  "c": "#7fe8ff",
  "r": 1,
  "d": "Bounces shots back"
 },
 {
  "n": "Treasure Rain",
  "k": "loot",
  "i": 1,
  "c": "#ffd24a",
  "r": 1,
  "d": "Spawns three chests"
 },
 {
  "n": "Skill Thief",
  "k": "thief",
  "i": 1,
  "c": "#b0ffb0",
  "r": 2,
  "d": "Steal a foe skill"
 },
 {
  "n": "Power Surge",
  "k": "dd",
  "i": 1,
  "c": "#ff9f43",
  "r": 2,
  "d": "Hit 50% harder"
 },
 {
  "n": "Armageddon",
  "k": "arma",
  "i": 1,
  "c": "#ff3b3b",
  "r": 3,
  "d": "Meteors rain everywhere"
 }
];
export const PIRATE_MODES:PirateMode[]=[
 {
  "n": "Classic Brawl",
  "d": "3 stocks. Chests, bombs and skills. Last pirate afloat wins.",
  "id": "classic"
 },
 {
  "n": "Spell Spam",
  "d": "Skills only! A new skill every second. No melee, bombs or chests.",
  "nm": 1,
  "spam": 1,
  "chest": 0,
  "bombs": 0,
  "hint": "WASD MOVE   SPACE JUMP   LMB OR RMB CAST   SHIFT DASH",
  "id": "spells"
 },
 {
  "n": "Bomb Party",
  "d": "Bombs rain nonstop and blasts are huge. No chests.",
  "rain": 1,
  "big": 1,
  "chest": 0,
  "hint": "GRAB BOMBS   RMB THROW   LMB HIT",
  "id": "bomb-party"
 },
 {
  "n": "Stomp Party",
  "d": "Only head stomps hurt. Bounce on rivals to knock them off.",
  "nm": 1,
  "skl": 0,
  "stomp": 1,
  "chest": 0,
  "bombs": 0,
  "hint": "WASD MOVE   SPACE JUMP   LAND ON HEADS TO STOMP",
  "id": "stomp"
 },
 {
  "n": "KO Race",
  "d": "Respawn forever. Most KOs after 3 minutes, or 8 KOs, wins.",
  "inf": 1,
  "time": 10800,
  "kos": 8,
  "hint": "MOST KOS WINS   3 MINUTES OR 8 KOS",
  "id": "ko-race"
 },
 {
  "n": "Hot Potato",
  "d": "Pass the potato bomb by hitting rivals. The holder blows up!",
  "pot": 1,
  "st": 2,
  "chest": 0,
  "bombs": 0,
  "dm": 0.25,
  "hint": "HIT A RIVAL TO PASS THE POTATO",
  "id": "hot-potato"
 },
 {
  "n": "Chaos Mayhem",
  "d": "Wild events every few seconds and chests everywhere.",
  "chaos": 1,
  "hint": "EXPECT THE UNEXPECTED",
  "id": "chaos"
 }
];
export const PIRATE_MAPS:PirateMap[]=[
 {
  "n": "Seaside Cove",
  "d": "Two islands, drifting rafts and jump pads.",
  "w": 2048,
  "h": 1024,
  "gr": 0.22,
  "th": {
   "k": "tm",
   "s": 32,
   "top": [
    [
     0,
     0
    ],
    [
     1,
     0
    ],
    [
     2,
     0
    ]
   ],
   "body": [
    [
     0,
     1
    ],
    [
     1,
     1
    ],
    [
     2,
     1
    ]
   ],
   "bot": [
    [
     0,
     2
    ],
    [
     1,
     2
    ],
    [
     2,
     2
    ]
   ],
   "thin": [
    [
     [
      0,
      4
     ],
     [
      1,
      4
     ],
     [
      2,
      4
     ]
    ]
   ]
  },
  "bg": [
   {
    "k": "sky",
    "px": 0
   },
   {
    "k": "cb",
    "px": 0.03
   },
   {
    "k": "cm",
    "px": 0.06
   },
   {
    "k": "cs",
    "px": 0.09
   },
   {
    "k": "oc",
    "px": 0.12
   },
   {
    "k": "sa",
    "px": 0.16
   }
  ],
  "wc": "rgba(30,150,190,.8)",
  "wf": "rgba(255,255,255,.6)",
  "dec": [
   [
    "palm1",
    330,
    800,
    1.6
   ],
   [
    "palm2",
    690,
    800,
    1.6
   ],
   [
    "palm4",
    1790,
    832,
    1.5
   ]
  ],
  "p": [
   {
    "x": 160,
    "y": 800,
    "w": 640,
    "h": 192,
    "s": 1
   },
   {
    "x": 1344,
    "y": 832,
    "w": 512,
    "h": 160,
    "s": 1
   },
   {
    "x": 896,
    "y": 704,
    "w": 256,
    "mv": {
     "ax": 220,
     "ay": 0,
     "sp": 0.014,
     "ph": 0
    }
   },
   {
    "x": 976,
    "y": 900,
    "w": 192,
    "mv": {
     "ax": 140,
     "ay": 0,
     "sp": 0.011,
     "ph": 3.1
    }
   },
   {
    "x": 96,
    "y": 576,
    "w": 288
   },
   {
    "x": 832,
    "y": 448,
    "w": 320
   },
   {
    "x": 1472,
    "y": 512,
    "w": 288
   },
   {
    "x": 480,
    "y": 512,
    "w": 224
   }
  ],
  "sp": [
   [
    320,
    800
   ],
   [
    704,
    800
   ],
   [
    1456,
    832
   ],
   [
    1760,
    832
   ],
   [
    240,
    576
   ],
   [
    992,
    448
   ]
  ],
  "ch": [
   [
    992,
    448
   ],
   [
    240,
    576
   ],
   [
    1616,
    512
   ],
   [
    592,
    512
   ],
   [
    420,
    800
   ],
   [
    1600,
    832
   ]
  ],
  "bt": [
   560,
   800
  ],
  "dm": 0.42,
  "jp": [
   [
    740,
    800
   ],
   [
    1400,
    832
   ]
  ],
  "lt": [
   [
    220,
    800,
    "#ff9f43"
   ],
   [
    1810,
    832,
    "#ff9f43"
   ]
  ],
  "fx": [
   "gulls",
   "rays"
  ],
  "g0": "rgba(255,150,70,.16)",
  "g1": "rgba(30,60,120,.2)",
  "id": "seaside-cove",
  "by": 950
 },
 {
  "n": "Castle Keep",
  "d": "A rock tower, a courtyard and a moving lift.",
  "w": 2048,
  "h": 1056,
  "gr": 0.25,
  "th": {
   "k": "ter",
   "s": 16,
   "top": [
    [
     0,
     0
    ],
    [
     3,
     0
    ],
    [
     9,
     0
    ]
   ],
   "body": [
    [
     0,
     1
    ],
    [
     3,
     1
    ],
    [
     9,
     1
    ]
   ],
   "bot": [
    [
     0,
     2
    ],
    [
     3,
     2
    ],
    [
     9,
     2
    ]
   ],
   "thin": [
    [
     [
      0,
      0
     ],
     [
      3,
      0
     ],
     [
      9,
      0
     ]
    ],
    [
     [
      0,
      2
     ],
     [
      3,
      2
     ],
     [
      9,
      2
     ]
    ]
   ]
  },
  "bg": [
   {
    "k": "cas",
    "px": 0.05,
    "z": 1.1
   }
  ],
  "wc": "rgba(20,20,35,.88)",
  "wf": "rgba(120,120,160,.4)",
  "p": [
   {
    "x": 128,
    "y": 576,
    "w": 384,
    "h": 416,
    "s": 1
   },
   {
    "x": 1280,
    "y": 832,
    "w": 640,
    "h": 160,
    "s": 1
   },
   {
    "x": 768,
    "y": 896,
    "w": 320,
    "h": 96,
    "s": 1
   },
   {
    "x": 576,
    "y": 736,
    "w": 160,
    "mv": {
     "ax": 0,
     "ay": 170,
     "sp": 0.012,
     "ph": 0
    }
   },
   {
    "x": 640,
    "y": 480,
    "w": 352
   },
   {
    "x": 1120,
    "y": 640,
    "w": 256
   },
   {
    "x": 1472,
    "y": 512,
    "w": 320
   },
   {
    "x": 160,
    "y": 384,
    "w": 224
   }
  ],
  "sp": [
   [
    300,
    576
   ],
   [
    440,
    576
   ],
   [
    1500,
    832
   ],
   [
    1780,
    832
   ],
   [
    900,
    896
   ],
   [
    800,
    480
   ]
  ],
  "ch": [
   [
    800,
    480
   ],
   [
    270,
    384
   ],
   [
    1632,
    512
   ],
   [
    1248,
    640
   ],
   [
    1560,
    832
   ],
   [
    330,
    576
   ]
  ],
  "bt": [
   928,
   896
  ],
  "dm": 0.32,
  "jp": [
   [
    1032,
    896
   ],
   [
    1344,
    832
   ]
  ],
  "lt": [
   [
    200,
    576,
    "#ff9f43"
   ],
   [
    470,
    576,
    "#ff9f43"
   ],
   [
    1340,
    832,
    "#ff9f43"
   ],
   [
    1860,
    832,
    "#ff9f43"
   ]
  ],
  "fx": [
   "mist"
  ],
  "g0": "rgba(120,160,255,.10)",
  "g1": "rgba(10,10,30,.25)",
  "id": "castle-keep",
  "by": 946
 },
 {
  "n": "Meadow Run",
  "d": "Grassy terraces with floating clouds.",
  "w": 2112,
  "h": 1056,
  "gr": 0.25,
  "th": {
   "k": "pf",
   "s": 16,
   "top": [
    [
     0,
     3
    ],
    [
     1,
     3
    ],
    [
     9,
     3
    ]
   ],
   "body": [
    [
     0,
     4
    ],
    [
     1,
     4
    ],
    [
     9,
     4
    ]
   ],
   "bot": null,
   "thin": [
    [
     [
      0,
      3
     ],
     [
      1,
      3
     ],
     [
      9,
      3
     ]
    ],
    [
     [
      0,
      4
     ],
     [
      1,
      4
     ],
     [
      9,
      4
     ]
    ]
   ]
  },
  "bg": [
   {
    "k": "pfb",
    "px": 0.05,
    "z": 2.09,
    "ay": 0.52
   }
  ],
  "wc": "rgba(40,110,70,.82)",
  "wf": "rgba(190,240,170,.5)",
  "p": [
   {
    "x": 96,
    "y": 832,
    "w": 576,
    "h": 160,
    "s": 1
   },
   {
    "x": 768,
    "y": 736,
    "w": 512,
    "h": 256,
    "s": 1
   },
   {
    "x": 1376,
    "y": 640,
    "w": 640,
    "h": 352,
    "s": 1
   },
   {
    "x": 640,
    "y": 560,
    "w": 224,
    "mv": {
     "ax": 0,
     "ay": 90,
     "sp": 0.013,
     "ph": 0
    }
   },
   {
    "x": 1056,
    "y": 432,
    "w": 256,
    "mv": {
     "ax": 180,
     "ay": 0,
     "sp": 0.012,
     "ph": 1
    }
   },
   {
    "x": 1664,
    "y": 416,
    "w": 256,
    "mv": {
     "ax": 0,
     "ay": 70,
     "sp": 0.015,
     "ph": 2
    }
   },
   {
    "x": 224,
    "y": 640,
    "w": 256
   },
   {
    "x": 352,
    "y": 448,
    "w": 224
   }
  ],
  "sp": [
   [
    300,
    832
   ],
   [
    560,
    832
   ],
   [
    1000,
    736
   ],
   [
    1200,
    736
   ],
   [
    1600,
    640
   ],
   [
    1900,
    640
   ]
  ],
  "ch": [
   [
    336,
    640
   ],
   [
    464,
    448
   ],
   [
    1000,
    736
   ],
   [
    1760,
    640
   ],
   [
    400,
    832
   ],
   [
    1180,
    736
   ]
  ],
  "bt": [
   1800,
   640
  ],
  "dm": 0.34,
  "jp": [
   [
    620,
    832
   ],
   [
    824,
    736
   ],
   [
    1424,
    640
   ]
  ],
  "fx": [
   "birds",
   "rays"
  ],
  "g0": "rgba(255,230,140,.10)",
  "g1": "rgba(20,40,30,.18)",
  "id": "meadow-run",
  "by": 882
 },
 {
  "n": "Sunken Ruins",
  "d": "Crumbling halls, swinging stones and a deep gap.",
  "w": 2048,
  "h": 1056,
  "gr": 0.25,
  "th": {
   "k": "rui",
   "s": 16,
   "top": [
    [
     0,
     0
    ],
    [
     1,
     0
    ],
    [
     2,
     0
    ]
   ],
   "body": [
    [
     0,
     1
    ],
    [
     1,
     1
    ],
    [
     2,
     1
    ]
   ],
   "bot": [
    [
     0,
     2
    ],
    [
     1,
     2
    ],
    [
     2,
     2
    ]
   ],
   "thin": [
    [
     [
      0,
      0
     ],
     [
      1,
      0
     ],
     [
      2,
      0
     ]
    ]
   ]
  },
  "bg": [
   {
    "k": "rui",
    "px": 0.02,
    "z": 1.2
   }
  ],
  "wc": "rgba(110,86,60,.88)",
  "wf": "rgba(240,220,170,.45)",
  "p": [
   {
    "x": 128,
    "y": 768,
    "w": 448,
    "h": 224,
    "s": 1
   },
   {
    "x": 1344,
    "y": 704,
    "w": 512,
    "h": 288,
    "s": 1
   },
   {
    "x": 832,
    "y": 832,
    "w": 128,
    "h": 160,
    "s": 1
   },
   {
    "x": 1056,
    "y": 768,
    "w": 128,
    "h": 224,
    "s": 1
   },
   {
    "x": 624,
    "y": 704,
    "w": 160,
    "mv": {
     "ax": 60,
     "ay": 50,
     "sp": 0.02,
     "ph": 0
    }
   },
   {
    "x": 288,
    "y": 544,
    "w": 256
   },
   {
    "x": 704,
    "y": 464,
    "w": 288
   },
   {
    "x": 1120,
    "y": 528,
    "w": 256
   },
   {
    "x": 1536,
    "y": 480,
    "w": 288
   },
   {
    "x": 928,
    "y": 352,
    "w": 224
   }
  ],
  "sp": [
   [
    300,
    768
   ],
   [
    480,
    768
   ],
   [
    1450,
    704
   ],
   [
    1750,
    704
   ],
   [
    896,
    832
   ],
   [
    1120,
    768
   ]
  ],
  "ch": [
   [
    416,
    544
   ],
   [
    848,
    464
   ],
   [
    1248,
    528
   ],
   [
    1680,
    480
   ],
   [
    1040,
    352
   ],
   [
    300,
    768
   ]
  ],
  "bt": [
   1600,
   704
  ],
  "dm": 0.42,
  "jp": [
   [
    520,
    768
   ],
   [
    1400,
    704
   ]
  ],
  "lt": [
   [
    200,
    768,
    "#ffb347"
   ],
   [
    1800,
    704,
    "#ffb347"
   ],
   [
    900,
    832,
    "#ffb347"
   ]
  ],
  "fx": [
   "rays"
  ],
  "g0": "rgba(255,200,130,.14)",
  "g1": "rgba(40,20,20,.25)",
  "id": "sunken-ruins",
  "by": 882
 },
 {
  "n": "Galleon Deck",
  "d": "A wide ship deck with three tiers.",
  "w": 1800,
  "h": 1000,
  "gr": 0.25,
  "tint": "rgba(20,16,40,.6)",
  "p": [
   {
    "x": 520,
    "y": 760,
    "w": 760,
    "h": 200,
    "s": 1
   },
   {
    "x": 160,
    "y": 620,
    "w": 260
   },
   {
    "x": 1380,
    "y": 620,
    "w": 260
   },
   {
    "x": 760,
    "y": 580,
    "w": 280
   },
   {
    "x": 400,
    "y": 440,
    "w": 240
   },
   {
    "x": 1160,
    "y": 440,
    "w": 240
   },
   {
    "x": 810,
    "y": 300,
    "w": 180
   }
  ],
  "sp": [
   [
    600,
    760
   ],
   [
    1200,
    760
   ],
   [
    290,
    620
   ],
   [
    1510,
    620
   ],
   [
    900,
    580
   ],
   [
    900,
    300
   ]
  ],
  "ch": [
   [
    900,
    580
   ],
   [
    290,
    620
   ],
   [
    1510,
    620
   ],
   [
    900,
    300
   ],
   [
    520,
    440
   ],
   [
    1280,
    440
   ]
  ],
  "bt": [
   900,
   760
  ],
  "id": "galleon-deck",
  "by": 810
 },
 {
  "n": "Twin Islands",
  "d": "Two islands with a deadly gap between them.",
  "w": 2000,
  "h": 1000,
  "gr": 0.25,
  "tint": "rgba(16,40,50,.55)",
  "p": [
   {
    "x": 200,
    "y": 720,
    "w": 600,
    "h": 200,
    "s": 1
   },
   {
    "x": 1200,
    "y": 720,
    "w": 600,
    "h": 200,
    "s": 1
   },
   {
    "x": 880,
    "y": 600,
    "w": 240
   },
   {
    "x": 560,
    "y": 500,
    "w": 220
   },
   {
    "x": 1220,
    "y": 500,
    "w": 220
   },
   {
    "x": 900,
    "y": 380,
    "w": 200
   },
   {
    "x": 60,
    "y": 540,
    "w": 160
   },
   {
    "x": 1780,
    "y": 540,
    "w": 160
   }
  ],
  "sp": [
   [
    300,
    720
   ],
   [
    1700,
    720
   ],
   [
    500,
    720
   ],
   [
    1500,
    720
   ],
   [
    670,
    500
   ],
   [
    1330,
    500
   ]
  ],
  "ch": [
   [
    1000,
    600
   ],
   [
    670,
    500
   ],
   [
    1330,
    500
   ],
   [
    1000,
    380
   ],
   [
    140,
    540
   ],
   [
    1860,
    540
   ]
  ],
  "bt": [
   1500,
   720
  ],
  "id": "twin-islands",
  "by": 770
 },
 {
  "n": "Ice Floes",
  "d": "Slippery floes. Watch your footing.",
  "w": 1900,
  "h": 1000,
  "gr": 0.035,
  "tint": "rgba(20,50,90,.55)",
  "p": [
   {
    "x": 240,
    "y": 740,
    "w": 420,
    "h": 160,
    "s": 1
   },
   {
    "x": 740,
    "y": 780,
    "w": 420,
    "h": 160,
    "s": 1
   },
   {
    "x": 1240,
    "y": 740,
    "w": 420,
    "h": 160,
    "s": 1
   },
   {
    "x": 480,
    "y": 560,
    "w": 260
   },
   {
    "x": 1160,
    "y": 560,
    "w": 260
   },
   {
    "x": 820,
    "y": 400,
    "w": 260
   }
  ],
  "sp": [
   [
    450,
    740
   ],
   [
    950,
    780
   ],
   [
    1450,
    740
   ],
   [
    610,
    560
   ],
   [
    1290,
    560
   ],
   [
    950,
    400
   ]
  ],
  "ch": [
   [
    610,
    560
   ],
   [
    1290,
    560
   ],
   [
    950,
    400
   ],
   [
    450,
    740
   ],
   [
    1450,
    740
   ],
   [
    950,
    780
   ]
  ],
  "bt": [
   950,
   780
  ],
  "id": "ice-floes",
  "by": 830
 },
 {
  "n": "Thunder Reef",
  "d": "A storm overhead. Lightning picks its targets.",
  "w": 1700,
  "h": 1000,
  "gr": 0.25,
  "hz": 1,
  "tint": "rgba(30,10,50,.65)",
  "p": [
   {
    "x": 560,
    "y": 780,
    "w": 580,
    "h": 180,
    "s": 1
   },
   {
    "x": 200,
    "y": 640,
    "w": 240
   },
   {
    "x": 1260,
    "y": 640,
    "w": 240
   },
   {
    "x": 420,
    "y": 500,
    "w": 220
   },
   {
    "x": 1060,
    "y": 500,
    "w": 220
   },
   {
    "x": 740,
    "y": 380,
    "w": 220
   },
   {
    "x": 100,
    "y": 480,
    "w": 160
   }
  ],
  "sp": [
   [
    700,
    780
   ],
   [
    1000,
    780
   ],
   [
    320,
    640
   ],
   [
    1380,
    640
   ],
   [
    530,
    500
   ],
   [
    1170,
    500
   ]
  ],
  "ch": [
   [
    850,
    380
   ],
   [
    320,
    640
   ],
   [
    1380,
    640
   ],
   [
    530,
    500
   ],
   [
    1170,
    500
   ],
   [
    180,
    480
   ]
  ],
  "bt": [
   850,
   780
  ],
  "id": "thunder-reef",
  "by": 830
 }
];
export const PIRATE_FX_FRAMES:Record<string,number>={"fire":11,"fireH":5,"ice":15,"iceH":12,"thun":13,"thunS":14,"holy":7,"smoke":13,"chest":8,"btn":2};
