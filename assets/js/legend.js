// Single legend page: loads legends/<path>/fa.md (or en.md if present).
import { STR, getLang, setLang, getTheme, setTheme, applyDocLang } from "./i18n.js";
import { parseFrontmatter, renderMarkdown } from "./md.js";

let lang = getLang();
let item = null;
let manifest = [];

function t(){ return STR[lang]; }

function params(){ return new URLSearchParams(location.search); }

async function fetchText(url){
  const r = await fetch(url, {cache:"no-store"});
  if(!r.ok) throw new Error("404");
  return r.text();
}

async function loadManifest(){
  try{ manifest = await (await fetch("assets/data/legends.json",{cache:"no-store"})).json(); }
  catch(e){ manifest = []; }
}

async function renderLegend(){
  const s=t();
  const box=document.getElementById("article");
  if(!item){ box.innerHTML=`<p class=\"empty\">${s.notFound}</p>`; return; }
  // choose language file: en only if requested AND available
  let useLang = (lang==="en" && item.has_en) ? "en" : "fa";
  let showNotice = (lang==="en" && !item.has_en);
  let md="";
  try{ md = await fetchText(`legends/${item.path}/${useLang}.md`); }
  catch(e){ box.innerHTML=`<p class=\"empty\">${s.notFound}</p>`; return; }
  const { data, body } = parseFrontmatter(md);
  const title = (useLang==="en" ? (data.title||item.title_en) : (data.title||item.title_fa)) || item.slug;
  const metabar = [
    item.province && `<span class=\"tag\">${s.province}: ${item.province}</span>`,
    item.city && `<span class=\"tag\">${s.city}: ${item.city}</span>`,
    item.dialect && `<span class=\"tag\">${s.dialect}: ${item.dialect}</span>`,
    item.creature && `<span class=\"tag\">${s.creature}: ${item.creature}</span>`
  ].filter(Boolean).join("");
  box.innerHTML = `
    <a class=\"btn\" href=\"index.html\">← ${s.back}</a>
    <h1>${title}</h1>
    <div class=\"metabar\">${metabar}</div>
    ${showNotice?`<div class=\"notice\">${s.noEnglish}</div>`:""}
    <div class=\"body\" dir=\"${useLang==="en"?"ltr":"rtl"}\">${renderMarkdown(body)}</div>
    <div class=\"author\" style=\"margin-top:26px;color:var(--muted)\">${s.by} <b>${item.author||s.unknown}</b></div>
  `;
}

function applyChrome(){
  const s=t();
  applyDocLang(lang);
  document.querySelectorAll("[data-i18n]").forEach(el=>{ const k=el.getAttribute("data-i18n"); if(s[k]!==undefined) el.textContent=s[k]; });
  const lb=document.getElementById("langBtn"); if(lb) lb.textContent=s.langBtn;
  updateLogo();
}
function updateLogo(){
  const theme=getTheme();
  document.querySelectorAll("img.brand-logo").forEach(img=>{ img.src = theme==="light" ? "assets/img/logo-purple.png" : "assets/img/logo-amber.png"; });
}

function initToggles(){
  setTheme(getTheme());
  document.getElementById("themeBtn").addEventListener("click",()=>{ setTheme(getTheme()==="dark"?"light":"dark"); updateLogo(); });
  document.getElementById("langBtn").addEventListener("click",async ()=>{ lang=lang==="fa"?"en":"fa"; setLang(lang); applyChrome(); await renderLegend(); });
}

(async function(){
  initToggles();
  await loadManifest();
  const id=params().get("id");
  item = manifest.find(m=>m.slug===id) || null;
  applyChrome();
  await renderLegend();
})();
