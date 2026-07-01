// Subtle 3D pointer tilt on cards (event-delegated, reduced-motion aware).
(function(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.addEventListener("pointermove", e=>{
    const card=e.target.closest && e.target.closest(".card"); if(!card) return;
    const r=card.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width-0.5, py=(e.clientY-r.top)/r.height-0.5;
    card.style.transform="perspective(700px) rotateY("+(px*6).toFixed(2)+"deg) rotateX("+(-py*6).toFixed(2)+"deg) translateZ(4px)";
  });
  document.addEventListener("pointerout", e=>{ const card=e.target.closest && e.target.closest(".card"); if(card) card.style.transform=""; });
})();
