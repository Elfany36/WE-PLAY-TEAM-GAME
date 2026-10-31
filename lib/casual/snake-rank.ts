type SnakeStanding={alive:boolean;score:number;kills?:number;best?:number};
/** Eliminations are the primary key; growth can never outweigh an extra elimination. */
export function compareSnake(a:SnakeStanding,b:SnakeStanding,battle:boolean){
 return battle?(b.kills||0)-(a.kills||0)||(b.best||0)-(a.best||0):Number(b.alive)-Number(a.alive)||b.score-a.score;
}
