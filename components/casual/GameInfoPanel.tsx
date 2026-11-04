'use client';
import {useId,useState} from 'react';
import {BookOpen,Gamepad2,Lightbulb,Settings2,ExternalLink} from 'lucide-react';
import {GAME_VARIANTS,gameVariant} from '../../lib/casual/game-variants';
import {CASUAL_GAMES} from '../../lib/casual/rules';
import {CONTROL_PROFILES,controlHint} from '../../lib/player-controls';
import {SOLITAIRE_NAMES,type SolitaireVariant} from '../../lib/casual/solitaire';
import type {CasualSettings} from '../../lib/casual/engine';
const tips:Record<string,string[]>={
 solitaire:['Expose hidden cards before filling empty columns.','A hint is a legal move, not a promise that the deal is solvable.'],
 sketch:['Draw the distinctive outline first, then add details.','Use pictures, not letters, numbers or the answer written out.'],
 snake:['Plan one corner ahead.','Leave space to turn around your growing trail.'],
 fleet:['Spread your models without overlapping.','After a hit, search neighboring tiles.'],
 generals:['Keep your Flag protected while varying its route.','Spies beat officers; Privates stop Spies.'],
 uno:['Keep a useful wild card for a difficult color.','Use the UNO call before your final card.'],
 property:['Watch your cash before buying or building.','Read the deed before making a trade.'],
 phone:['Draw clear shapes that tell the next player a story.','A short, specific description works best.'],
 circuit:['Ease off before a sharp bend.','Drift through the turn before boosting away.'],
 terra:['Keep materials for tools and shelter.','Explore near a safe route back to your camp.'],
 memory:['Remember positions, not just pictures.','Watch other players’ reveals.'],
 chess:['Keep your King safe.','Check captures and threats before moving.'],
 dama:['Look for forced captures.','Keep support behind advancing pieces.'],
 scidama:['Compare the full capture route.','Check your operation before confirming.'],
 sumo:['Approach at an angle.','Recover your footing before charging again.'],
 tanks:['Use cover while your turret turns.','Keep your front armor toward the threat.'],
 pong:['Position before the ball arrives.','Moving at impact changes the return.'],
 marble:['Brake before narrow corners.','Build momentum after leaving an obstacle.'],
 blocks:['Keep a gap for long pieces.','Use the ghost piece to plan a safe landing.'],
 pool:['Choose a controlled power before shooting.','Think about where the cue ball will finish.'],
 ladders:['Wait for the die and token movement to finish.','Only an exact finish wins.'],
};
export const SOLITAIRE_MECHANICS:Record<SolitaireVariant,string>={
 klondike:'Build alternating colors downward. Empty columns take Kings. Foundations build Ace to King by suit. Draw one; unlimited stock passes. Foundation tops may move back.',
 'klondike-three':'The classic tableau with three-card draws. Only the top waste card is playable. Recycling preserves card order; unlimited passes.',
 freecell:'All cards are visible. Four free cells hold one card each. A movable sequence is limited to (empty cells + 1) × 2 per usable empty helper column. An empty destination is not a helper.',
 'spider-one':'104 cards, one suit. Ten tableau columns; five stock deals of ten. Move same-suit descending runs. Every column must be occupied before dealing. Eight King-to-Ace runs wins.',
 'spider-two':'Spider with spades and hearts. Build downward in any suit, but only same-suit runs move together. Complete eight same-suit King-to-Ace runs.',
 'spider-four':'Spider with all four suits. Build downward in any suit; move same-suit runs. Five stock deals, no redeals. Fill empty columns before dealing.',
 pyramid:'Relaxed edition: clear the 28-card pyramid. Remove uncovered pairs totaling 13, or Kings alone. Only the top waste card is playable. Draw one and recycle twice: three passes total.',
 tripeaks:'Clear 28 tableau cards, moving an uncovered card one rank above or below the waste. Ace and King wrap. Suit does not matter. Draw one; no redeals.',
};
export default function GameInfoPanel({mode,settings,targetRef}:{mode:string;settings:CasualSettings;targetRef:(element:HTMLDivElement|null)=>void}){
 const [tab,setTab]=useState('rules'),id=useId(),game=CASUAL_GAMES.find(g=>g.id===mode)!,profile=CONTROL_PROFILES[mode],preset=GAME_VARIANTS[mode]?.find(v=>v.id===gameVariant(mode,settings));
 return <div className="game-info"><div className="game-info-tabs" role="tablist" aria-label="Game information">{([['rules','Rules',BookOpen],['controls','Controls',Gamepad2],['mechanics','Mechanics',Settings2],['tips','Tips',Lightbulb]] as const).map(([key,label,Icon])=><button type="button" key={key} id={id+'-'+key} role="tab" aria-selected={tab===key} aria-controls={id+'-panel-'+key} tabIndex={tab===key?0:-1} onKeyDown={e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const all=['rules','controls','mechanics','tips'],index=all.indexOf(tab),next=e.key==='Home'?0:e.key==='End'?3:(index+(e.key==='ArrowRight'?1:3))%4;setTab(all[next]);document.getElementById(id+'-'+all[next])?.focus()}} onClick={()=>setTab(key)}><Icon size={15}/>{label}</button>)}</div>
 <section role="tabpanel" id={id+'-panel-rules'} aria-labelledby={id+'-rules'} hidden={tab!=='rules'}><h3>{game.name}</h3><ol>{game.rules.map(rule=><li key={rule}>{rule}</li>)}</ol></section>
 <section role="tabpanel" id={id+'-panel-controls'} aria-labelledby={id+'-controls'} hidden={tab!=='controls'}><h3>Controls</h3><p>{profile?.note||'Select a piece or use the on-screen buttons.'}</p><dl className="game-info-bindings">{profile?.actions.map(action=><div key={action.id}><dt>{action.label}</dt><dd><kbd>{controlHint(mode,action.id)}</kbd></dd></div>)}</dl><p>Personal bindings are available in Customize controls.</p></section>
 <section role="tabpanel" id={id+'-panel-mechanics'} aria-labelledby={id+'-mechanics'} hidden={tab!=='mechanics'}>{preset&&<p className="game-info-preset">{preset.description}</p>}{mode==='solitaire'?<><h3>{SOLITAIRE_NAMES[settings.solitaireVariant||'klondike']}</h3><p>{SOLITAIRE_MECHANICS[settings.solitaireVariant||'klondike']}</p><p>Solo is untimed. Online players get the same deal on independent boards; first completion wins. At the race deadline, most cleared cards wins.</p></>:mode==='sketch'?<><h3>How points work</h3><p>A correct guess earns 100–500 points based on remaining time. The artist earns up to 300 points based on how many eligible players guessed. Every player draws once per round.</p><p>15 seconds to choose, {settings.sketchSeconds||60} seconds to draw, then a five-second answer reveal. Artists and solved players cannot chat until reveal.</p><p>AI artists use simple templates. AI guessers use the visible hints; they do not read the answer.</p></>:<p>{game.variant}</p>}<div ref={targetRef} className="game-info-extra"/><details className="game-info-sources"><summary>Rules sources</summary>{game.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<ExternalLink size={13}/></a>)}</details></section>
 <section role="tabpanel" id={id+'-panel-tips'} aria-labelledby={id+'-tips'} hidden={tab!=='tips'}><h3>A little strategy</h3><ul>{(tips[mode]||['Plan your next move before acting.']).map(tip=><li key={tip}>{tip}</li>)}</ul></section></div>;
}
