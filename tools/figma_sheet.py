"""Hoja de componentes y estados que se agrega al HTML para Figma.

En la web, buena parte de los estados dependen de la interacción: el paso del
mouse, la tarjeta elegida, el cupón canjeado, el desplegable abierto. En una
maqueta estática no se ven. Este módulo arma una sección al final del archivo
con todos esos estados uno al lado del otro.
"""

CSS = """
/* ---- Hoja de componentes y estados (sólo en la exportación) -------------- */
.fx-sheet {
  max-width: var(--shell);
  margin: 0 auto;
  padding: var(--section-y) var(--gutter);
  border-top: var(--line-thin) solid var(--line-light);
}
.fx-sheet > h2 { margin-bottom: 12px; font-size: clamp(34px, 4vw, 54px); }
.fx-sheet > p {
  max-width: 62ch;
  margin-bottom: clamp(40px, 6vh, 64px);
  font-size: 17px;
  color: var(--ink-70);
}
.fx-group { margin-bottom: clamp(40px, 6vh, 64px); }
.fx-group > h3 {
  margin-bottom: 20px;
  padding-bottom: 10px;
  font-family: var(--sans);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ember);
  border-bottom: var(--line-thin) solid var(--line-light);
}
.fx-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 28px 36px;
  padding: 28px;
  background: var(--paper);
  border-radius: 3px;
}
.fx-row-dark { color: var(--cream); background: var(--ink); }
.fx-row-leaf { color: var(--cream); background: var(--leaf-deep); }
.fx-row-paper { background: #fffaf1; }
.fx-item { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
.fx-item > em {
  font-family: var(--sans);
  font-size: 15px;
  font-style: normal;
  opacity: 0.72;
}

/* Estados de hover congelados, para que existan en la maqueta. */
.button-primary.fx-hover { background: #ffa246; border-color: #ffa246; }
.button-ghost.fx-hover { color: var(--ink); background: var(--orange); border-color: var(--orange); }
.size-pick.fx-hover { background: rgba(242, 140, 40, 0.16); border-color: var(--orange); }
.link-underline.fx-hover { color: var(--orange); border-color: var(--orange); }
.fold-arrow.fx-hover { opacity: 1; background: rgba(242, 140, 40, 0.16); }
.fx-focus { border-color: var(--orange) !important; }
.fx-closed { transform: none !important; }
.fx-open { transform: rotate(180deg) !important; }

.fx-chip {
  position: relative;
  display: grid;
  width: 104px;
  height: 104px;
  background: var(--ink);
  border-radius: 50%;
}
.fx-chip .companion-art {
  grid-area: 1 / 1;
  width: 72%;
  height: 72%;
  margin: auto;
  opacity: 1;
  transform: none;
}
.fx-chip .companion-ring { position: absolute; inset: -9px; width: auto; height: auto; }

.fx-swatches { display: flex; flex-wrap: wrap; gap: 20px; }
.fx-swatch { width: 150px; }
.fx-swatch i {
  display: block;
  height: 86px;
  margin-bottom: 10px;
  border: var(--line-thin) solid var(--line-light);
  border-radius: 3px;
}
.fx-swatch b { display: block; font-size: 16px; font-weight: 600; }
.fx-swatch span { font-size: 15px; color: var(--ink-70); }
.fx-type .fx-row { display: block; }
.fx-type .fx-row > div { margin-bottom: 22px; }
.fx-type .fx-row > div:last-child { margin-bottom: 0; }
.fx-type span { display: block; margin-top: 6px; font-size: 15px; color: var(--ink-70); }
"""

