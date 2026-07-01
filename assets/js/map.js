// Interactive Iran map: click a province to filter, plus a dot per legend at its
// coordinates. Self-contained SVG (no external map asset). Works offline.
// Projection: simple equirectangular over Iran's bounding box.
const W = 900, H = 680;
const N = 39.9, S = 24.8, WLON = 43.8, ELON = 63.5;
export function project(lat, lon){
  const x = (lon - WLON) / (ELON - WLON) * W;
  const y = (N - lat) / (N - S) * H;
  return [x, y];
}
// Simplified Iran national outline (lon,lat) — stylised, recognisable silhouette.
const OUTLINE = [
  [44.1,39.4],[45.5,39.0],[46.5,38.9],[47.9,39.7],[48.6,38.4],[48.9,37.7],
  [50.2,37.4],[51.6,36.9],[53.9,36.9],[54.2,37.1],[56.4,37.3],[57.8,37.6],
  [59.4,37.9],[60.4,37.5],[61.2,36.6],[61.1,35.6],[60.7,34.3],[60.5,33.5],
  [60.9,31.4],[61.8,31.4],[61.7,29.9],[62.8,27.3],[61.7,25.7],[59.0,25.4],
  [57.3,25.6],[56.4,26.6],[55.0,26.7],[53.0,26.8],[51.5,27.8],[50.0,29.0],
  [48.9,30.0],[48.5,30.4],[48.0,30.5],[47.7,31.0],[47.4,32.5],[46.1,33.0],
  [45.4,33.9],[46.1,35.0],[45.4,36.0],[44.8,37.1],[44.1,38.1],[44.2,39.0],[44.1,39.4]
];
function outlinePath(){
  return OUTLINE.map((p,i)=>{ const [x,y]=project(p[1],p[0]); return (i?"L":"M")+x.toFixed(1)+" "+y.toFixed(1); }).join(" ")+" Z";
}
const SVGNS = "http://www.w3.org/2000/svg";
function el(name, attrs){ const n=document.createElementNS(SVGNS,name); for(const k in attrs) n.setAttribute(k, attrs[k]); return n; }

export async function buildMap(opts){
  const host = document.getElementById("iranMap");
  if(!host) return;
  const lang = opts && opts.lang || "fa";
  let provinces=[], legends=[];
  try{ provinces = await (await fetch("assets/data/provinces.json",{cache:"no-store"})).json(); }catch(e){}
  try{ legends = await (await fetch("assets/data/legends.json",{cache:"no-store"})).json(); }catch(e){}
  const counts = {};
  legends.forEach(l=>{ if(l.province) counts[l.province]=(counts[l.province]||0)+1; });

  const svg = el("svg",{viewBox:"0 0 "+W+" "+H, class:"iran-svg", role:"img", "aria-label":"Map of Iran"});
  // layers for parallax
  const gGlow = el("g",{class:"map-layer glow"});
  const gLand = el("g",{class:"map-layer land"});
  const gPins = el("g",{class:"map-layer pins"});
  const gDots = el("g",{class:"map-layer dots"});

  const glow = el("ellipse",{cx:W*0.52, cy:H*0.5, rx:W*0.42, ry:H*0.44, class:"map-glow"});
  gGlow.appendChild(glow);
  const land = el("path",{d:outlinePath(), class:"map-land"});
  gLand.appendChild(land);

  provinces.forEach(p=>{
    const [x,y]=project(p.lat,p.lon);
    const c=counts[p.fa]||0;
    const g=el("g",{class:"prov"+(c?" has":""), tabindex:"0", role:"button", "data-province":p.fa});
    g.setAttribute("aria-label", (lang==="en"?p.en:p.fa)+(c?(" — "+c):""));
    const dot=el("circle",{cx:x, cy:y, r:c?7:4, class:"prov-dot"});
    const label=el("text",{x:x, y:y-11, class:"prov-label", "text-anchor":"middle"});
    label.textContent = lang==="en"?p.en:p.fa;
    g.appendChild(dot); g.appendChild(label);
    if(c){ const b=el("text",{x:x, y:y+3.5, class:"prov-count", "text-anchor":"middle"}); b.textContent=String(c); g.appendChild(b); }
    const pick=()=>selectProvince(p.fa);
    g.addEventListener("click", pick);
    g.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); pick(); }});
    gPins.appendChild(g);
  });

  legends.forEach(l=>{
    if(!l.coordinates) return;
    const parts=String(l.coordinates).split(",").map(s=>parseFloat(s.trim()));
    if(parts.length<2 || parts.some(isNaN)) return;
    const [x,y]=project(parts[0],parts[1]);
    const a=el("a",{href:l.url||("legend.html?id="+encodeURIComponent(l.slug)), class:"legend-dot-link"});
    const d=el("circle",{cx:x, cy:y, r:5, class:"legend-dot"});
    const ttl=el("title"); ttl.textContent=(lang==="en"&&l.title_en?l.title_en:l.title_fa)||l.slug;
    a.appendChild(d); a.appendChild(ttl); gDots.appendChild(a);
  });

  svg.appendChild(gGlow); svg.appendChild(gLand); svg.appendChild(gPins); svg.appendChild(gDots);
  host.innerHTML=""; host.appendChild(svg);

  function selectProvince(fa){
    const sel=document.getElementById("filterProvince");
    if(sel){ sel.value=fa; sel.dispatchEvent(new Event("input",{bubbles:true})); }
    document.querySelectorAll("#iranMap .prov").forEach(n=>n.classList.toggle("active", n.getAttribute("data-province")===fa));
    const b=document.getElementById("browse"); if(b) b.scrollIntoView({behavior:"smooth"});
  }

  // Layered parallax on scroll (respects reduced-motion)
  if(!matchMedia("(prefers-reduced-motion: reduce)").matches){
    let ticking=false;
    const onScroll=()=>{
      if(ticking) return; ticking=true;
      requestAnimationFrame(()=>{
        const r=host.getBoundingClientRect();
        const off=(r.top + r.height/2 - innerHeight/2) / innerHeight; // -0.5..0.5-ish
        gGlow.style.transform="translateY("+(off*38).toFixed(1)+"px)";
        gLand.style.transform="translateY("+(off*18).toFixed(1)+"px)";
        gPins.style.transform="translateY("+(off*-8).toFixed(1)+"px)";
        gDots.style.transform="translateY("+(off*-16).toFixed(1)+"px)";
        ticking=false;
      });
    };
    addEventListener("scroll", onScroll, {passive:true}); onScroll();
  }
}
