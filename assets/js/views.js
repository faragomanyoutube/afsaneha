// View counter. Global counts via the Cloudflare Worker if configured
// (GET <api>/views?slug=..., POST to increment). Falls back to per-device
// localStorage counts so "popular" sorting still works fully offline.
let CFG=null;
async function cfg(){ if(CFG) return CFG; try{ CFG=await (await fetch("config.json",{cache:"no-store"})).json(); }catch(e){ CFG={}; } return CFG; }
function localAll(){ try{ return JSON.parse(localStorage.getItem("afsaneha_views")||"{}"); }catch(e){ return {}; } }
function localGet(slug){ return localAll()[slug]||0; }
function localBump(slug){ const a=localAll(); a[slug]=(a[slug]||0)+1; localStorage.setItem("afsaneha_views", JSON.stringify(a)); return a[slug]; }

export async function getCounts(){
  // returns { slug: count } best-effort. Prefer a static counts.json snapshot,
  // else the Worker, else local.
  try{ const r=await fetch("assets/data/counts.json",{cache:"no-store"}); if(r.ok) return await r.json(); }catch(e){}
  const c=await cfg();
  if(c.viewsApiUrl){ try{ const r=await fetch(c.viewsApiUrl,{cache:"no-store"}); if(r.ok) return await r.json(); }catch(e){} }
  return localAll();
}
export async function recordView(slug){
  if(!slug) return;
  const c=await cfg();
  const base=c.viewsApiUrl||"";
  if(base){
    try{ const u=base+(base.includes("?")?"&":"?")+"slug="+encodeURIComponent(slug);
      const r=await fetch(u,{method:"POST"}); if(r.ok){ const j=await r.json().catch(()=>null); if(j&&typeof j.count==="number"){ renderCount(j.count); return; } } }catch(e){}
  }
  renderCount(localBump(slug));
}
function renderCount(n){ const el=document.getElementById("viewCount"); if(el) el.textContent=String(n); }
export { localGet };