HTML = """
    <section class="fx-sheet">
      <h2>Componentes y estados</h2>
      <p>
        Todo lo que en la web depende de la interacción, acá está desplegado: cada
        botón con su estado normal y el de paso del mouse, el acompañante en sus
        cuatro momentos, y el resto de los componentes en sus dos estados.
      </p>

      <div class="fx-group">
        <h3>Botones sobre fondo claro</h3>
        <div class="fx-row">
          <div class="fx-item"><span class="button button-primary">Quiero mi Carrot Cake</span><em>Primario · normal</em></div>
          <div class="fx-item"><span class="button button-primary fx-hover">Quiero mi Carrot Cake</span><em>Primario · hover</em></div>
          <div class="fx-item"><span class="size-pick">Elegir la Clásica</span><em>Secundario · normal</em></div>
          <div class="fx-item"><span class="size-pick fx-hover">Elegir la Clásica</span><em>Secundario · hover</em></div>
        </div>
      </div>

      <div class="fx-group">
        <h3>Botones sobre fondo oscuro</h3>
        <div class="fx-row fx-row-dark">
          <div class="fx-item"><span class="button button-ghost">Hacer un pedido</span><em>Header · normal</em></div>
          <div class="fx-item"><span class="button button-ghost fx-hover">Hacer un pedido</span><em>Header · hover</em></div>
          <div class="fx-item"><span class="link-underline">Conocé nuestra historia</span><em>Enlace · normal</em></div>
          <div class="fx-item"><span class="link-underline fx-hover">Conocé nuestra historia</span><em>Enlace · hover</em></div>
        </div>
      </div>

      <div class="fx-group">
        <h3>Acompañante · los cuatro estados</h3>
        <div class="fx-row fx-row-dark">__CHIPS__</div>
      </div>

      <div class="fx-group">
        <h3>Desplegable</h3>
        <div class="fx-row">
          <div class="fx-item"><i class="fold-arrow fx-closed" style="border-color: rgba(26,16,8,.3); opacity: 1"></i><em>Cerrado</em></div>
          <div class="fx-item"><i class="fold-arrow fx-open" style="border-color: rgba(26,16,8,.3); opacity: 1"></i><em>Abierto</em></div>
          <div class="fx-item"><i class="fold-arrow fx-closed fx-hover" style="border-color: rgba(26,16,8,.3)"></i><em>Hover</em></div>
        </div>
      </div>

      <div class="fx-group">
        <h3>Cupón</h3>
        <div class="coupon" style="margin-bottom: 22px">__COUPON_A__</div>
        <div class="coupon is-used" style="margin-bottom: 0">__COUPON_B__</div>
      </div>

      <div class="fx-group">
        <h3>Campos del formulario</h3>
        <div class="fx-row fx-row-paper">
          <label class="field" style="min-width: 250px"><span>Tu nombre</span><input type="text" placeholder="¿Cómo te llamás?" /></label>
          <label class="field" style="min-width: 250px"><span>Tu nombre · con foco</span><input class="fx-focus" type="text" value="Timoteo" /></label>
          <div class="fx-item" style="min-width: 280px"><p class="form-status" style="margin: 0">Abrimos WhatsApp con el pedido listo para enviar.</p><em>Aviso de estado</em></div>
        </div>
      </div>

      <div class="fx-group">
        <h3>Paleta</h3>
        <div class="fx-swatches">
          <div class="fx-swatch"><i style="background: #f28c28"></i><b>Naranja Zanahoria</b><span>#F28C28</span></div>
          <div class="fx-swatch"><i style="background: #fff4e6"></i><b>Crema</b><span>#FFF4E6</span></div>
          <div class="fx-swatch"><i style="background: #8b5a2b"></i><b>Marrón Canela</b><span>#8B5A2B</span></div>
          <div class="fx-swatch"><i style="background: #6b8e23"></i><b>Verde Natural</b><span>#6B8E23</span></div>
          <div class="fx-swatch"><i style="background: #1a1008"></i><b>Tinta</b><span>#1A1008</span></div>
          <div class="fx-swatch"><i style="background: #4e6b18"></i><b>Verde de fondo</b><span>#4E6B18</span></div>
          <div class="fx-swatch"><i style="background: #b4530c"></i><b>Naranja sobre crema</b><span>#B4530C</span></div>
          <div class="fx-swatch"><i style="background: #fbeedd"></i><b>Papel</b><span>#FBEEDD</span></div>
        </div>
      </div>

      <div class="fx-group fx-type">
        <h3>Tipografía</h3>
        <div class="fx-row">
          <div><h1 style="font-size: 96px; margin: 0">La torta del sueño.</h1><span>Playfair Display 500 · titular</span></div>
          <div><h2 style="font-size: 52px; margin: 0">Todo lo que queremos</h2><span>Playfair Display 500 · sección</span></div>
          <div><h3 style="font-size: 30px; margin: 0">Zanahoria fresca</h3><span>Playfair Display 500 · bloque</span></div>
          <div><p style="font-size: 17px; max-width: 60ch; margin: 0">Húmeda, especiada y generosa. La zanahoria hace su trabajo en silencio y el frosting se lleva los aplausos.</p><span>Montserrat 400 · cuerpo 17px</span></div>
          <div><p style="font-size: 16px; color: var(--ink-70); max-width: 60ch; margin: 0">Rallada fina el mismo día. Aporta humedad y todo el dulzor de base.</p><span>Montserrat 400 · secundario 16px</span></div>
          <div><p class="kicker kicker-dark" style="margin: 0">La receta</p><span>Montserrat 600 · antetítulo 16px</span></div>
        </div>
      </div>
    </section>
"""
