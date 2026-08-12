"""Sincroniza outputs/carrot-dream-landing/ con los archivos fuente.

    python tools/sync-output.py
"""

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "outputs" / "carrot-dream-landing"

FILES = ["index.html", "styles.css", "script.js", "README.md"]
DIRS = ["assets"]


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        shutil.copy2(ROOT / name, DEST / name)
        print(f"  {name}")
    for name in DIRS:
        target = DEST / name
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(ROOT / name, target)
        print(f"  {name}/")
    print(f"Entregable actualizado en {DEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
