"""Las tres fases del recorrido, como pantallas sueltas para la maqueta.

En la web "De la raíz a tu mesa" es una escena fija de 100dvh que va cambiando
con el scroll: el plato cruza entre tres momentos y la zanahoria recorre una
elipse alrededor. Aplanada en tres círculos uno al lado del otro se pierde toda
la composición.

Acá se arma, en cambio, una pantalla completa por fase, con la zanahoria en la
posición exacta que le da la animación. Nada de esto está escrito a mano: el
tamaño del plato, el aire de la órbita, el diámetro de los aros y la posición
de la zanahoria los resuelve `script.js` midiendo la escena en vivo, así que se
capturan con `tools/capture-phases.mjs` y quedan en `figma_phases.json`.

Las medidas van en píxeles fijos, no en `vh`: la captura se hizo con una ventana
de 1440x900 y si el plugin renderiza a otra altura, un `vh` daría otro tamaño de
plato y la zanahoria quedaría fuera de lugar.
"""

import json
import re
from pathlib import Path

DATOS = Path(__file__).resolve().parent / "figma_phases.json"

TITULOS = (
    ("Fase 1 · Zanahoria fresca", "El plato muestra la zanahoria y el recorrido recién empieza."),
    ("Fase 2 · Masa húmeda", "Cruza al segundo momento; la zanahoria pasó por arriba."),
    ("Fase 3 · Tu primer bocado", "Llega la torta terminada, aparecen las migas y el riel se completa."),
)

# La plantilla del CSS: los huecos los llena `_css()` con lo capturado.
_PLANTILLA = """
/* ---- Las tres fases del recorrido, como pantallas ----------------------- */

/* Medidas fijas a propósito: son las que tenía la escena en la ventana de
   {ancho}x{alto} donde se capturaron las fases. Con `vh` cambiarían según el
   alto del render y la zanahoria quedaría descolocada. */
.fx-phase {{
  --plate: {plate}px;
  --plate-gap: {plate_gap}px;
  --halo: {halo}px;
  --carrot-w: {carrot_w}px;
  /* En la web este valor lo mide script.js; acá va pegado, porque la maqueta
     no corre JavaScript. De él cuelgan los aros y las migas. */
  --plate-cy: {plate_cy}px;
  position: relative;
  height: {alto}px;
  color: var(--cream);
  background: var(--ink);
  overflow: hidden;
}}
.fx-phase-label {{
  max-width: var(--shell);
  margin: 0 auto;
  padding: 26px var(--gutter) 14px;
}}
.fx-phase-label b {{
  display: block;
  font-family: var(--serif);
  font-size: 24px;
  font-weight: 500;
}}
.fx-phase-label span {{ font-size: 16px; color: var(--ink-70); }}

/* Dentro de la fase vuelve la escena original, no la versión aplanada. */
.fx-phase .journey-scene {{
  position: static !important;
  display: grid !important;
  grid-template-rows: auto minmax(0, 1fr) !important;
  height: {alto}px !important;
  min-height: 0 !important;
  padding: {pad_top}px var(--gutter) {pad_bottom}px !important;
  overflow: hidden !important;
  opacity: 1 !important;
}}
.fx-phase .journey-head {{ margin: 0 auto !important; }}

/* El plato, su texto y el riel se apilan y se centran como un solo bloque,
   igual que en la web. */
.fx-phase .journey-stage {{
  position: relative !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  row-gap: {stage_gap}px !important;
  min-height: 0 !important;
}}
.fx-phase .journey-plates {{
  position: relative !important;
  z-index: 2 !important;
  display: grid !important;
  grid-template-rows: var(--plate) auto !important;
  grid-template-columns: none !important;
  row-gap: var(--plate-gap) !important;
  justify-items: center !important;
  /* El aire que necesita la órbita para pasar por arriba del plato. */
  padding-top: var(--halo) !important;
  width: auto !important;
  max-width: none !important;
  height: auto !important;
  margin: 0 !important;
}}
.fx-phase .moment {{ display: contents !important; }}
.fx-phase .plate {{
  position: relative !important;
  grid-area: 1 / 1 !important;
  inset: auto !important;
  width: var(--plate) !important;
  height: var(--plate) !important;
  aspect-ratio: auto !important;
  margin: 0 !important;
  opacity: 1 !important;
  transform: none !important;
}}
.fx-phase .moment-copy {{
  position: static !important;
  grid-area: 2 / 1 !important;
  width: {copy_w}px !important;
  text-align: center !important;
  opacity: 1 !important;
  transform: none !important;
}}
/* El aro centra sus dos círculos con `place-items`: si se lo pasa a block,
   los círculos se van a la esquina en vez de quedar concéntricos con el plato. */
.fx-phase .journey-ring {{
  position: absolute !important;
  top: var(--plate-cy) !important;
  left: 50% !important;
  display: grid !important;
  place-items: center !important;
  width: 0 !important;
  height: 0 !important;
}}
.fx-phase .journey-orbit,
.fx-phase .crumbs {{ display: block !important; }}
.fx-phase .journey-rail {{ display: block !important; width: {rail_w}px !important; margin: 0 auto !important; }}
.fx-phase .ring-line {{ --ring: {ring}px !important; }}
.fx-phase .ring-line-alt {{ --ring: {ring_alt}px !important; }}
"""


