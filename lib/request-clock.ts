const started=new WeakMap<Request,number>();
export function beginRoomRequest(request:Request){started.set(request,Date.now())}
export function stampRoomReply(request:Request,data:unknown){const sentAt=Date.now();return{...(data as Record<string,unknown>),clock:{receivedAt:started.get(request)??sentAt,sentAt}}}
