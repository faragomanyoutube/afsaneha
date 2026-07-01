// Interactive 3D tilt for legend cards.
// Uses event delegation so cards rendered later by app.js also work.
// Respects prefers-reduced-motion.
(function(){
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const MAX = 9; // max tilt in degrees
  let active = null;

  function reset(){
    if (active){ active.style.transform = ""; active = null; }
  }

  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest && e.target.closest(".card");
    if (card !== active) reset();
    if (!card) return;
    active = card;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const ry = (px - 0.5) * (MAX * 2);
    const rx = (0.5 - py) * (MAX * 2);
    card.style.transform =
      `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-5px) scale(1.02)`;
  }, { passive: true });

  // Reset when leaving the window or scrolling.
  document.addEventListener("pointerleave", reset, true);
  window.addEventListener("blur", reset);
  window.addEventListener("scroll", reset, { passive: true });
})();
