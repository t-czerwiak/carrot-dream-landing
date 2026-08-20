"""Genera un HTML único y aplanado para importar el diseño a Figma.

    python tools/build-figma.py

La landing tal cual no se importa bien: los bloques con revelado entran en
opacidad 0, las tres etapas del recorrido están una encima de la otra, los
desplegables están cerrados y el header y el acompañante son elementos fijos.
Este script produce una copia donde todo está en su estado final visible, sin
animaciones, con el CSS adentro y las imágenes incrustadas en base64, en un solo
archivo que se arrastra al plugin de Figma.

Requiere Pillow (convierte los WebP a PNG, que Figma trata mejor).
"""

import base64
import io
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SALIDA = ROOT / "outputs" / "carrot-dream-figma.html"

# Todo en su estado final: es lo que Figma tiene que ver.
APLANADO = """
/* ==========================================================================
   Sólo para la exportación a Figma. Deja cada sección en su estado final:
   sin animaciones, sin elementos fijos y con todo el contenido desplegado.
   ========================================================================== */

*, *::before, *::after {
  animation: none !important;
  transition: none !important;
}

/* Los bloques que aparecen con el scroll, ya visibles. */
[data-reveal] { opacity: 1 !important; transform: none !important; }

/* El header deja de flotar y ocupa su lugar en el flujo. En la web es
   transparente sobre el hero oscuro; acá necesita su propio fondo, porque si
   no queda texto crema sobre crema, invisible. */
.site-header {
  position: static !important;
  background: var(--ink) !important;
}
.hero { padding-top: clamp(28px, 5vh, 60px) !important; }

/* El acompañante es un elemento flotante de la web, no parte de la maqueta. */
.companion { display: none !important; }

/* El recorrido pasa de escena animada a los tres momentos, uno al lado del
   otro. Es la misma composición que ve quien tiene el movimiento reducido. */
.journey { height: auto !important; }
.journey-scene {
  position: static !important;
  height: auto !important;
  min-height: 0 !important;
  overflow: visible !important;
  opacity: 1 !important;
  padding: var(--section-y) var(--gutter) !important;
  display: block !important;
}
.journey-head { margin-bottom: clamp(44px, 7vh, 72px); }
.journey-stage { display: block !important; }
.journey-plates {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: clamp(28px, 4vw, 60px) !important;
  width: 100% !important;
  max-width: var(--shell) !important;
  height: auto !important;
  margin: 0 auto !important;
}
.moment { display: block !important; text-align: center; }
.plate {
  position: relative !important;
  inset: auto !important;
  width: min(100%, 260px) !important;
  aspect-ratio: 1 !important;
  margin: 0 auto 24px !important;
  opacity: 1 !important;
  transform: none !important;
}
.plate img { inset: 13%; }
.plate-photo img { inset: 0; }
.plate-duo .plate-a { inset: auto auto 18% 13%; }
.plate-duo .plate-b { inset: 19% 10% auto auto; }
.moment-copy {
  position: static !important;
  width: auto !important;
  opacity: 1 !important;
  transform: none !important;
}
.journey-ring, .journey-orbit, .crumbs, .journey-rail { display: none !important; }

/* Desplegables abiertos: en la maqueta se tiene que ver el contenido. */
.fold-panel {
  grid-template-rows: 1fr !important;
  visibility: visible !important;
}
.fold-arrow { transform: rotate(180deg) !important; }

/* La frase del origen se enciende con el scroll: acá va encendida entera. */
.origin-quote span { opacity: 1 !important; }

/* La cinta arranca desde el borde, sin el desplazamiento del rAF. */
.marquee-track { transform: none !important; }

@media (max-width: 820px) {
  .journey-plates { grid-template-columns: minmax(0, 1fr) !important; gap: 44px !important; }
}
"""


# Lado mayor de cada imagen dentro del archivo. En la maqueta ninguna se ve a
# más de la mitad de eso, y bajarlas evita un archivo de varios MB.
LADO_FOTO = 900
LADO_RECORTE = 520


def data_uri(ruta: Path) -> str:
    """Devuelve la imagen como data URI, redimensionada para el archivo.

    Los WebP se pasan a PNG: la API de imágenes de Figma acepta PNG, JPG y GIF,
    así que WebP puede fallar del otro lado.
    """
    imagen = Image.open(ruta)
    con_alfa = ruta.suffix.lower() == ".webp" or imagen.mode in ("RGBA", "LA", "P")
    tope = LADO_RECORTE if con_alfa else LADO_FOTO
    if max(imagen.size) > tope:
        escala = tope / max(imagen.size)
        imagen = imagen.resize(
            (round(imagen.width * escala), round(imagen.height * escala)), Image.LANCZOS
        )

    buffer = io.BytesIO()
    if con_alfa:
        imagen.convert("RGBA").save(buffer, "PNG", optimize=True)
        mime = "image/png"
    else:
        imagen.convert("RGB").save(buffer, "JPEG", quality=86, optimize=True)
        mime = "image/jpeg"
    return f"data:{mime};base64,{base64.b64encode(buffer.getvalue()).decode('ascii')}"


def main() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")

    # Nada de carga diferida: si el plugin captura antes de que bajen las
    # imágenes de abajo, quedan cajas vacías en el archivo de Figma.
    html = html.replace(' loading="lazy"', "")

    # El JS no viaja: la maqueta ya está en su estado final.
    html = re.sub(r'\n? *<script src="script\.js[^"]*"></script>', "", html)
    html = re.sub(r"\n? *<noscript>.*?</noscript>", "", html, flags=re.S)

    # CSS adentro del archivo.
    html = re.sub(
        r'<link rel="stylesheet" href="styles\.css[^"]*" />',
        "<style>\n" + css + "\n" + APLANADO + "\n</style>",
        html,
    )
    # Las tipografías siguen viniendo de Google Fonts: el plugin las resuelve.

    # Imágenes incrustadas.
    incrustadas = 0
    for referencia in sorted(set(re.findall(r'assets/img/[\w.-]+', html))):
        archivo = ROOT / referencia
        if not archivo.exists():
            print(f"  falta {referencia}")
            continue
        html = html.replace(referencia, data_uri(archivo))
        incrustadas += 1

    html = html.replace(
        "<title>Carrot Dream — Dulzura en cada bocado</title>",
        "<title>Carrot Dream — maqueta para Figma</title>",
    )

    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(html, encoding="utf-8")
    print(f"{SALIDA.relative_to(ROOT)}")
    print(f"  {incrustadas} imágenes incrustadas · {SALIDA.stat().st_size // 1024} KB")
    print(f"  quedan rutas relativas: {len(re.findall(r'assets/', html))}")


if __name__ == "__main__":
    main()
