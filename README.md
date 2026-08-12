# Carrot Dream — Landing

Landing estática de Carrot Dream, repostería artesanal especializada en Carrot
Cake. Sin dependencias ni build: HTML, CSS y JavaScript puro.

Para verla, abrí `index.html` en el navegador o servila desde cualquier
servidor estático:

```bash
npx serve .
```

## Estructura

```
index.html              marcado de la landing
styles.css              estilos (paleta y tipografías del manual de marca)
script.js               revelados, recorrido con scroll y formulario
assets/brand-kit/       las páginas del manual, tal como fueron entregadas
assets/img/             imágenes derivadas que usa la landing
tools/build-assets.py   script que genera assets/img/ desde el brand kit
```

## Imágenes

Los SVG de `assets/brand-kit/` son **páginas del manual de identidad**, no
recursos sueltos: adentro de cada una hay fotos PNG incrustadas en base64.
Usarlos directamente en la landing mostraba la portada completa del manual, y
recortarlos con SVG anidados (`<image href="otro.svg">`) daba rectángulos
grises en varios navegadores.

`tools/build-assets.py` resuelve eso: extrae las fotos incrustadas, las recorta
y las exporta como archivos planos a `assets/img/`. La landing sólo consume esos
archivos.

```bash
python tools/build-assets.py   # requiere Pillow y numpy
```

Detalles a tener en cuenta si se regeneran:

- La foto de producto sale de `Portada.svg` y se recorta siempre evitando el
  destello de marca de la esquina inferior derecha.
- El recorte del frosting (`Origen Marca.svg`) traía la marca de agua del banco
  de imágenes en los píxeles semitransparentes; el script la elimina con un
  umbral de alfa.
- El logotipo se usa en su versión a color sobre fondo oscuro, como indica el
  manual.

## Animación

Todo lo que depende del scroll se resuelve en un único bucle de
`requestAnimationFrame` en `script.js`, que se pausa cuando la pestaña queda en
segundo plano y deja de medir layout cuando la página está quieta.

**El acompañante.** Una zanahoria ilustrada acompaña toda la lectura desde la
esquina inferior derecha y va cambiando de estado según la sección que ocupa el
centro de la pantalla: entera en el hero, rallada en la receta, torta en textura
y origen, y caja de pedido al final. Durante "De la raíz a tu mesa" desaparece,
porque ahí la zanahoria ya está en escena. Cada sección declara su estado con
`data-companion-state`.

Va fijo y no viaja: una versión anterior bajaba por el costado y terminaba
cayendo justo sobre las costuras entre secciones, lo que se leía como un error.

Su aro de progreso **no mide la página entera sino el camino hasta el pedido**:
se completa cuando `#pedido` entra en pantalla y ahí el acompañante se abre como
atajo al formulario. En pantallas de menos de 900px es una barra inferior con la
misma lógica.

Para que nunca le pase por encima a un renglón, arriba de 900px la caja de
contenido (`--shell`) se angosta lo justo para dejarle lugar y el footer suma
aire al pie. La única superposición que queda es con la marquesina, que es una
cinta decorativa a sangre completa.

**Otros movimientos.** La frase del origen se enciende palabra por palabra con
el scroll, la marquesina acelera y cambia de sentido según la velocidad del
scroll, y la foto del hero y la de textura se desplazan despacio dentro de su
marco.

**El recorrido.** La sección "De la raíz a tu mesa" ocupa 190vh con una escena
sticky de 100dvh.
Cruza los tres momentos (zanahoria, masa, torta terminada) y mueve la zanahoria
ilustrada sobre un recorrido elíptico medido en tiempo real contra la escena,
así nunca pisa el título ni el texto. Todo se anima con `transform` y
`opacity`.

**Movimiento reducido.** Con `prefers-reduced-motion: reduce` la sección se
convierte en una composición estática con los tres momentos visibles y legibles,
la marquesina se detiene y se cortan el parallax y los desplazamientos. Se
mantienen los fundidos de opacidad, que no son un problema vestibular, así que
la página sigue teniendo vida sin movimiento. Vale saberlo al revisar el sitio:
si en tu equipo está activado, vas a ver esa versión y no la animada.

## Video de preparación

El bloque de textura está listo para recibir un video: cargá la URL en el
atributo `data-video-src` de la `<figure class="frame frame-wide">` en
`index.html`. `script.js` reemplaza la foto por un `<video>` en silencio y en
loop, usando la imagen actual como póster.

## Datos comerciales de demostración

Precios, tamaños, dirección, horarios y WhatsApp son una propuesta creativa
para esta maqueta. Antes de publicar hay que reemplazarlos:

| Dato | Dónde |
| --- | --- |
| Número de WhatsApp | constante `WHATSAPP` en `script.js` y el enlace del footer en `index.html` |
| Precios y tamaños | sección `.sizes` de `index.html` |
| Instagram, email, dirección y horarios | `footer` de `index.html` |

## Deploy

El sitio está publicado en Firebase Hosting:
<https://carrot-dream-landing.web.app>

```bash
firebase deploy --only hosting
```

`firebase.json` publica la raíz del repo pero deja afuera el brand kit,
`outputs/`, `work/`, `tools/` y los `.md`: al hosting sólo suben el HTML, el
CSS, el JS y `assets/img/`.

## Entregable

`outputs/carrot-dream-landing/` es una copia del sitio lista para entregar. Si
se tocan los archivos fuente, hay que sincronizarla.
