import type {CSSProperties} from 'react';
const colors=['#f8f3df','#e7b735','#367ed0','#d24455','#8547af','#ed8737','#30917f','#914447','#202c3e'];
export default function PoolBallBadge({number}:{number:number}){
 return <span className={'pool-ball-badge'+(number>8?' is-striped':'')} style={{'--ball-color':colors[number>8?number-8:number]} as CSSProperties} aria-label={'Ball '+number}><b>{number}</b></span>;
}
