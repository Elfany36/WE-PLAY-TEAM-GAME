export type RoomTraffic={at:number;tokens:number};
/** Stored with the player, so revision-checked writes enforce the budget across isolates. */
export function takeRoomBudget(player:{traffic?:RoomTraffic},now:number,cost=1){const prior=player.traffic,tokens=Math.min(30,(prior?.tokens??30)+Math.max(0,now-(prior?.at??now))*.02);if(tokens<cost)return false;player.traffic={at:now,tokens:tokens-cost};return true}
