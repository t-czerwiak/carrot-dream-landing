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
assets/photos/          fotos propias, fuera del manual
assets/img/             imágenes derivadas que usa la landing
tools/build-assets.py   genera assets/img/ desde el brand kit y las fotos
tools/check-styles.py   avisa si alguna clase del HTML se quedó sin estilos
tools/build-figma.py    arma el HTML aplanado para importar a Figma
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

- **En todo el kit hay una sola fotografía de la torta.** La porción cortada de
  la sección de textura viene aparte, en `assets/photos/carrot-cake-slice.jpg`.
  Ojo con esa: el nombre de archivo original (`360_F_...`) es el de una vista
  previa de Adobe Stock, así que **antes de publicar en serio hay que licenciarla
  o reemplazarla** por una foto propia. Para que no se repita
  la misma imagen en cada bloque, `build-assets.py` saca cinco encuadres
  distintos de esa toma: el hero en vertical, la escena completa, el círculo del
  recorrido y dos primeros planos para las tarjetas de tamaño. Si algún día hay
  fotos reales nuevas, reemplazan a estos recortes sin tocar nada más.
- Todos los recortes evitan el destello de marca de la esquina inferior derecha.
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

Flota despacio, se inclina y se estira con la velocidad del scroll, y cambia de
estado con un rebote. Su aro de progreso **no mide la página entera sino el
camino hasta el pedido**: se completa cuando `#pedido` entra en pantalla, y ahí
el acompañante se apaga y le pasa la posta al cupón de esa sección. En pantallas
de menos de 900px es una barra inferior con la misma lógica.

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

## Desplegables

El detalle operativo va plegado detrás de un título con flecha, para que la
página no sea sólo scrollear: "Cómo llegamos a la receta" en el origen, y "Cómo
pedir" y "Disponibilidad y entrega" en el pedido.

Lo que vende no se pliega: hero, receta, recorrido, textura, precios y
formulario quedan siempre a la vista. Plegar contenido es esconderlo, y a un
bloque cerrado casi nadie lo abre.

Para agregar uno nuevo alcanza con copiar la estructura `.fold` de
`index.html`; `script.js` engancha cualquier bloque con `data-fold`. Con
`data-fold-open` arranca abierto. Sin JS quedan todos abiertos.

## Legibilidad

Ningún texto baja de 16px y todos los pares texto/fondo superan el mínimo de
contraste de WCAG AA (4.5:1, o 3:1 en tipografía grande). No es a ojo: se mide.

```bash
node tools/audit-text.mjs   # requiere el sitio servido en localhost:54931
```

Dos avisos son falsos positivos conocidos: los enlaces del header, porque el
fondo lo pinta un pseudo-elemento que el script no sabe seguir. Medidos sobre
píxeles reales dan 16:1 en las tres posiciones (sobre el hero, sobre crema y
sobre verde).

## Elegir el tamaño

Las dos tarjetas de tamaño son un grupo de radios: se elige ahí y el formulario
lo refleja en la línea "Tu torta". El estado elegido lo resuelve `:has(:checked)`
en CSS, así que se ve bien aunque el JS no cargue; el JS sólo agrega poder tocar
la tarjeta entera y mantener el resumen sincronizado.

## Cupón

Al final del recorrido, en la sección de pedido, aparece un cupón canjeable: al
usarlo se marca como aplicado y el código se suma al mensaje de WhatsApp.

**El descuento y el código son de demostración.** Para cambiarlos hay que tocar
dos lugares: el texto del bloque `.coupon` en `index.html` y las constantes
`couponCode` / `couponOff` en `script.js`. Para sacarlo, se borra el bloque
`.coupon` del HTML.

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

## Pasar el diseño a Figma

```bash
python tools/build-figma.py
```

Genera `outputs/carrot-dream-figma.html`: un archivo único, con el CSS adentro
y las imágenes en base64, listo para arrastrar al plugin **html.to.design**.

No es la landing tal cual, y no puede serlo: importada sin tocar, los bloques
con revelado entran en opacidad 0, las tres etapas del recorrido caen una
encima de la otra y los desplegables llegan cerrados. El script deja todo en su
estado final visible, saca las animaciones, apoya el header en el flujo (con su
fondo oscuro, que en la web se lo da el hero) y esconde el acompañante, que es
un elemento flotante y no parte de la maqueta.

Importalo con el ancho del plugin en **1440px**, que es la medida para la que
está pensada la composición.

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
