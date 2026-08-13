/* Carrot Dream — interacciones de la landing.
   Sin dependencias. Todas las animaciones se resuelven con transform y opacity.

   Todo lo que depende del scroll se calcula en un único bucle de
   requestAnimationFrame (`frame`), para no encadenar listeners que se pisen. */

(() => {
  "use strict";

  /* Número de WhatsApp del negocio (dato de demostración: cambialo antes de publicar).
     El enlace del footer, en index.html, usa el mismo número. */
  const WHATSAPP = "5491100000000";

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = motionQuery.matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  /* Suaviza los extremos de un rango: evita saltos al entrar y salir. */
  const ramp = (value, from, to) => {
    const t = clamp((value - from) / (to - from), 0, 1);
    return t * t * (3 - 2 * t);
  };

  let scrollY = window.scrollY;
  let velocity = 0;

  /* --- Revelado al entrar en pantalla ------------------------------------ */

  /* El revelado se mantiene también con movimiento reducido: sin desplazamiento
     (lo anula el CSS), sólo el fundido. */
  const revealItems = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries, self) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          self.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6%" },
    );
    revealItems.forEach((el) => observer.observe(el));
  }

  /* --- Header sólido al bajar -------------------------------------------- */

  const header = document.querySelector("[data-header]");

  /* --- Acompañante -------------------------------------------------------- */

  const companion = document.querySelector("[data-companion]");
  const arts = companion ? [...companion.querySelectorAll(".companion-art")] : [];
  const zones = [...document.querySelectorAll("[data-companion-state]")];
  let companionState = "carrot";

  const setCompanionState = (state) => {
    // El estado "none" es el recorrido: ahí la zanahoria ya está en escena.
    companion.classList.toggle("is-awake", state !== "none");
    if (state === companionState || state === "none") return;
    companionState = state;
    arts.forEach((art) => art.classList.toggle("is-on", art.dataset.state === state));
  };

  /* Gana la sección que ocupa el centro de la pantalla. */
  const currentZone = () => {
    const middle = window.innerHeight / 2;
    for (const zone of zones) {
      const box = zone.getBoundingClientRect();
      if (box.top <= middle && box.bottom >= middle) return zone.dataset.companionState;
    }
    return companionState === "none" ? "carrot" : companionState;
  };

  /* --- Recorrido: "De la raíz a tu mesa" ---------------------------------- */

  const journey = document.querySelector("[data-journey]");
  const moments = journey ? [...journey.querySelectorAll(".moment")] : [];
  const railDots = journey ? [...journey.querySelectorAll(".journey-rail i")] : [];
  const stage = journey?.querySelector(".journey-stage");
  const plates = journey?.querySelector(".journey-plates");
  const carrot = journey?.querySelector(".orbit-carrot");
  let activeMoment = -1;
  let path = null;

  const setMoment = (index) => {
    if (index === activeMoment) return;
    activeMoment = index;
    moments.forEach((m, i) => m.classList.toggle("is-active", i === index));
    railDots.forEach((dot, i) => dot.classList.toggle("is-active", i <= index));
  };

  /* Radios del recorrido, medidos sobre la escena real: la zanahoria pasa
     por afuera del plato sin llegar nunca al título ni al texto. */
  const measureJourney = () => {
    if (!stage || !plates || !carrot) return null;
    const scene = stage.getBoundingClientRect();
    const disc = plates.getBoundingClientRect();
    if (!scene.height || !disc.width) return null;

    const half = disc.width / 2;
    const carrotHalf = (carrot.getBoundingClientRect().height || 60) / 2;
    const roomAbove = disc.top - scene.top;

    return {
      cx: disc.left + half - scene.left,
      cy: disc.top + half - scene.top,
      rx: half + clamp(scene.width * 0.055, 46, 118),
      ry: half + clamp(roomAbove - carrotHalf - 12, 18, 92),
    };
  };

  const updateJourney = () => {
    const box = journey.getBoundingClientRect();
    const range = Math.max(1, journey.offsetHeight - window.innerHeight);
    const progress = clamp(-box.top / range, 0, 1);

    journey.style.setProperty("--p", progress.toFixed(4));
    // La escena se apaga al salir, en vez de meterse cortada bajo el header.
    journey.style.setProperty("--exit", ramp(box.bottom, window.innerHeight * 0.34, window.innerHeight * 0.9).toFixed(3));
    // Las migas aparecen recién sobre el final del recorrido.
    journey.style.setProperty("--crumbs", clamp((progress - 0.78) / 0.14, 0, 1).toFixed(3));
    setMoment(Math.min(moments.length - 1, Math.floor(progress * moments.length)));

    if (!path) path = measureJourney();
    if (!path || !carrot) return;

    // Arranca a la izquierda del plato, sube por arriba y baja por la derecha;
    // sobre el final el radio se cierra y la zanahoria se hunde detrás de la
    // torta terminada.
    const angle = (-104 + progress * 274) * (Math.PI / 180);
    const sink = 1 - 0.78 * clamp((progress - 0.82) / 0.18, 0, 1);
    const style = carrot.style;
    style.setProperty("--x", `${(path.cx + Math.sin(angle) * path.rx * sink).toFixed(1)}px`);
    style.setProperty("--y", `${(path.cy - Math.cos(angle) * path.ry * sink).toFixed(1)}px`);
    style.setProperty("--rot", `${(-24 + progress * 384).toFixed(1)}deg`);
    style.setProperty("--carrot-s", (1.06 - progress * 0.3).toFixed(3));
    style.setProperty("--carrot-o", clamp((0.97 - progress) / 0.08, 0, 1).toFixed(3));
  };

  /* --- Frase del origen, palabra por palabra ------------------------------ */

  const quote = document.querySelector("[data-scrub]");
  const quoteWords = quote ? [...quote.querySelectorAll("span")] : [];
  if (quote && quoteWords.length && !reduced) quote.classList.add("is-scrubbing");

  const updateQuote = () => {
    const box = quote.getBoundingClientRect();
    // De 0 a 1 mientras la frase cruza el tercio inferior de la pantalla.
    const progress = ramp(box.top, window.innerHeight * 0.82, window.innerHeight * 0.3);
    quoteWords.forEach((word, i) => {
      // La última palabra tiene que llegar a 1 antes de que termine el rango.
      const start = (i / quoteWords.length) * 0.66;
      word.style.setProperty("--w", (0.26 + 0.74 * ramp(progress, start, start + 0.3)).toFixed(3));
    });
  };

  /* --- Parallax del hero --------------------------------------------------- */

  /* Sólo capas internas del hero: los contenedores con [data-reveal] no se
     tocan, porque su animación de entrada también usa transform. */
  const heroFrame = document.querySelector(".hero-visual .frame");
  const parallaxItems = [...document.querySelectorAll("[data-parallax]")];

  const updateHero = () => {
    const shift = Math.min(scrollY, window.innerHeight);
    if (heroFrame) heroFrame.style.transform = `translate3d(0, ${(shift * -0.08).toFixed(1)}px, 0)`;
  };

  /* Las fotos marcadas se corren despacio dentro de su marco. */
  const updateParallax = () => {
    const middle = window.innerHeight / 2;
    parallaxItems.forEach((item) => {
      const box = item.getBoundingClientRect();
      if (box.bottom < -80 || box.top > window.innerHeight + 80) return;
      const offset = clamp((box.top + box.height / 2 - middle) / window.innerHeight, -1, 1);
      item.style.transform = `translate3d(0, ${(offset * -30).toFixed(1)}px, 0) scale(1.1)`;
    });
  };

  /* --- Marquesina reactiva ------------------------------------------------- */

  const marquee = document.querySelector("[data-marquee]");
  const track = marquee?.querySelector(".marquee-track");
  let marqueeOffset = 0;
  let marqueeVisible = false;

  if (marquee && track && !reduced) {
    marquee.classList.add("is-driven");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        ([entry]) => {
          marqueeVisible = entry.isIntersecting;
        },
        { rootMargin: "80px" },
      ).observe(marquee);
    } else {
      marqueeVisible = true;
    }
  }

  const updateMarquee = (delta) => {
    if (!marqueeVisible) return;
    const half = track.scrollWidth / 2;
    if (half <= 0) return;
    // Ritmo base hacia la izquierda, empujado por la velocidad del scroll.
    marqueeOffset -= (34 + clamp(velocity * 1.6, -170, 170)) * delta;
    if (marqueeOffset <= -half) marqueeOffset += half;
    if (marqueeOffset > 0) marqueeOffset -= half;
    track.style.transform = `translate3d(${marqueeOffset.toFixed(1)}px, 0, 0)`;
  };

  /* --- Bucle -------------------------------------------------------------- */

  /* El recorrido del acompañante termina en el pedido, no al final de la
     página: el aro se completa justo cuando la sección entra en pantalla. */
  const orderSection = document.querySelector("#pedido");
  const pageProgress = () => {
    const fallback = document.documentElement.scrollHeight - window.innerHeight;
    if (!orderSection) return fallback > 0 ? clamp(scrollY / fallback, 0, 1) : 0;
    const target = orderSection.getBoundingClientRect().top + scrollY - window.innerHeight * 0.62;
    return clamp(scrollY / Math.max(1, target), 0, 1);
  };

  let last = 0;
  let running = false;
  let settled = 0;

  const frame = (now) => {
    const delta = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;

    const previous = scrollY;
    scrollY = window.scrollY;
    velocity = velocity * 0.82 + (scrollY - previous) * 0.18;

    // Con la página quieta sólo sigue viva la marquesina: evita medir layout
    // en cada cuadro cuando no hay nada que actualizar.
    const moving = settled < 2 || Math.abs(scrollY - previous) > 0.4 || Math.abs(velocity) > 0.05;
    settled = moving ? 0 : settled + 1;

    if (moving) {
      if (header) header.classList.toggle("is-stuck", scrollY > 24);

      if (companion) {
        const reached = pageProgress();
        setCompanionState(currentZone());
        companion.style.setProperty("--page", reached.toFixed(4));
        // Se inclina y se estira apenas con la velocidad del scroll.
        const speed = Math.abs(velocity);
        companion.style.setProperty("--tilt", `${clamp(velocity * 0.5, -16, 16).toFixed(1)}deg`);
        companion.style.setProperty("--sy", (1 + clamp(speed * 0.004, 0, 0.14)).toFixed(3));
        companion.style.setProperty("--sx", (1 - clamp(speed * 0.002, 0, 0.07)).toFixed(3));
        // Llegaste al pedido: el acompañante se abre como atajo al formulario.
        companion.classList.toggle("is-arrived", reached > 0.995);
      }
      if (journey && moments.length) updateJourney();
      if (quote && quoteWords.length) updateQuote();
      if (heroFrame && scrollY < window.innerHeight * 1.2) updateHero();
      if (parallaxItems.length) updateParallax();
    }
    if (track) updateMarquee(delta);

    if (running) window.requestAnimationFrame(frame);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = 0;
    window.requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
  };

  if (reduced) {
    // Sin movimiento: el acompañante cambia de estado y abre el atajo al llegar
    // al pedido, pero nada se desplaza.
    moments.forEach((m) => m.classList.add("is-active"));
    const syncStatic = () => {
      scrollY = window.scrollY;
      if (header) header.classList.toggle("is-stuck", scrollY > 24);
      if (!companion) return;
      const reached = pageProgress();
      setCompanionState(currentZone());
      companion.style.setProperty("--page", reached.toFixed(4));
      companion.classList.toggle("is-arrived", reached > 0.995);
    };
    if (companion) companion.classList.add("is-awake");
    syncStatic();
    window.addEventListener("scroll", syncStatic, { passive: true });
  } else {
    start();
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    window.addEventListener("resize", () => {
      path = null;
    });
    window.addEventListener("load", () => {
      path = null;
    });
  }

  /* --- Slot de video (queda listo para cuando exista el material) --------- */

  const mediaSlot = document.querySelector("[data-video-src]");
  if (mediaSlot && mediaSlot.dataset.videoSrc) {
    const video = document.createElement("video");
    video.src = mediaSlot.dataset.videoSrc;
    video.poster = mediaSlot.dataset.poster || "";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("aria-label", "Preparación de la Carrot Cake");
    mediaSlot.replaceChildren(video);
    if (!reduced) video.play().catch(() => {});
  }

  /* --- Desplegables -------------------------------------------------------
     Sólo el detalle operativo va plegado. Agregale data-fold-open a un bloque
     de index.html si querés que arranque abierto. */

  document.querySelectorAll("[data-fold]").forEach((fold) => {
    const head = fold.querySelector(".fold-head");
    if (!head) return;
    const setOpen = (open) => {
      fold.classList.toggle("is-open", open);
      head.setAttribute("aria-expanded", String(open));
    };
    setOpen(fold.hasAttribute("data-fold-open"));
    head.addEventListener("click", () => setOpen(!fold.classList.contains("is-open")));
  });

  /* --- Cupón --------------------------------------------------------------
     El descuento y el código son de demostración: cambialos acá y en el texto
     del cupón en index.html, o borrá el bloque entero si no va. */

  const coupon = document.querySelector("[data-coupon]");
  const couponCode = coupon?.querySelector("[data-coupon-code]")?.textContent.trim() || "";
  const couponOff = "10%";
  let couponUsed = false;

  /* --- Formulario de pedido ----------------------------------------------- */

  const form = document.querySelector("[data-order-form]");
  if (form) {
    const status = form.querySelector(".form-status");
    const cakeField = form.querySelector('select[name="torta"]');

    // "Elegir la Clásica" deja la opción cargada y baja al formulario.
    if (coupon) {
      const useButton = coupon.querySelector("[data-coupon-use]");
      useButton?.addEventListener("click", () => {
        couponUsed = true;
        coupon.classList.add("is-used");
        useButton.textContent = "Cupón aplicado";
        if (status) status.textContent = `Cupón ${couponCode} listo: lo sumamos a tu pedido.`;
        form.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      });
    }

    /* Tamaño: las tarjetas son la fuente de verdad y el formulario las refleja. */
    const sizeInputs = [...document.querySelectorAll(".size-radio")];
    const summary = form.querySelector("[data-order-summary]");

    const chosenSize = () => sizeInputs.find((input) => input.checked) || sizeInputs[0];

    const syncSummary = () => {
      const input = chosenSize();
      if (!input || !summary) return;
      const card = input.closest(".size");
      const name = card?.querySelector("h3")?.textContent.trim() || "";
      const dim = card?.querySelector(".size-dim")?.textContent.replace(" de diámetro", "").trim() || "";
      const count = card?.querySelector(".size-count")?.textContent.replace(/\s+/g, " ").trim() || "";
      summary.textContent = [name, dim, count].filter(Boolean).join(" · ");
    };

    sizeInputs.forEach((input) => {
      input.addEventListener("change", syncSummary);
      // Toda la tarjeta responde al clic, no sólo el botón.
      input.closest(".size")?.addEventListener("click", (event) => {
        if (event.target.closest("label")) return; // el label ya lo hace solo
        input.checked = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
    syncSummary();

    form.querySelector("[data-change-size]")?.addEventListener("click", () => {
      const cards = document.querySelector(".sizes");
      cards?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      chosenSize()?.focus({ preventScroll: true });
    });
    const dateField = form.querySelector('input[type="date"]');

    // Pedidos con 48 horas de anticipación.
    if (dateField) {
      const earliest = new Date();
      earliest.setDate(earliest.getDate() + 2);
      dateField.min = earliest.toISOString().slice(0, 10);
    }

    const readableDate = (value) => {
      if (!value) return "";
      const [year, month, day] = value.split("-");
      return `${day}/${month}/${year}`;
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const message = [
        "Hola, Carrot Dream. Quiero hacer un pedido:",
        `Torta: ${chosenSize()?.value || "Carrot Cake"}`,
        `Fecha: ${readableDate(data.get("fecha"))}`,
        `Nombre: ${data.get("nombre")}`,
        data.get("detalle") ? `Detalle: ${data.get("detalle")}` : "",
        couponUsed ? `Cupón: ${couponCode} (${couponOff} de descuento)` : "",
      ]
        .filter(Boolean)
        .join("\n");

      window.open(
        `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer",
      );
      if (status) status.textContent = "Abrimos WhatsApp con el pedido listo para enviar.";
    });
  }
})();
