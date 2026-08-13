"""Avisa si alguna clase usada en el HTML se quedó sin estilos.

Dos veces se perdieron reglas enteras al editar `styles.css` con reemplazos por
posición, y el resultado (un bloque sin estilo) no siempre salta a la vista en
una captura. Este chequeo lo detecta en un segundo.

    python tools/check-styles.py
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Clases que existen sólo para que las tome el JS o para marcar estado.
IGNORED = {
    "is-visible", "is-stuck", "is-active", "is-open", "is-awake", "is-arrived",
    "is-on", "is-used", "is-scrubbing", "is-driven", "moment",
}


def main():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")

    used = set()
    for attr in re.findall(r'class="([^"]+)"', html):
        used.update(attr.split())
    used -= IGNORED

    styled = set(re.findall(r"\.([A-Za-z][\w-]*)", css))
    orphans = sorted(used - styled)

    if orphans:
        print("Clases en index.html sin ninguna regla en styles.css:")
        for name in orphans:
            print(f"  .{name}")
        return 1

    print(f"OK: las {len(used)} clases del HTML tienen estilos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
