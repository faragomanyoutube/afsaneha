// Homepage logic: load manifest, render cards, search + filters, language + theme toggle.
import { STR, getLang, setLang, getTheme, setTheme, applyDocLang } from "./i18n.js";

let DATA = [];
let lang = getLang();

async function loadData(){
  try{
    const res = await fetch("assets/data/legends.json", {cache:"no-store"});
    DATA = await res.json();
  }catch(e){ DATA = []; }
}

function t(){ return STR[lang]; }

function titleOf(item){
  if(lang==="en" && item.title_en) return item.title_en;
  return item.title_fa || item.title_en || item.slug;
}
function excerptOf(item){
  if(lang==="en" && item.excerpt_en) return item.excerpt_en;
  return item.excerpt_fa || item.excerpt_en || "";
}

function fillFilters(){
  const s=t();
  const prov = [...new Set(DATA.map(d=>d.province).filter(Boolean))].sort();
  const cre  = [...new Set(DATA.map(d=>d.creature).filter(Boolean))].sort();
  const pSel=document.getElementById("filterProvince");
  const cSel=document.getElementById("filterCreature");
  pSel.innerHTML=`<option value=\"\">${s.allProvinces}</option>`+prov.map(p=>`<option>${p}</option>`).join("");
  cSel.innerHTML=`<option value=\"\">${s.allCreatures}</option>`+cre.map(c=>`<option>${c}</option>`).join("");
}

function render(){
  const s=t();
  const q=(document.getElementById("searchBox").value||"").trim().toLowerCase();
  const fp=document.getElementById("filterProvince").value;
  const fc=document.getElementById("filterCreature").value;
  const grid=document.getElementById("grid");
  const list=DATA.filter(d=>{
    if(fp && d.province!==fp) return false;
    if(fc && d.creature!==fc) return false;
    if(q){
      const hay=[d.title_fa,d.title_en,d.province,d.city,d.dialect,d.creature,d.author,(d.tags||[]).join(" ")].join(" ").toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
  if(!list.length){ grid.innerHTML=`<div class=\"empty\">${s.empty}</div>`; return; }
  grid.innerHTML=list.map(d=>`
    <a class=\"card\" href=\"legend.html?id=${encodeURIComponent(d.slug)}\">
      <h3>${titleOf(d)} ${d.has_en?`<span class=\"badge-en\">EN</span>`:""}</h3>
      <div class=\"meta\">
        ${d.province?`<span class=\"tag\">${d.province}</span>`:""}
        ${d.city?`<span class=\"tag\">${d.city}</span>`:""}
        ${d.creature?`<span class=\"tag\">${d.creature}</span>`:""}
      </div>
      <div class=\"excerpt\">${excerptOf(d)}</div>
      <div class=\"author\">${s.by} ${d.author||s.unknown}</div>
    </a>`).join("");
}

function applyStrings(){
  const s=t();
  applyDocLang(lang);
  document.title = s.site + " — " + s.tagline;
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k=el.getAttribute("data-i18n");
    if(s[k]!==undefined) el.textContent=s[k];
  });
  const sb=document.getElementById("searchBox"); if(sb) sb.placeholder=s.search;
  const lb=document.getElementById("langBtn"); if(lb) lb.textContent=s.langBtn;
  fillFilters();
  render();
}

function initToggles(){
  setTheme(getTheme());
  const themeBtn=document.getElementById("themeBtn");
  themeBtn.addEventListener("click",()=>{
    const next = getTheme()==="dark" ? "light" : "dark";
    setTheme(next); updateLogo();
  });
  document.getElementById("langBtn").addEventListener("click",()=>{
    lang = lang==="fa" ? "en" : "fa"; setLang(lang); applyStrings();
  });
  ["searchBox","filterProvince","filterCreature"].forEach(id=>{
    document.getElementById(id).addEventListener("input",render);
  });
}
function updateLogo(){
  const theme=getTheme();
  document.querySelectorAll("img.logo,img.brand-logo").forEach(img=>{
    img.src = theme==="light" ? "assets/img/logo-purple.png" : "assets/img/logo-amber.png";
  });
}

(async function(){
  initToggles();
  updateLogo();
  await loadData();
  applyStrings();
})();
