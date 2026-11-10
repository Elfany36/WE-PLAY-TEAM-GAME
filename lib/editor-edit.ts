/** A single replacement keeps selection boundaries and native typing undo predictable. */
export function indentCode(value:string,start:number,end:number,outdent=false){
 const from=start===0?0:value.lastIndexOf('\n',start-1)+1,last=end>start&&value[end-1]==='\n'?end-1:end,lineEnd=value.indexOf('\n',last),to=lineEnd<0?value.length:lineEnd;
 if(start===end&&!outdent)return{from:start,to:end,insert:'  ',value:value.slice(0,start)+'  '+value.slice(end),start:start+2,end:end+2};
 const segment=value.slice(from,to),lines=segment.split('\n');let lineStart=from,startRemoved=0,endRemoved=0;
 const insert=lines.map(line=>{const n=outdent?(line.startsWith('\t')?1:Math.min(2,line.match(/^ */)![0].length)):0;startRemoved+=Math.min(n,Math.max(0,start-lineStart));endRemoved+=Math.min(n,Math.max(0,end-lineStart));lineStart+=line.length+1;return outdent?line.slice(n):'  '+line}).join('\n');
 return{from,to,insert,value:value.slice(0,from)+insert+value.slice(to),start:outdent?start-startRemoved:start+2,end:outdent?end-endRemoved:end+2*lines.length};
}
