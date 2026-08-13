// Audita tamaño y contraste real de cada texto renderizado de la página.
const res = await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" });
const t = await res.json(); const ws = new WebSocket(t.webSocketDebuggerUrl);
let id=0; const pending=new Map(); const events=[];
ws.addEventListener("message",(e)=>{const m=JSON.parse(e.data);
 if(m.id&&pending.has(m.id)){const{resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(new Error(JSON.stringify(m.error))):resolve(m.result);}else events.push(m);});
await new Promise(r=>ws.addEventListener("open",r));
const send=(m,p={})=>new Promise((res,rej)=>{const i=++id;pending.set(i,{resolve:res,reject:rej});ws.send(JSON.stringify({id:i,method:m,params:p}));});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const ev=async(x)=>{const r=await send("Runtime.evaluate",{expression:x,awaitPromise:true,returnByValue:true});
  if(r.exceptionDetails) return "EXC "+r.exceptionDetails.text; return r.result?.value;};
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"no-preference"}]});
await send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await send("Page.navigate",{url:"http://localhost:54931/index.html"});
while(!events.find(e=>e.method==="Page.loadEventFired")) await sleep(60);
await sleep(1500);
// Todo visible de una: sin depender de que el scroll dispare los revelados.
await ev(`document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-visible'));
          document.querySelectorAll('[data-fold]').forEach(f=>{f.classList.add('is-open')});
          document.querySelectorAll('[data-scrub] span').forEach(s=>s.style.setProperty('--w','1'));
          document.querySelectorAll('.moment').forEach(m=>m.classList.add('is-active'));`);
await sleep(600);

const report = await ev(`(() => {
  const parse = (c) => { const m = c.match(/[\\d.]+/g).map(Number); return { r:m[0], g:m[1], b:m[2], a:m[3]===undefined?1:m[3] }; };
  const lin = (v) => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
  const lum = (c) => 0.2126*lin(c.r)+0.7152*lin(c.g)+0.0722*lin(c.b);
  const over = (fg, bg) => ({ r: fg.r*fg.a + bg.r*(1-fg.a), g: fg.g*fg.a + bg.g*(1-fg.a), b: fg.b*fg.a + bg.b*(1-fg.a), a:1 });
  const ratio = (a,b) => { const l1=lum(a), l2=lum(b); return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); };

  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c.a > 0.92) return c;
      n = n.parentElement;
    }
    return parse(getComputedStyle(document.body).backgroundColor);
  };

  const rows = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  const seen = new Set();
  while ((n = walk.nextNode())) {
    const txt = n.nodeValue.trim();
    if (!txt) continue;
    const el = n.parentElement;
    if (!el || el.closest('.companion') || el.closest('noscript')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight) || 400;
    const bg = bgOf(el);
    let fg = parse(cs.color);
    const op = parseFloat(cs.opacity);
    if (op < 1) fg = { ...fg, a: fg.a * op };
    const cr = ratio(over(fg, bg), bg);
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const min = large ? 3 : 4.5;
    const key = el.className + '|' + Math.round(size) + '|' + cs.color;
    if (seen.has(key)) continue;
    seen.add(key);
    if (cr < min || size < 15.5) {
      rows.push({
        sel: (el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ').filter(Boolean).join('.') : '')).slice(0, 46),
        px: Math.round(size * 10) / 10,
        ratio: Math.round(cr * 100) / 100,
        min,
        txt: txt.slice(0, 30),
      });
    }
  }
  return JSON.stringify(rows);
})()`);

const rows = JSON.parse(report);
if (!rows.length) console.log("Sin problemas: todo >= 15.5px y con contraste suficiente.");
else {
  console.log("elemento".padEnd(46), "px".padStart(5), "contraste".padStart(10), "mínimo".padStart(7), " texto");
  for (const r of rows) {
    const flag = r.ratio < r.min ? "CONTRASTE" : "";
    const small = r.px < 15.5 ? "CHICA" : "";
    console.log(r.sel.padEnd(46), String(r.px).padStart(5), String(r.ratio).padStart(10), String(r.min).padStart(7), " " + [small, flag].filter(Boolean).join("+").padEnd(16), r.txt);
  }
  console.log("\ntotal:", rows.length);
}
await fetch(`http://127.0.0.1:9222/json/close/${t.id}`); process.exit(0);
