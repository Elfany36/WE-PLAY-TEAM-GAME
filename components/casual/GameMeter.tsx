type Props={label:string;value:number;max:number;tone?:'health'|'energy'|'gold';compact?:boolean};
export default function GameMeter({label,value,max,tone='energy',compact=false}:Props){
 const safeMax=Math.max(1,max),amount=Math.max(0,Math.min(safeMax,value));
 return <div className={'game-meter meter-'+tone+(compact?' compact':'')}>
  <div className="meter-caption"><span>{label}</span><strong>{Math.round(amount)}<small> / {safeMax}</small></strong></div>
  <div className="meter-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={Math.round(amount)}><i style={{width:amount/safeMax*100+'%'}}/></div>
 </div>;
}
