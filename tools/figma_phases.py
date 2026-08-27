"""Las tres fases del recorrido, como pantallas sueltas para la maqueta.

En la web "De la raíz a tu mesa" es una escena fija de 100dvh que va cambiando
con el scroll: el plato cruza entre tres momentos y la zanahoria recorre una
elipse alrededor. Aplanada en tres círculos uno al lado del otro se pierde toda
la composición.

Acá se arma, en cambio, una pantalla completa por fase, con la zanahoria en la
posición exacta que le da la animación. Esas posiciones no están inventadas: se
miden sobre la página en vivo con `capture-phases.mjs` y quedan guardadas en
`figma_phases.json`.

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

CSS = """
/* ---- Las tres fases del recorrido, como pantallas ----------------------- */

/* Medidas fijas a propósito: son las que tenía la escena en la ventana de
   1440x900 donde se midió la posición de la zanahoria. Con `vh` cambiarían
   según el alto del render y la zanahoria quedaría descolocada. */
.fx-phase {
  --plate: 297px;
  --plate-gap: 152px;
  --carrot-w: 81px;
  position: relative;
  height: 900px;
  color: var(--cream);
  background: var(--ink);
  overflow: hidden;
}
.fx-phase-label {
  max-width: var(--shell);
  margin: 0 auto;
  padding: 26px var(--gutter) 14px;
}
.fx-phase-label b {
  display: block;
  font-family: var(--serif);
  font-size: 24px;
  font-weight: 500;
}
.fx-phase-label span { font-size: 16px; color: var(--ink-70); }

/* Dentro de la fase vuelve la escena original, no la versión aplanada. */
.fx-phase .journey-scene {
  position: static !important;
  display: grid !important;
  grid-template-rows: auto minmax(0, 1fr) auto !important;
  height: 900px !important;
  min-height: 0 !important;
  padding: 115px var(--gutter) 45px !important;
  overflow: hidden !important;
  opacity: 1 !important;
}
.fx-phase .journey-head { margin: 0 auto !important; }
.fx-phase .journey-stage { position: relative !important; display: grid !important; place-items: center !important; }
.fx-phase .journey-plates {
  position: relative !important;
  display: block !important;
  width: var(--plate) !important;
  max-width: none !important;
  height: var(--plate) !important;
  margin: 0 0 var(--plate-gap) !important;
}
.fx-phase .moment { display: contents !important; }
.fx-phase .plate {
  position: absolute !important;
  inset: 0 !important;
  width: auto !important;
  aspect-ratio: auto !important;
  margin: 0 !important;
  opacity: 0 !important;
  transform: none !important;
}
.fx-phase .moment.is-active .plate { opacity: 1 !important; }
.fx-phase .moment-copy {
  position: absolute !important;
  top: calc(100% + 58px) !important;
  left: 50% !important;
  width: min(480px, 84vw) !important;
  transform: translateX(-50%) !important;
  opacity: 0 !important;
}
.fx-phase .moment.is-active .moment-copy { opacity: 1 !important; }
/* El aro centra sus dos círculos con `place-items`: si se lo pasa a block,
   los círculos se van a la esquina en vez de quedar concéntricos con el plato. */
.fx-phase .journey-ring { display: grid !important; place-items: center !important; }
.fx-phase .journey-orbit,
.fx-phase .crumbs { display: block !important; }
.fx-phase .journey-rail { display: block !important; width: 520px !important; margin: 0 auto !important; }
.fx-phase .ring-line { --ring: 414px !important; }
.fx-phase .ring-line-alt { --ring: 495px !important; }
"""


def fases(escena: str) -> str:
    """Devuelve el HTML de las tres pantallas a partir del marcado de la escena."""
    medidas = json.loads(DATOS.read_text(encoding="utf-8"))
    bloques = []

    for indice, (fase, (titulo, bajada)) in enumerate(zip(medidas, TITULOS)):
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
            '      <section class="fx-phase" style="--p: %s; --crumbs: %s">\n%s\n      </section>'
            % (titulo, bajada, fase["p"], fase["crumbs"], html)
        )

    return "\n".join(bloques)
