export function projectDocument(html:string,css:string,preview=false,baseUrl=''){
  const style='<style>'+(preview?':where(html){color-scheme:light}:where(body){background:#fff;color:#172b36}':'')+css.replace(/<\/style/gi,'<\\/style')+'</style>';
  const policy=preview?'<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src https: http: data:; font-src data:; base-uri \'none\'; form-action \'none\';">':'';
  let content=html.replace(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh[^>]*>/gi,'');
  if(preview)content=content.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/<link\b(?=[^>]*\brel\s*=\s*["']?stylesheet\b)[^>]*>/gi,'').replace(/<base\b[^>]*>/gi,'');
  if(baseUrl)content=content.replace(/(["'])\/?plant\.svg\1/g,(_,q)=>q+new URL('plant.svg',baseUrl).href+q);
  const header=policy+'<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+style;
  if(/<html\b|<!doctype\b/i.test(content)){
    if(/<head\b[^>]*>/i.test(content)){content=content.replace(/<head\b[^>]*>/i,m=>m+policy+'<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">');return /<\/head\s*>/i.test(content)?content.replace(/<\/head\s*>/i,style+'</head>'):content.replace(/<head\b[^>]*>/i,m=>m+style);}
    if(/<html\b/i.test(content))return content.replace(/<html\b[^>]*>/i,m=>m+'<head>'+header+'</head>');
    content=content.replace(/<!doctype[^>]*>/gi,'');
  }
  return '<!doctype html><html lang="en"><head>'+header+'<title>My Markup project</title></head><body>'+content+'</body></html>';
}
