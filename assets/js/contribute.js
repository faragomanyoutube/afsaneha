// Contribute form: posts to the Cloudflare Worker URL defined in config.json.
// The Worker opens a Pull Request on the public repo. NO secret/token lives here.
import { STR, getLang, setLang, getTheme, setTheme, applyDocLang } from "./i18n.js";

let lang = getLang();
function t(){ return STR[lang]; }

let CONFIG = { submitApiUrl:"", turnstileSiteKey:"" };

async function loadConfig(){
  try{ CONFIG = await (await fetch("config.json",{cache:"no-store"})).json(); }catch(e){}
}

function applyChrome(){
  const s=t(); applyDocLang(lang);
  document.querySelectorAll("[data-i18n]").forEach(el=>{ const k=el.getAttribute("data-i18n"); if(s[k]!==undefined) el.textContent=s[k]; });
  document.getElementById("langBtn").textContent=s.langBtn;
  const theme=getTheme();
  document.querySelectorAll("img.brand-logo").forEach(img=>{ img.src = theme==="light"?"assets/img/logo-purple.png":"assets/img/logo-amber.png"; });
}

function initToggles(){
  setTheme(getTheme());
  document.getElementById("themeBtn").addEventListener("click",()=>{ setTheme(getTheme()==="dark"?"light":"dark"); applyChrome(); });
  document.getElementById("langBtn").addEventListener("click",()=>{ lang=lang==="fa"?"en":"fa"; setLang(lang); applyChrome(); });
}

function showMsg(text, ok){
  const box=document.getElementById("formMsg");
  box.style.display="block"; box.textContent=text;
  box.style.borderColor = ok ? "var(--accent)" : "var(--accent2)";
}

async function onSubmit(e){
  e.preventDefault();
  const s=t();
  if(!CONFIG.submitApiUrl){ showMsg(s.notConfigured, false); return; }
  const btn=document.getElementById("submitBtn");
  const fd=new FormData(e.target);
  const payload=Object.fromEntries(fd.entries());
  // include Turnstile token if the widget is present
  const tk=document.querySelector('[name="cf-turnstile-response"]');
  if(tk) payload.turnstileToken=tk.value;
  btn.disabled=true; btn.textContent=s.sending;
  try{
    const r=await fetch(CONFIG.submitApiUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!r.ok) throw new Error(await r.text());
    showMsg(s.okMsg, true); e.target.reset();
  }catch(err){ showMsg(s.errMsg, false); }
  finally{ btn.disabled=false; btn.textContent=s.submit; }
}

(async function(){
  initToggles();
  await loadConfig();
  applyChrome();
  document.getElementById("legendForm").addEventListener("submit", onSubmit);
})();