def _datos() -> dict:
    return json.loads(DATOS.read_text(encoding="utf-8"))


def _css() -> str:
    d = _datos()
    lo = d["layout"]
    return _PLANTILLA.format(
        ancho=d["ventana"]["ancho"],
        alto=d["ventana"]["alto"],
        plate=lo["plate"],
        plate_gap=lo["plateGap"],
        halo=lo["halo"],
        carrot_w=lo["carrotW"],
        plate_cy=lo["plateCy"],
        pad_top=lo["padTop"],
        pad_bottom=lo["padBottom"],
        stage_gap=lo["stageGap"],
        copy_w=lo["copyW"],
        rail_w=lo["railW"],
        ring=lo["ring"],
        ring_alt=lo["ringAlt"],
    )


CSS = _css()


def fases(escena: str) -> str:
    """Devuelve el HTML de las tres pantallas a partir del marcado de la escena."""
    bloques = []

    for fase, (titulo, bajada) in zip(_datos()["fases"], TITULOS):
        html = escena

        # En cada fase se ve un solo momento. Los otros dos van con opacidad 0
        # pero cargarían igual sus imágenes, y como cada fase es una copia, la
        # misma foto quedaría incrustada varias veces. Se quitan.
        for i in range(3):
            # El bloque cierra con el </div> de .moment-copy y el de .moment.
            bloque = re.search(
                r'<div class="moment" data-stage="%d">.*?</div>\s*</div>' % i, html, re.S
            )
            if bloque is None:
                continue
            if i == fase["activa"]:
                html = html.replace(
                    bloque.group(0),
                    bloque.group(0).replace(
                        '<div class="moment" data-stage="%d">' % i,
                        '<div class="moment is-active" data-stage="%d">' % i,
                    ),
                )
            else:
                html = html.replace(bloque.group(0), "")

        # Los puntos del riel que ya pasaron.
        for i in range(fase["activa"] + 1):
            html = html.replace('<i data-stage="%d"></i>' % i, '<i class="is-active" data-stage="%d"></i>' % i)

        # La zanahoria, en la posición exacta que le da la animación.
        estilo = "--x: %s; --y: %s; --rot: %s; --carrot-s: %s; --carrot-o: %s" % (
            fase["x"], fase["y"], fase["rot"], fase["s"], fase["o"],
        )
        html = html.replace(
            '<svg class="orbit-carrot"', '<svg style="%s" class="orbit-carrot"' % estilo, 1
        )

        bloques.append(
            '      <p class="fx-phase-label"><b>%s</b><span>%s</span></p>\n'
            '      <section class="fx-phase" style="--p: %s; --crumbs: %s; --orbit-z: %s">\n%s\n      </section>'
            % (titulo, bajada, fase["p"], fase["crumbs"], fase.get("orbitZ", "3"), html)
        )

    return "\n".join(bloques)
