// Mide las tres fases del recorrido sobre la página en vivo y las guarda en
// figma_phases.json, que es lo que usa tools/figma_phases.py para armar las
// pantallas de la maqueta.
//
// La posición de la zanahoria y el tamaño de los aros los calcula script.js
// contra el espacio real de la escena, así que no se pueden escribir a mano:
// hay que leerlos. Requiere Chrome con --remote-debugging-port=9222 y el sitio
// servido en 127.0.0.1:54931.
//
//   node tools/capture-phases.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ANCHO = 1440;
const ALTO = 900;
const FASES = [0.17, 0.5, 0.85];

const res = await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" });
const t = await res.json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const events = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  } else events.push(m);
});
await new Promise((r) => ws.addEventListener("open", r));
const send = (m, p = {}) =>
  new Promise((ok, mal) => {
    const i = ++id;
    pending.set(i, { resolve: ok, reject: mal });
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = async (x) => {
  const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception || r.exceptionDetails).slice(0, 300));
  return r.result?.value;
};

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
// Sin esto Chrome headless mide la versión de movimiento reducido, que es una
// composición estática y no tiene ni órbita ni aros.
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
await send("Emulation.setDeviceMetricsOverride", { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://127.0.0.1:54931/index.html" });
while (!events.find((e) => e.method === "Page.loadEventFired")) await sleep(60);
await sleep(1200);

const geo = await ev(`(() => {
  const b = document.querySelector('.journey').getBoundingClientRect();
  return JSON.stringify({ top: b.top + window.scrollY, alto: b.height, vp: window.innerHeight });
})()`);
const { top, alto, vp } = JSON.parse(geo);

// Las medidas del armado son iguales en las tres fases: se leen una sola vez.
const px = (v) => Math.round(parseFloat(v) || 0);
const layout = JSON.parse(
  await ev(`(() => {
    // Ojo: getPropertyValue de una custom property devuelve la declaración tal
    // cual ("clamp(...)"), no el valor usado. Las medidas se leen del elemento.
    const st = getComputedStyle(document.querySelector('.journey-stage'));
    const platos = getComputedStyle(document.querySelector('.journey-plates'));
    const escena = document.querySelector('.journey-scene').getBoundingClientRect();
    const cab = document.querySelector('.journey-head').getBoundingClientRect();
    const riel = document.querySelector('.journey-rail').getBoundingClientRect();
    const copia = document.querySelector('.moment-copy').getBoundingClientRect();
    const aro = document.querySelector('.ring-line');
    const aroAlt = document.querySelector('.ring-line-alt');
    return JSON.stringify({
      plate: document.querySelector('.plate').getBoundingClientRect().width,
      plateGap: platos.rowGap,
      halo: platos.paddingTop,
      carrotW: getComputedStyle(document.querySelector('.orbit-carrot')).width,
      plateCy: st.getPropertyValue('--plate-cy'),
      ring: aro.offsetWidth,
      ringAlt: aroAlt.offsetWidth,
      railW: riel.width,
      copyW: copia.width,
      stageGap: st.rowGap,
      padTop: cab.top - escena.top,
      padBottom: escena.bottom - riel.bottom,
    });
  })()`),
);

const fases = [];
for (const frac of FASES) {
  await ev(`window.scrollTo(0, ${Math.round(top + frac * (alto - vp))})`);
  await sleep(420);
  fases.push(
    JSON.parse(
      await ev(`(() => {
        const j = getComputedStyle(document.querySelector('.journey'));
        const c = getComputedStyle(document.querySelector('.orbit-carrot'));
        const activa = [...document.querySelectorAll('.moment')].findIndex((m) => m.classList.contains('is-active'));
        return JSON.stringify({
          p: j.getPropertyValue('--p').trim(),
          crumbs: j.getPropertyValue('--crumbs').trim(),
          orbitZ: j.getPropertyValue('--orbit-z').trim() || '3',
          x: c.getPropertyValue('--x').trim(),
          y: c.getPropertyValue('--y').trim(),
          rot: c.getPropertyValue('--rot').trim(),
          s: c.getPropertyValue('--carrot-s').trim(),
          o: c.getPropertyValue('--carrot-o').trim(),
          activa,
          alto: window.innerHeight,
        });
      })()`),
    ),
  );
}

const destino = join(dirname(fileURLToPath(import.meta.url)), "figma_phases.json");
writeFileSync(
  destino,
  JSON.stringify(
    {
      ventana: { ancho: ANCHO, alto: ALTO },
      layout: {
        plate: px(layout.plate),
        plateGap: px(layout.plateGap),
        halo: px(layout.halo),
        carrotW: px(layout.carrotW),
        plateCy: px(layout.plateCy),
        ring: Math.round(layout.ring),
        ringAlt: Math.round(layout.ringAlt),
        railW: Math.round(layout.railW),
        copyW: Math.round(layout.copyW),
        stageGap: px(layout.stageGap),
        padTop: Math.round(layout.padTop),
        padBottom: Math.round(layout.padBottom),
      },
      fases,
    },
    null,
    2,
  ) + "\n",
  "utf-8",
);

console.log("figma_phases.json actualizado");
for (const f of fases) console.log(`  p ${f.p}  momento ${f.activa}  x ${f.x}  y ${f.y}  rot ${f.rot}`);
console.table([layout]);
await fetch(`http://127.0.0.1:9222/json/close/${t.id}`);
ws.close();
