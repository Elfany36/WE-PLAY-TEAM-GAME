let segmenter:Intl.Segmenter|undefined;
function* graphemes(text:string){
 if(typeof Intl.Segmenter==='function'){segmenter??=new Intl.Segmenter(undefined,{granularity:'grapheme'});for(const part of segmenter.segment(text))yield part.segment}
 else yield* Array.from(text);
}
export function nameInitial(name:string){for(const character of graphemes(name))return character.toLocaleUpperCase();return '?'}
/** Respect the server's UTF-16 limit without slicing an emoji or joined symbol. */
export function chatDraft(text:string,limit=280){let out='';for(const character of graphemes(text)){if(out.length+character.length>limit)break;out+=character}return out}
