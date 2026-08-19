// Cada regla horizontal: grosor real y cuánto contrasta contra su fondo.
const res = await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" });
const t = await res.json(); const ws = new WebSocket(t.webSocketDebuggerUrl);
let id=0; const pending=new Map(); const events=[];
ws.addEventListener("message",(e)=>{const m=JSON.parse(e.data);
 if(m.id&&pending.has(m.id)){const{resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(new Error(JSON.stringify(m.error))):resolve(m.result);}else events.push(m);});
await new Promise(r=>ws.addEventListener("open",r));
const send=(m,p={})=>new Promise((res,rej)=>{const i=++id;pending.set(i,{resolve:res,reject:rej});ws.send(JSON.stringify({id:i,method:m,params:p}));});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const ev=async(x)=>{const r=await send("Runtime.evaluate",{expression:x,awaitPromise:true,returnByValue:true});
 if(r.exceptionDetails) return "EXC "+JSON.stringify(r.exceptionDetails.exception||r.exceptionDetails).slice(0,300); return r.result?.value;};
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"no-preference"}]});
await send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await send("Page.navigate",{url:"http://127.0.0.1:54931/index.html"});
while(!events.find(e=>e.method==="Page.loadEventFired")) await sleep(60);
await sleep(1400);
await ev(`document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-visible'));
          document.querySelectorAll('[data-fold]').forEach(f=>f.classList.add('is-open'));`);
await sleep(500);
const out = await ev(`(() => {
  const parse=(c)=>{const m=(c||'').match(/[0-9.]+/g);if(!m)return{r:0,g:0,b:0,a:0};const n=m.map(Number);return{r:n[0],g:n[1],b:n[2],a:n[3]===undefined?1:n[3]};};
  const lin=(v)=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
  const lum=(c)=>0.2126*lin(c.r)+0.7152*lin(c.g)+0.0722*lin(c.b);
  const over=(f,b)=>({r:f.r*f.a+b.r*(1-f.a),g:f.g*f.a+b.g*(1-f.a),b:f.b*f.a+b.b*(1-f.a),a:1});
  const ratio=(a,b)=>{const l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);};
  const bgOf=(el)=>{let n=el;while(n&&n!==document.documentElement){const c=parse(getComputedStyle(n).backgroundColor);if(c.a>0.92)return c;n=n.parentElement;}return parse(getComputedStyle(document.body).backgroundColor);};
  const rows=[]; const seen=new Set();
  for (const el of document.querySelectorAll('*')) {
    if (el.closest('.companion')) continue;
    const cs=getComputedStyle(el);
    for (const lado of ['Top','Bottom']) {
      const w=parseFloat(cs['border'+lado+'Width']);
      if (!w || cs['border'+lado+'Style']==='none') continue;
      const col=parse(cs['border'+lado+'Color']);
      if (col.a===0) continue;
      const bg=bgOf(el.parentElement||el);
      const key=(el.className||el.tagName)+lado+w+cs['border'+lado+'Color'];
      if (seen.has(key)) continue; seen.add(key);
      rows.push({el:String(el.className||el.tagName).split(' ')[0].slice(0,26), lado, w,
                 estilo:cs['border'+lado+'Style'], contraste:Math.round(ratio(over(col,bg),bg)*100)/100});
    }
  }
  return JSON.stringify(rows);
})()`);
const rows = JSON.parse(out);
console.log("elemento".padEnd(28), "lado".padEnd(7), "grosor".padStart(7), "estilo".padStart(8), "contraste".padStart(10));
for (const r of rows.sort((a,b)=>b.contraste-a.contraste))
  console.log(r.el.padEnd(28), r.lado.padEnd(7), (r.w+"px").padStart(7), r.estilo.padStart(8), String(r.contraste).padStart(10));
console.log("\ngrosores distintos:", [...new Set(rows.map(r=>r.w))].sort((a,b)=>a-b).join("px, ")+"px");
await fetch(`http://127.0.0.1:9222/json/close/${t.id}`); process.exit(0);
