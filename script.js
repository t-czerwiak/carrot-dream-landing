/* Carrot Dream — interacciones de la landing.
   Sin dependencias. Todas las animaciones se resuelven con transform y opacity. */

(() => {
  "use strict";

  /* Número de WhatsApp del negocio (dato de demostración: cambialo antes de publicar).
     El enlace del footer, en index.html, usa el mismo número. */
  const WHATSAPP = "5491100000000";

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  /* --- Revelado al entrar en pantalla ------------------------------------ */

  const revealItems = document.querySelectorAll("[data-reveal]");
  const showAll = () => revealItems.forEach((el) => el.classList.add("is-visible"));

  if (motionQuery.matches || !("IntersectionObserver" in window)) {
    showAll();
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
  if (header) {
    const syncHeader = () => header.classList.toggle("is-stuck", window.scrollY > 24);
    window.addEventListener("scroll", syncHeader, { passive: true });
    syncHeader();
  }

  /* --- Recorrido: "De la raíz a tu mesa" ---------------------------------- */

  const journey = document.querySelector("[data-journey]");
  const moments = journey ? [...journey.querySelectorAll(".moment")] : [];
  const railDots = journey ? [...journey.querySelectorAll(".journey-rail i")] : [];

  if (journey && moments.length) {
    const stage = journey.querySelector(".journey-stage");
    const plates = journey.querySelector(".journey-plates");
    const carrot = journey.querySelector(".orbit-carrot");

    let active = -1;
    let path = null;

    const setStage = (index) => {
      if (index === active) return;
      active = index;
      moments.forEach((m, i) => m.classList.toggle("is-active", i === index));
      railDots.forEach((dot, i) => dot.classList.toggle("is-active", i <= index));
    };

    /* Radios del recorrido, medidos sobre la escena real: la zanahoria pasa
       por afuera del plato sin llegar nunca al título ni al texto. */
    const measure = () => {
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

    const update = () => {
      const rect = journey.getBoundingClientRect();
      const range = Math.max(1, journey.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / range, 0, 1);

      journey.style.setProperty("--p", progress.toFixed(4));
      // Las migas aparecen recién sobre el final del recorrido.
      journey.style.setProperty("--crumbs", clamp((progress - 0.78) / 0.14, 0, 1).toFixed(3));
      setStage(Math.min(moments.length - 1, Math.floor(progress * moments.length)));

      if (!path) path = measure();
      if (!path || !carrot) return;

      // Arranca a la izquierda del plato, sube por arriba y baja por la
      // derecha; sobre el final el radio se cierra y la zanahoria se hunde
      // detrás de la torta terminada.
      const angle = (-104 + progress * 274) * (Math.PI / 180);
      const sink = 1 - 0.78 * clamp((progress - 0.82) / 0.18, 0, 1);
      const style = carrot.style;
      style.setProperty("--x", `${(path.cx + Math.sin(angle) * path.rx * sink).toFixed(1)}px`);
      style.setProperty("--y", `${(path.cy - Math.cos(angle) * path.ry * sink).toFixed(1)}px`);
      style.setProperty("--rot", `${(-24 + progress * 384).toFixed(1)}deg`);
      style.setProperty("--carrot-s", (1.06 - progress * 0.3).toFixed(3));
      style.setProperty("--carrot-o", clamp((0.97 - progress) / 0.08, 0, 1).toFixed(3));
    };

    if (motionQuery.matches) {
      moments.forEach((m) => m.classList.add("is-active"));
    } else {
      let queued = false;
      const onScroll = () => {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(() => {
          queued = false;
          update();
        });
      };
      const onResize = () => {
        path = null;
        onScroll();
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      window.addEventListener("load", onResize);
      update();
    }
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
    if (!motionQuery.matches) video.play().catch(() => {});
  }

  /* --- Formulario de pedido ----------------------------------------------- */

  const form = document.querySelector("[data-order-form]");
  if (form) {
    const status = form.querySelector(".form-status");
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
        `Torta: ${data.get("torta")}`,
        `Fecha: ${readableDate(data.get("fecha"))}`,
        `Nombre: ${data.get("nombre")}`,
        data.get("detalle") ? `Detalle: ${data.get("detalle")}` : "",
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
