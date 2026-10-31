import {memo} from 'react';
import {MEMORY_SYMBOLS} from '../../lib/casual/memory-symbols';
/** Bundled symbols render in the same document as every revealed card. */
export default memo(function MemorySymbols(){return <svg className="memory-symbols" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false"><defs dangerouslySetInnerHTML={{__html:MEMORY_SYMBOLS}}/></svg>});
