"""Genera los assets de la landing a partir del kit de marca entregado.

Los SVG de `assets/brand-kit/` son páginas del manual: dentro de cada una hay
imágenes PNG incrustadas en base64 (la foto de la torta, los ingredientes y los
logotipos). Este script las extrae, las recorta y las exporta a `assets/img/`
como archivos planos y livianos, para que la landing nunca dependa de recortes
de SVG anidados (que en algunos navegadores se renderizan como un rectángulo
gris).

    python tools/build-assets.py

Requiere Pillow y numpy. No forma parte del sitio: sólo se corre si hay que
regenerar las imágenes.
"""

import base64
import io
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / "assets" / "brand-kit"
OUT = ROOT / "assets" / "img"

IMAGE_RE = re.compile(
    r'<image[^>]*?id="([^"]+)"[^>]*?href="data:image/(png|jpeg);base64,([^"]+)"',
    re.S,
)


def embedded(svg_name):
    """Devuelve {id: Image} con los PNG incrustados en una página del manual."""
    text = (KIT / svg_name).read_text(encoding="utf-8", errors="ignore")
    found = {}
    for image_id, _fmt, payload in IMAGE_RE.findall(text):
        found[image_id] = Image.open(io.BytesIO(base64.b64decode(payload)))
    return found


def upscale(image, factor, sharpen=True):
    if factor == 1:
        return image
    size = (round(image.width * factor), round(image.height * factor))
    out = image.resize(size, Image.LANCZOS)
    if sharpen:
        out = out.filter(ImageFilter.UnsharpMask(radius=1.6, percent=62, threshold=3))
    return out


def save_photo(image, name, width, quality=88):
    image = image.convert("RGB")
    if image.width != width:
        image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
    path = OUT / name
    image.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    print(f"  {name:<26} {image.width}x{image.height}  {path.stat().st_size // 1024} KB")


def save_cutout(image, name, width, alpha_floor=10):
    """Recorta el margen transparente y exporta WebP con alfa.

    `alpha_floor` descarta píxeles semitransparentes: sirve para ajustar el
    encuadre al contenido real y, en el recorte del frosting, para eliminar la
    marca de agua del banco de imágenes, que vive en esa franja de alfa.
    """
    image = image.convert("RGBA")
    data = np.array(image)
    data[..., 3] = np.where(data[..., 3] < alpha_floor, 0, data[..., 3])
    image = Image.fromarray(data)
    box = image.getbbox()
    if box:
        image = image.crop(box)
    image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
    path = OUT / name
    image.save(path, "WEBP", quality=90, method=6)
    print(f"  {name:<26} {image.width}x{image.height}  {path.stat().st_size // 1024} KB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    print("Portada.svg → foto de producto")
    portada = embedded("Portada.svg")
    photo = portada["image0_10_2"].convert("RGB")  # 1024x559, la torta completa
    # El destello de marca vive en (971..999, 503..531): todos los recortes lo evitan.
    save_photo(upscale(photo.crop((500, 0, 947, 559)), 2.0), "cake-hero.jpg", 894)
    save_photo(upscale(photo.crop((90, 0, 964, 559)), 1.6), "cake-wide.jpg", 1398)
    save_photo(upscale(photo.crop((540, 40, 980, 480)), 1.8), "cake-round.jpg", 792)

    print("Origen Marca.svg → ingredientes")
    origen = embedded("Origen Marca.svg")
    save_cutout(origen["image0_61_12"], "carrots.webp", 760)
    save_cutout(origen["image1_61_12"], "milk.webp", 620)
    save_cutout(origen["image3_61_12"], "walnuts.webp", 720)
    save_cutout(origen["image2_61_12"], "frosting.webp", 720, alpha_floor=80)

    print("Logotipos → marca")
    horizontal = embedded("Logotipos & Versiones-Horizontal.svg")["image0_68_1230"]
    save_cutout(horizontal, "logo-horizontal.webp", 760)
    mark = embedded("Portada.svg")["image1_10_2"]
    save_cutout(mark, "mark.webp", 512)

    print("Favicon")
    icon_source = Image.open(OUT / "mark.webp").convert("RGBA")
    for size, name in ((256, "favicon.png"), (180, "apple-touch-icon.png")):
        canvas = Image.new("RGBA", (size, size), (26, 16, 8, 255))
        glyph = icon_source.resize((round(size * 0.86),) * 2, Image.LANCZOS)
        canvas.alpha_composite(glyph, ((size - glyph.width) // 2, (size - glyph.height) // 2))
        canvas.convert("RGB").save(OUT / name, "PNG", optimize=True)
        print(f"  {name:<26} {size}x{size}")


if __name__ == "__main__":
    main()
