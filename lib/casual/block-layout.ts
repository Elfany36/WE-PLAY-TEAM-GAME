/** Solo/duel views do not reserve space for seven absent rivals. */
export function blockViewSize(players:number,mobile:boolean){
 const rivals=Math.max(0,Math.min(7,players-1)),columns=mobile?Math.max(1,rivals):Math.min(4,Math.max(1,rivals)),width=mobile?480:players<=1?700:players===2?760:players===3?940:960;
 return {width,height:mobile?790:640,columns,rivalCell:mobile?4.5:rivals<=2?18:(width-552-(columns-1)*16)/(columns*10)};
}
