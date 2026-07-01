// Homepage: manifest -> cards, search + filters + sorting, interactive map,
// language/theme/season toggles, PWA install.
import { STR, getLang, setLang, getTheme, setTheme, applyDocLang } from "./i18n.js";
import { buildMap } from "./map.js";
import { getCounts } from "./views.js";
import { applySeason, setSeasonPref } from "./season.js";

let DATA = [], COUNTS = {}, lang = getLang(), sort = localStorage.getItem("afsaneha_sort")||"new";

async function loadData(){
  try{ DATA = await (await fetch("assets/data/legends.json",{cache:"no-store"})).json(); }catch(e){ DATA=[]; }
  try{ COUNTS = await getCounts(); }catch(e){ COUNTS={}; }
}
function t(){ return STR[lang]; }
function titleOf(i){ return (lang==="en" && i.title_en) ? i.title_en : (i.title_fa||i.title_en||i.slug); }
function excerptOf(i){ return (lang==="en" && i.excerpt_en) ? i.excerpt_en : (i.excerpt_fa||i.excerpt_en||""); }
function viewsOf(i){ return COUNTS[i.slug]||0; }

function fillFilters(){
  const s=t();
  const prov=[...new Set(DATA.map(d=>d.province).filter(Boolean))].sort();
  const cre=[...new Set(DATA.map(d=>d.creature).filter(Boolean))].sort();
  const pSel=document.getElementById("filterProvince"), cSel=document.getElementById("filterCreature");
  const pv=pSel.value, cv=cSel.value;
  pSel.innerHTML='<option value="">'+s.allProvinces+'</option>'+prov.map(p=>'<option'+(p===pv?' selected':'')+'>'+p+'</option>').join("");
  cSel.innerHTML='<option value="">'+s.allCreatures+'</option>'+cre.map(c=>'<option'+(c===cv?' selected':'')+'>'+c+'</option>').join("");
}
function sortList(list){
  if(sort==="az") return list.sort((a,b)=>titleOf(a).localeCompare(titleOf(b),"fa"));
  if(sort==="popular") return list.sort((a,b)=>viewsOf(b)-viewsOf(a) || (b.created||"").localeCompare(a.created||""));
  return list.sort((a,b)=>(b.created||"").localeCompare(a.created||""));
}
function render(){
  const s=t();
  const q=(document.getElementById("searchBox").value||"").trim().toLowerCase();
  const fp=document.getElementById("filterProvince").value;
  const fc=document.getElementById("filterCreature").value;
  const grid=document.getElementById("grid");
  let list=DATA.filter(d=>{
    if(fp && d.province!==fp) return false;
    if(fc && d.creature!==fc) return false;
    if(q){ const hay=[d.title_fa,d.title_en,d.province,d.city,d.dialect,d.creature,d.author,(d.tags||[]).join(" ")].join(" ").toLowerCase(); if(!hay.includes(q)) return false; }
    return true;
  });
  list=sortList(list);
  const cb=document.getElementById("countBadge"); if(cb) cb.textContent=list.length+" "+s.legendsCount;
  if(!list.length){ grid.innerHTML='<div class="empty">'+s.empty+'</div>'; return; }
  grid.innerHTML=list.map(d=>{
    const href=d.url||("legend.html?id="+encodeURIComponent(d.slug));
    const v=viewsOf(d);
    return '<a class="card" href="'+href+'">'+
      '<h3>'+titleOf(d)+' '+(d.has_en?'<span class="badge-en">EN</span>':"")+'</h3>'+
      '<div class="meta">'+(d.province?'<span class="tag">'+d.province+'</span>':"")+(d.city?'<span class="tag">'+d.city+'</span>':"")+(d.creature?'<span class="tag">'+d.creature+'</span>':"")+'</div>'+
      '<div class="excerpt">'+excerptOf(d)+'</div>'+
      '<div class="author">'+s.by+' '+(d.author||s.unknown)+(v?' · '+v+' '+s.views:"")+'</div>'+
    '</a>';
  }).join("");
}
function paintSort(){ document.querySelectorAll("#sortSeg button").forEach(b=>b.classList.toggle("active", b.dataset.sort===sort)); }

function applyStrings(){
  const s=t(); applyDocLang(lang);
  document.title=s.site+" — "+s.tagline;
  document.querySelectorAll("[data-i18n]").forEach(el=>{ const k=el.getAttribute("data-i18n"); if(s[k]!==undefined) el.textContent=s[k]; });
  const sb=document.getElementById("searchBox"); if(sb) sb.placeholder=s.search;
  const lb=document.getElementById("langBtn"); if(lb) lb.textContent=s.langBtn;
  const sm={new:"sortNew",popular:"sortPopular",az:"sortAz"};
  document.querySelectorAll("#sortSeg button").forEach(b=>{ b.textContent=s[sm[b.dataset.sort]]; });
  fillFilters(); paintSort(); render();
  buildMap({lang});
}
function updateLogo(){ const th=getTheme(); document.querySelectorAll("img.logo,img.brand-logo").forEach(img=>{ img.src = th==="light"?"assets/img/logo-purple.png":"assets/img/logo-amber.png"; }); }

function initToggles(){
  setTheme(getTheme());
  document.getElementById("themeBtn").addEventListener("click",()=>{ setTheme(getTheme()==="dark"?"light":"dark"); updateLogo(); buildMap({lang}); });
  document.getElementById("langBtn").addEventListener("click",()=>{ lang=lang==="fa"?"en":"fa"; setLang(lang); applyStrings(); });
  ["searchBox","filterProvince","filterCreature"].forEach(id=>document.getElementById(id).addEventListener("input",render));
  document.querySelectorAll("#sortSeg button").forEach(b=>b.addEventListener("click",()=>{ sort=b.dataset.sort; localStorage.setItem("afsaneha_sort",sort); paintSort(); render(); }));
  const seasonSel=document.getElementById("seasonSel");
  if(seasonSel){ seasonSel.value=localStorage.getItem("afsaneha_season")||"auto"; seasonSel.addEventListener("change",()=>setSeasonPref(seasonSel.value)); }
}
// PWA install prompt
let deferredPrompt=null;
addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferredPrompt=e; const b=document.getElementById("installBtn"); if(b) b.style.display="inline-flex"; });
document.addEventListener("click",e=>{ if(e.target && e.target.id==="installBtn" && deferredPrompt){ deferredPrompt.prompt(); deferredPrompt=null; e.target.style.display="none"; } });

(async function(){ initToggles(); updateLogo(); applySeason(); await loadData(); applyStrings(); })();
