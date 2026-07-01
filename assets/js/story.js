// Runtime for pre-rendered static story pages (window.__LEGEND__).
import { applyI18n } from "./i18n.js";
import { recordView } from "./views.js";
import { getSeasonPref, applySeason } from "./season.js";
const L = window.__LEGEND__ || { prefix:"", slug:"", hasEn:false, minsFa:1, minsEn:null };
const P = L.prefix || "";
applyI18n();
// theme
const root=document.documentElement;
function setTheme(k){ root.setAttribute("data-theme",k); const logo=document.querySelector(".brand-logo"); if(logo) logo.src=P+"assets/img/"+(k==="light"?"logo-purple.png":"logo-amber.png"); }
setTheme(localStorage.getItem("afsaneha_theme")||"dark");
document.getElementById("themeBtn")?.addEventListener("click",()=>{ const n=root.getAttribute("data-theme")==="dark"?"light":"dark"; setTheme(n); localStorage.setItem("afsaneha_theme",n); });
// season
try{ applySeason(getSeasonPref(), P); }catch{}
// language
let lang = localStorage.getItem("afsaneha_lang")||"fa";
function applyLang(){
  const fa=document.querySelector(".body-fa"), en=document.querySelector(".body-en");
  const ttl=document.getElementById("ttl");
  const isEn = lang==="en" && L.hasEn;
  if(ttl){ const v=ttl.getAttribute(isEn?"data-en":"data-fa"); if(v) ttl.textContent=v; }
  if(fa) fa.style.display = isEn?"none":"";
  if(en) en.style.display = isEn?"":"none";
  const notice=document.getElementById("noEnNotice");
  if(notice) notice.style.display = (lang==="en" && !L.hasEn) ? "" : "none";
  document.documentElement.lang = isEn?"en":"fa";
  document.documentElement.dir = isEn?"ltr":"rtl";
  // reading time
  const rt=document.getElementById("readTime"); const mins=isEn?(L.minsEn||L.minsFa):L.minsFa;
  if(rt) rt.textContent = "⏱ " + (isEn ? (mins+" min read") : (toFa(mins)+" دقیقه مطالعه"));
  document.getElementById("langBtn") && (document.getElementById("langBtn").textContent = isEn?"فا":"EN");
}
function toFa(n){ return String(n).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[+d]); }
applyLang();
document.getElementById("langBtn")?.addEventListener("click",()=>{ lang = lang==="fa"?"en":"fa"; localStorage.setItem("afsaneha_lang",lang); applyLang(); });
// reading mode
const exit=document.getElementById("readingExit");
if(exit) exit.textContent="✕";
function setReading(on){ document.body.classList.toggle("reading",on); }
document.getElementById("readBtn")?.addEventListener("click",()=>setReading(!document.body.classList.contains("reading")));
exit?.addEventListener("click",()=>setReading(false));
document.addEventListener("keydown",e=>{ if(e.key==="Escape") setReading(false); });
// share
const share=document.getElementById("share");
const url=location.href, ttlTxt=document.getElementById("ttl")?.textContent||document.title;
document.getElementById("shareBtn")?.addEventListener("click",e=>{ e.stopPropagation(); share?.classList.toggle("open"); });
document.addEventListener("click",()=>share?.classList.remove("open"));
const tg=document.getElementById("tg"); if(tg) tg.href="https://t.me/share/url?url="+encodeURIComponent(url)+"&text="+encodeURIComponent(ttlTxt);
const wa=document.getElementById("wa"); if(wa) wa.href="https://wa.me/?text="+encodeURIComponent(ttlTxt+" "+url);
document.getElementById("copyLink")?.addEventListener("click",async()=>{ try{ await navigator.clipboard.writeText(url); const b=document.getElementById("copyLink"); const o=b.innerHTML; b.textContent="✅ کپی شد"; setTimeout(()=>b.innerHTML=o,1500); }catch{} });
// views
try{ if(L.slug) recordView(L.slug); }catch{}
// giscus comments
(async()=>{ try{ const cfg=await (await fetch(P+"config.json")).json(); const g=cfg.giscus||{};
  if(g.enabled && g.repo && g.repoId){ const s=document.createElement("script");
    s.src="https://giscus.app/client.js"; s.async=true; s.crossOrigin="anonymous";
    s.setAttribute("data-repo",g.repo); s.setAttribute("data-repo-id",g.repoId);
    s.setAttribute("data-category",g.category||"Announcements"); s.setAttribute("data-category-id",g.categoryId||"");
    s.setAttribute("data-mapping","pathname"); s.setAttribute("data-reactions-enabled","1");
    s.setAttribute("data-theme", root.getAttribute("data-theme")==="light"?"light":"dark_dimmed");
    s.setAttribute("data-lang", lang==="en"?"en":"fa");
    document.getElementById("giscus")?.appendChild(s);
  } else { const c=document.getElementById("comments"); if(c) c.style.display="none"; }
}catch{ const c=document.getElementById("comments"); if(c) c.style.display="none"; } })();
// register service worker
if("serviceWorker" in navigator){ window.addEventListener("load",()=>navigator.serviceWorker.register(P+"sw.js").catch(()=>{})); }
