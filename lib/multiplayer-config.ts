/** Public frontend configuration. This value is never a credential. */
export const HOSTED_ORIGIN='https://markup-learn-play-together.brightbunch.chatgpt.site';
export function multiplayerEndpoint(kind:'arena'|'casual'){
 const configured=(import.meta as ImportMeta & {env?:Record<string,string>}).env?.VITE_ROOM_API_ORIGIN;
 const remote=typeof location!=='undefined'&&location.hostname.endsWith('.github.io');
 return (configured?.replace(/\/$/,'')||(remote?HOSTED_ORIGIN:''))+'/api/'+kind;
}
