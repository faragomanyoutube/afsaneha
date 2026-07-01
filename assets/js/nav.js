/* Self-contained mobile navigation: turns the header button row into a
   hamburger dropdown on small screens. No imports, no dependencies. */
(function(){
  function build(){
    var hi = document.querySelector(".header-inner");
    if(!hi || hi.querySelector(".nav-toggle")) return;
    var brand = hi.querySelector(".brand");
    var kids = Array.prototype.slice.call(hi.children);
    var items = kids.filter(function(el){ return el !== brand && !el.classList.contains("spacer"); });
    var sp = hi.querySelector(".spacer"); if(sp) sp.parentNode.removeChild(sp);
    var drawer = document.createElement("div"); drawer.className = "nav-drawer";
    items.forEach(function(el){ drawer.appendChild(el); });
    var toggle = document.createElement("button");
    toggle.type = "button"; toggle.className = "btn nav-toggle";
    toggle.setAttribute("aria-label", "منو"); toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = "☰";
    hi.appendChild(toggle); hi.appendChild(drawer);
    function close(){ hi.classList.remove("nav-open"); toggle.innerHTML = "☰"; toggle.setAttribute("aria-expanded", "false"); }
    toggle.addEventListener("click", function(e){ e.stopPropagation();
      var open = hi.classList.toggle("nav-open");
      toggle.innerHTML = open ? "✕" : "☰"; toggle.setAttribute("aria-expanded", open ? "true" : "false"); });
    drawer.addEventListener("click", function(e){ e.stopPropagation(); });
    document.addEventListener("click", close);
    document.addEventListener("keydown", function(e){ if(e.key === "Escape") close(); });
    Array.prototype.forEach.call(drawer.querySelectorAll("a"), function(a){ a.addEventListener("click", close); });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
