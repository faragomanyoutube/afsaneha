// Seasonal accents. Auto-detects Shab-e Yalda (longest night, ~Dec 20–21) and
// Nowruz (spring). Adds data-season on <html> which CSS themes lightly.
// Manual override stored in localStorage ("afsaneha_season": auto|none|yalda|nowruz).
export function detectSeason(d){
  d=d||new Date(); const m=d.getMonth()+1, day=d.getDate();
  if(m===12 && day>=19 && day<=23) return "yalda";
  if((m===3 && day>=18) || (m===4 && day<=3)) return "nowruz";
  if(m===12 || m<=1) return "winter";
  return "none";
}
export function applySeason(){
  const pref=localStorage.getItem("afsaneha_season")||"auto";
  const s = pref==="auto" ? detectSeason() : pref;
  document.documentElement.setAttribute("data-season", s);
  if(s==="yalda" || s==="winter") mountSnow(); else removeSnow();
  return s;
}
export function setSeasonPref(p){ localStorage.setItem("afsaneha_season", p); applySeason(); }
function removeSnow(){ const c=document.getElementById("snow"); if(c) c.remove(); }
function mountSnow(){
  if(document.getElementById("snow")) return;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const wrap=document.createElement("div"); wrap.id="snow"; wrap.setAttribute("aria-hidden","true");
  const glyphs=["❄","·","✦"];
  for(let i=0;i<26;i++){ const s=document.createElement("span");
    s.textContent=glyphs[i%glyphs.length];
    s.style.left=(Math.random()*100)+"%";
    s.style.animationDuration=(6+Math.random()*8)+"s";
    s.style.animationDelay=(-Math.random()*10)+"s";
    s.style.fontSize=(8+Math.random()*14)+"px";
    s.style.opacity=String(0.3+Math.random()*0.5);
    wrap.appendChild(s); }
  document.body.appendChild(wrap);
}
