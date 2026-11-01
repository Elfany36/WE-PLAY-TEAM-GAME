'use client';
import {memo} from 'react';
import LegacyGameChat from './LegacyGameChat';
import SocialGameChat,{type ChatProps} from './SocialGameChat';
export default memo(function GameChat({legacy,...props}:ChatProps){return legacy?<LegacyGameChat {...props}/>:<SocialGameChat {...props}/>},(a,b)=>a.legacy===b.legacy&&a.roomCode===b.roomCode&&a.resetKey===b.resetKey&&a.youId===b.youId&&a.disabled===b.disabled&&a.local===b.local&&a.docked===b.docked&&a.onSend===b.onSend&&a.messages.length===b.messages.length&&a.messages[0]?.clientId===b.messages[0]?.clientId&&a.messages.at(-1)?.clientId===b.messages.at(-1)?.clientId);
