import { applyI18n, setupChrome } from "./i18n.js";
applyI18n(); if(typeof setupChrome==="function") setupChrome();
let CFG={}; try{ CFG=await (await fetch("config.json")).json(); }catch{}
const form=document.getElementById("contribForm");
const out=document.getElementById("contribResult");
function slugify(s){ return String(s).trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60); }
function fm(d){ const q=v=>String(v).replace(/\"/g,'\\\"');
  const lines=["---",`title: \"${q(d.title)}\"`,`slug: ${slugify(d.title)}`,`province: \"${q(d.province)}\"`];
  if(d.city) lines.push(`city: \"${q(d.city)}\"`);
  if(d.dialect) lines.push(`dialect: \"${q(d.dialect)}\"`);
  if(d.creature) lines.push(`creature: \"${q(d.creature)}\"`);
  lines.push(`author: \"${q(d.author)}\"`);
  if(d.coordinates) lines.push(`coordinates: \"${q(d.coordinates)}\"`);
  lines.push(`created: ${new Date().toISOString().slice(0,10)}`,"---","",d.body||"");
  return lines.join("\n"); }
form&&form.addEventListener("submit", async e=>{ e.preventDefault();
  const d=Object.fromEntries(new FormData(form).entries());
  const md=fm(d);
  out.style.display="block";
  if(CFG.submitApiUrl){
    try{ const r=await fetch(CFG.submitApiUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({province:d.province,slug:slugify(d.title),markdown:md})});
      out.textContent = r.ok ? "✅ افسانه برای تأیید ارسال شد. پس از بررسی منتشر می‌شود." : "⚠️ ارسال ناموفق بود. متن زیر را دستی ثبت کن.";
    }catch{ out.textContent="⚠️ ارتباط برقرار نشد. متن زیر را کپی کن و در پنل ادمین بگذار."; }
  } else { out.textContent="متن آماده‌است — کپی کن و در پنل ادمین (Decap) بگذار:"; }
  const pre=document.createElement("pre"); pre.textContent=md; pre.style.whiteSpace="pre-wrap"; pre.style.marginTop="10px"; out.appendChild(pre);
});
