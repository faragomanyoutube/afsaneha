// Single legend page (SPA fallback): fa.md / en.md + reading time, reading mode,
// share, audio, related legends, comments (giscus), view counter, SEO meta.
import { STR, getLang, setLang, getTheme, setTheme, applyDocLang } from "./i18n.js";
import { parseFrontmatter, renderMarkdown } from "./md.js";
import { recordView, getCounts } from "./views.js";
import { applySeason } from "./season.js";

let lang=getLang(), item=null, manifest=[], CFG={};
function t(){ return STR[lang]; }
function params(){ return new URLSearchParams(location.search); }
async function fetchText(u){ const r=await fetch(u,{cache:"no-store"}); if(!r.ok) throw new Error("404"); return r.text(); }
async function loadManifest(){ try{ manifest=await (await fetch("assets/data/legends.json",{cache:"no-store"})).json(); }catch(e){ manifest=[]; } }
async function loadCfg(){ try{ CFG=await (await fetch("config.json",{cache:"no-store"})).json(); }catch(e){ CFG={}; } }
function toFaDigits(n){ return String(n).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d]); }
function readingMinutes(text){ const words=(text.trim().match(/\S+/g)||[]).length; return Math.max(1, Math.round(words/180)); }

function setMeta(title, desc){
  document.title=title+" — "+t().site;
  const set=(sel,attr,val)=>{ let m=document.head.querySelector(sel); if(!m){ m=document.createElement("meta"); document.head.appendChild(m); const a=sel.match(/\[(name|property)="(.+?)"\]/); if(a) m.setAttribute(a[1],a[2]); } m.setAttribute(attr,val); };
  set('meta[name="description"]',"content",desc);
  set('meta[property="og:title"]',"content",title);
  set('meta[property="og:description"]',"content",desc);
  set('meta[property="og:type"]',"content","article");
  set('meta[name="twitter:card"]',"content","summary_large_image");
  const img=(CFG.siteUrl||"")+"/assets/img/og-default.png";
  set('meta[property="og:image"]',"content",img);
}
function relatedOf(){
  return manifest.filter(m=>m.slug!==item.slug && (m.province===item.province || (item.creature && m.creature===item.creature))).slice(0,6);
}
async function renderLegend(){
  const s=t(); const box=document.getElementById("article");
  if(!item){ box.innerHTML='<p class="empty">'+s.notFound+'</p>'; return; }
  let useLang=(lang==="en" && item.has_en)?"en":"fa";
  let showNotice=(lang==="en" && !item.has_en);
  let md=""; try{ md=await fetchText("legends/"+item.path+"/"+useLang+".md"); }catch(e){ box.innerHTML='<p class="empty">'+s.notFound+'</p>'; return; }
  const { data, body }=parseFrontmatter(md);
  const title=(useLang==="en"?(data.title||item.title_en):(data.title||item.title_fa))||item.slug;
  const mins=readingMinutes(body);
  const minsTxt=(lang==="fa"?toFaDigits(mins):mins)+" "+s.readingTime;
  const meta=[ item.province&&'<span class="tag">'+s.province+': '+item.province+'</span>',
    item.city&&'<span class="tag">'+s.city+': '+item.city+'</span>',
    item.dialect&&'<span class="tag">'+s.dialect+': '+item.dialect+'</span>',
    item.creature&&'<span class="tag">'+s.creature+': '+item.creature+'</span>' ].filter(Boolean).join("");
  const audio=data.audio?('<div class="audio-block"><div class="cap">🎙️ '+s.listen+(item.dialect?' · '+item.dialect:"")+'</div><audio controls preload="none" src="legends/'+item.path+'/'+data.audio+'"></audio></div>'):"";
  const shareUrl=location.href;
  const share='<div class="share" id="share"><button class="btn" id="shareBtn">⤴ '+s.share+'</button><div class="share-menu">'+
    '<button id="copyLink">🔗 '+s.copyLink+'</button>'+
    '<a target="_blank" rel="noopener" href="https://t.me/share/url?url='+encodeURIComponent(shareUrl)+'&text='+encodeURIComponent(title)+'">✈️ '+s.telegram+'</a>'+
    '<a target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(title+" "+shareUrl)+'">🟢 '+s.whatsapp+'</a>'+
    '</div></div>';
  const rel=relatedOf();
  const relHtml=rel.length?('<section class="related"><h2>'+s.related+'</h2><div class="grid">'+rel.map(r=>{
    const rt=(lang==="en"&&r.title_en)?r.title_en:(r.title_fa||r.slug);
    return '<a class="card" href="'+(r.url||("legend.html?id="+encodeURIComponent(r.slug)))+'"><h3>'+rt+'</h3><div class="meta">'+(r.province?'<span class="tag">'+r.province+'</span>':"")+(r.creature?'<span class="tag">'+r.creature+'</span>':"")+'</div></a>';
  }).join("")+'</div></section>'):"";
  box.innerHTML=
    '<a class="btn" href="index.html">← '+s.back+'</a>'+
    '<h1>'+title+'</h1>'+
    '<div class="legend-toolbar"><span class="read-time">⏱ '+minsTxt+'</span>'+
      '<button class="btn" id="readBtn">📖 '+s.readingMode+'</button>'+share+'</div>'+
    '<div class="metabar">'+meta+'</div>'+
    (showNotice?'<div class="notice">'+s.noEnglish+'</div>':"")+audio+
    '<div class="body" dir="'+(useLang==="en"?"ltr":"rtl")+'">'+renderMarkdown(body)+'</div>'+
    '<div class="author" style="margin-top:26px;color:var(--muted)">'+s.by+' <b>'+(item.author||s.unknown)+'</b></div>'+
    relHtml+
    '<section class="comments" id="comments"><h2>'+s.comments+'</h2><div id="giscus"></div></section>';
  setMeta(title, (item.excerpt_fa||"").slice(0,150)||title);
  wireLegendUI();
  mountGiscus();
}
function wireLegendUI(){
  const s=t();
  const sb=document.getElementById("shareBtn"); const sw=document.getElementById("share");
  if(sb) sb.addEventListener("click",e=>{ e.stopPropagation();
    if(navigator.share){ navigator.share({title:document.title, url:location.href}).catch(()=>{}); return; }
    sw.classList.toggle("open"); });
  document.addEventListener("click",()=>{ if(sw) sw.classList.remove("open"); });
  const cp=document.getElementById("copyLink");
  if(cp) cp.addEventListener("click",async()=>{ try{ await navigator.clipboard.writeText(location.href); cp.textContent="✅ "+s.copied; setTimeout(()=>cp.textContent="🔗 "+s.copyLink,1500);}catch(e){} });
  const rb=document.getElementById("readBtn");
  if(rb) rb.addEventListener("click",()=>{ document.body.classList.add("reading"); });
  const ex=document.getElementById("readingExit");
  if(ex) ex.addEventListener("click",()=>document.body.classList.remove("reading"));
}
function mountGiscus(){
  const g=CFG.giscus||{}; if(!g.enabled||!g.repo||!g.repoId) return;
  const host=document.getElementById("giscus"); if(!host) return;
  const sc=document.createElement("script");
  sc.src="https://giscus.app/client.js"; sc.async=true; sc.crossOrigin="anonymous";
  sc.setAttribute("data-repo",g.repo); sc.setAttribute("data-repo-id",g.repoId);
  sc.setAttribute("data-category",g.category||"Announcements"); sc.setAttribute("data-category-id",g.categoryId||"");
  sc.setAttribute("data-mapping","pathname"); sc.setAttribute("data-reactions-enabled","1");
  sc.setAttribute("data-theme", getTheme()==="light"?"light":"dark");
  sc.setAttribute("data-lang", lang==="en"?"en":"fa");
  host.innerHTML=""; host.appendChild(sc);
}
function applyChrome(){ const s=t(); applyDocLang(lang);
  document.querySelectorAll("[data-i18n]").forEach(el=>{ const k=el.getAttribute("data-i18n"); if(s[k]!==undefined) el.textContent=s[k]; });
  const lb=document.getElementById("langBtn"); if(lb) lb.textContent=s.langBtn; const ex=document.getElementById("readingExit"); if(ex) ex.textContent="✕ "+s.exitReading; updateLogo(); }
function updateLogo(){ const th=getTheme(); document.querySelectorAll("img.brand-logo").forEach(img=>{ img.src=th==="light"?"assets/img/logo-purple.png":"assets/img/logo-amber.png"; }); }
function initToggles(){ setTheme(getTheme());
  document.getElementById("themeBtn").addEventListener("click",()=>{ setTheme(getTheme()==="dark"?"light":"dark"); updateLogo(); mountGiscus(); });
  document.getElementById("langBtn").addEventListener("click",async()=>{ lang=lang==="fa"?"en":"fa"; setLang(lang); applyChrome(); await renderLegend(); }); }

(async function(){ initToggles(); applySeason(); await Promise.all([loadManifest(), loadCfg()]);
  const id=params().get("id"); item=manifest.find(m=>m.slug===id)||null; applyChrome(); await renderLegend();
  if(item){ try{ const c=await getCounts(); }catch(e){} recordView(item.slug); } })();
