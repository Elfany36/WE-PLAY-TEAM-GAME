import {tableScene} from './scenes.ts';
/** Scene tokens inherit into fullscreen; panel contrast is a separate concern. */
export function sceneStyle(value:unknown){const s=tableScene(value);return{'--scene-felt':s.felt,'--scene-light-felt':s.feltLight,'--scene-accent':s.accent,'--scene-wood':s.wood,'--scene-light':s.light,'--scene-dark':s.dark,'--scene-ink':s.ink,'--game-felt':s.felt,'--game-glow':s.accent,'--game-light':s.light,'--game-dark':s.dark,'--table-ink':s.ink,'--table-accent':s.accent}}
