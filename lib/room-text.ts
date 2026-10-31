/** Keep international text/emoji while removing control and bidi-override characters. React escapes markup. */
export function cleanRoomText(text:string){return text.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,' ').replace(/\s+/g,' ').trim()}
