/** New objects request Southeast Asia; Cloudflare hints are best effort and do not relocate existing objects. */
export const ROOM_LOCATION_HINT='apac-se';
export function roomStub(rooms:DurableObjectNamespace,name:string,nearGateway=false){
 // The pinned May 2026 type package predates apac-se (introduced June 2026).
 // Dedicated gateways request near-caller creation; existing IDs never move.
 return nearGateway?rooms.get(rooms.idFromName(name)):rooms.get(rooms.idFromName(name),{locationHint:ROOM_LOCATION_HINT as DurableObjectLocationHint});
}
