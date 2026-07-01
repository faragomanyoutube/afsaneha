import { applyI18n } from "./i18n.js";
applyI18n();
const root=document.documentElement;
function setTheme(k){ root.setAttribute("data-theme",k); const logo=document.querySelector(".brand-logo"); if(logo) logo.src="assets/img/"+(k==="light"?"logo-purple.png":"logo-amber.png"); }
setTheme(localStorage.getItem("afsaneha_theme")||"dark");
document.getElementById("themeBtn")?.addEventListener("click",()=>{ const n=root.getAttribute("data-theme")==="dark"?"light":"dark"; setTheme(n); localStorage.setItem("afsaneha_theme",n); });
document.getElementById("langBtn")?.addEventListener("click",()=>{ const n=(localStorage.getItem("afsaneha_lang")||"fa")==="fa"?"en":"fa"; localStorage.setItem("afsaneha_lang",n); location.reload(); });
const list=document.getElementById("contribList");
try{
  const data=await (await fetch("assets/data/legends.json")).json();
  const map=new Map();
  for(const it of data){ const a=(it.author||"").trim()||"ناشناس"; map.set(a,(map.get(a)||0)+1); }
  const rows=[...map.entries()].sort((x,y)=>y[1]-x[1]);
  const lang=localStorage.getItem("afsaneha_lang")||"fa";
  const toFa=n=>String(n).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[+d]);
  if(!rows.length){ list.innerHTML='<p class="empty">هنوز مشارکت‌کننده‌ای ثبت نشده.</p>'; }
  else { list.innerHTML=rows.map(([name,count])=>{
    const initial=(name[0]||"?");
    const c = lang==="en" ? (count+" legend"+(count>1?"s":"")) : (toFa(count)+" افسانه");
    return '<div class="contrib-card"><div class="contrib-ava">'+esc(initial)+'</div><div><div class="n">'+esc(name)+'</div><div class="c">'+c+'</div></div></div>';
  }).join(""); }
}catch(e){ if(list) list.innerHTML='<p class="empty">خطا در بارگذاری.</p>'; }
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
