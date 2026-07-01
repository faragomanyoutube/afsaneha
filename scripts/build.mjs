// Zero-dependency static generator for افسانه‌ها.
//   node scripts/build.mjs
// Produces: assets/data/legends.json, per-legend static SEO pages under story/,
// feed.xml (RSS 2.0), feed.json (JSON Feed), sitemap.xml.
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const LEG = path.join(ROOT, "legends");
const DATA = path.join(ROOT, "assets", "data", "legends.json");
const STORY = path.join(ROOT, "story");

let SITE = "";
try { const c = JSON.parse(await fs.readFile(path.join(ROOT,"config.json"),"utf8")); SITE=(c.siteUrl||"").replace(/\/$/,""); } catch {}

function parseFrontmatter(text){
  const m=/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text); const data={}; let body=text;
  if(m){ body=text.slice(m[0].length);
    for(const line of m[1].split(/\r?\n/)){ const mm=/^([A-Za-z0-9_]+):\s*(.*)$/.exec(line); if(!mm) continue;
      let raw=mm[2].trim(), v;
      if(/^\[.*\]$/.test(raw)){ v=raw.slice(1,-1).split(",").map(s=>s.trim().replace(/^[\"']|[\"']$/g,"")).filter(Boolean); }
      else { v=raw.replace(/^[\"']|[\"']$/g,""); if(v==="null"||v==="") v=null; }
      data[mm[1]]=v; } }
  return { data, body };
}
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function attr(s){ return esc(s).replace(/\"/g,"&quot;"); }
function inlineMd(s){ s=esc(s);
  s=s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img alt="$1" src="$2">');
  s=s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" rel="noopener">$1</a>');
  s=s.replace(/`([^`]+)`/g,"<code>$1</code>");
  s=s.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  s=s.replace(/(^|[^*])\*([^*]+)\*/g,"$1<em>$2</em>");
  s=s.replace(/~~([^~]+)~~/g,"<del>$1</del>"); return s; }
function renderMarkdown(md){ const lines=md.replace(/\r\n/g,"\n").split("\n"); let html="",i=0;
  while(i<lines.length){ let line=lines[i];
    if(/^```/.test(line)){ let code=""; i++; while(i<lines.length&&!/^```/.test(lines[i])){ code+=lines[i]+"\n"; i++; } i++; html+="<pre><code>"+esc(code)+"</code></pre>"; continue; }
    if(/^\s*$/.test(line)){ i++; continue; }
    let h=/^(#{1,4})\s+(.*)$/.exec(line); if(h){ const n=h[1].length; html+="<h"+n+">"+inlineMd(h[2])+"</h"+n+">"; i++; continue; }
    if(/^\s*(-{3,}|\*{3,})\s*$/.test(line)){ html+="<hr>"; i++; continue; }
    if(/^>\s?/.test(line)){ let q=""; while(i<lines.length&&/^>\s?/.test(lines[i])){ q+=inlineMd(lines[i].replace(/^>\s?/,""))+"<br>"; i++; } html+="<blockquote>"+q+"</blockquote>"; continue; }
    if(/^\s*([-*+])\s+/.test(line)){ let it=""; while(i<lines.length&&/^\s*([-*+])\s+/.test(lines[i])){ it+="<li>"+inlineMd(lines[i].replace(/^\s*([-*+])\s+/,""))+"</li>"; i++; } html+="<ul>"+it+"</ul>"; continue; }
    if(/^\s*\d+\.\s+/.test(line)){ let it=""; while(i<lines.length&&/^\s*\d+\.\s+/.test(lines[i])){ it+="<li>"+inlineMd(lines[i].replace(/^\s*\d+\.\s+/,""))+"</li>"; i++; } html+="<ol>"+it+"</ol>"; continue; }
    let para=""; while(i<lines.length&&!/^\s*$/.test(lines[i])&&!/^(#{1,4}\s|>|\s*([-*+])\s|\s*\d+\.\s|```)/.test(lines[i])){ para+=(para?" ":"")+lines[i]; i++; }
    html+="<p>"+inlineMd(para)+"</p>"; }
  return html;
}
function excerpt(body,n=150){ const c=body.replace(/[#>*`_\-]/g," ").replace(/\s+/g," ").trim(); return c.length>n?c.slice(0,n)+"…":c; }
function minutes(body){ const w=(body.trim().match(/\S+/g)||[]).length; return Math.max(1,Math.round(w/180)); }

async function walk(dir){ const out=[]; let es=[]; try{ es=await fs.readdir(dir,{withFileTypes:true}); }catch{ return out; }
  for(const e of es){ const p=path.join(dir,e.name); if(e.isDirectory()) out.push(...await walk(p)); else if(e.name==="fa.md") out.push(p); } return out; }
async function exists(p){ try{ await fs.access(p); return true; }catch{ return false; } }
async function findCover(dir){ for(const f of ["cover.jpg","cover.png","cover.webp"]){ if(await exists(path.join(dir,f))) return f; } return null; }

const faFiles=await walk(LEG);
const items=[];
for(const fa of faFiles){
  const dir=path.dirname(fa);
  const rel=path.relative(LEG,dir).split(path.sep).join("/");
  const faText=await fs.readFile(fa,"utf8");
  const { data, body }=parseFrontmatter(faText);
  let has_en=false,title_en=null,excerpt_en=null,enBody=null,enData=null;
  try{ const enText=await fs.readFile(path.join(dir,"en.md"),"utf8"); has_en=true; const en=parseFrontmatter(enText); enData=en.data; enBody=en.body; title_en=en.data.title||null; excerpt_en=excerpt(en.body); }catch{}
  const cover=await findCover(dir);
  const slug=data.slug||rel.split("/").pop();
  items.push({ slug, path:rel, dir, faData:data, faBody:body, enData, enBody,
    title_fa:data.title||null, title_en, province:data.province||null, city:data.city||null,
    dialect:data.dialect||null, creature:data.creature||null, author:data.author||null,
    tags:data.tags||[], coordinates:data.coordinates||null, audio:data.audio||null, cover,
    has_en, excerpt_fa:excerpt(body), excerpt_en, mins_fa:minutes(body), mins_en:enBody?minutes(enBody):null,
    created:data.created||null, url:"story/"+rel+"/" });
}
items.sort((a,b)=>(b.created||"").localeCompare(a.created||""));

// ---- manifest (strip heavy fields) ----
const manifest=items.map(i=>({ slug:i.slug, path:i.path, title_fa:i.title_fa, title_en:i.title_en,
  province:i.province, city:i.city, dialect:i.dialect, creature:i.creature, author:i.author, tags:i.tags,
  coordinates:i.coordinates, audio:i.audio, has_en:i.has_en, excerpt_fa:i.excerpt_fa, excerpt_en:i.excerpt_en,
  mins_fa:i.mins_fa, mins_en:i.mins_en, created:i.created, url:i.url }));
await fs.mkdir(path.dirname(DATA),{recursive:true});
await fs.writeFile(DATA, JSON.stringify(manifest,null,2), "utf8");

// ---- static story pages ----
function relatedFor(it){ return items.filter(m=>m.slug!==it.slug && (m.province===it.province || (it.creature && m.creature===it.creature))).slice(0,6); }
function storyHtml(it, prefix){
  const faTitle=it.title_fa||it.slug, enTitle=it.title_en||it.title_fa||it.slug;
  const desc=it.excerpt_fa||faTitle;
  const canonical=SITE?SITE+"/"+it.url:it.url;
  const ogImg=it.cover?(SITE+"/legends/"+it.path+"/"+it.cover):(SITE+"/assets/img/og-default.png");
  const metabar=[it.province&&['province',it.province],it.city&&['city',it.city],it.dialect&&['dialect',it.dialect],it.creature&&['creature',it.creature]].filter(Boolean)
    .map(x=>'<span class="tag" data-meta="'+x[0]+'">'+esc(x[1])+'</span>').join("");
  const audio=it.audio?('<div class="audio-block"><div class="cap">🎙️ <span data-i18n="listen">روایت صوتی</span>'+(it.dialect?' · '+esc(it.dialect):"")+'</div><audio controls preload="none" src="'+prefix+'legends/'+it.path+'/'+attr(it.audio)+'"></audio></div>'):"";
  const faBodyHtml=renderMarkdown(it.faBody), enBodyHtml=it.enBody?renderMarkdown(it.enBody):"";
  const rel=relatedFor(it);
  const relHtml=rel.length?('<section class="related"><h2 data-i18n="related">افسانه‌های مرتبط</h2><div class="grid">'+rel.map(r=>'<a class="card" href="'+prefix+r.url+'"><h3 data-fa="'+attr(r.title_fa||r.slug)+'" data-en="'+attr(r.title_en||r.title_fa||r.slug)+'">'+esc(r.title_fa||r.slug)+'</h3><div class="meta">'+(r.province?'<span class="tag">'+esc(r.province)+'</span>':"")+(r.creature?'<span class="tag">'+esc(r.creature)+'</span>':"")+'</div></a>').join("")+'</div></section>'):"";
  const LJSON=JSON.stringify({ slug:it.slug, hasEn:it.has_en, author:it.author||"", prefix, minsFa:it.mins_fa, minsEn:it.mins_en, province:it.province||"", creature:it.creature||"" });
  return '<!DOCTYPE html>\n<html lang="fa" dir="rtl" data-theme="dark">\n<head>\n'+
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'+
    '<title>'+esc(faTitle)+' — افسانه‌ها</title>\n'+
    '<meta name="description" content="'+attr(desc)+'">\n'+
    '<link rel="canonical" href="'+attr(canonical)+'">\n'+
    '<meta property="og:type" content="article">\n<meta property="og:title" content="'+attr(faTitle)+'">\n'+
    '<meta property="og:description" content="'+attr(desc)+'">\n<meta property="og:image" content="'+attr(ogImg)+'">\n'+
    '<meta property="og:url" content="'+attr(canonical)+'">\n'+
    '<meta name="twitter:card" content="summary_large_image">\n'+
    '<link rel="alternate" type="application/rss+xml" title="افسانه‌ها" href="'+prefix+'feed.xml">\n'+
    '<link rel="icon" href="'+prefix+'assets/img/favicon.png">\n'+
    '<link rel="manifest" href="'+prefix+'manifest.webmanifest">\n<meta name="theme-color" content="#2a0e1f">\n'+
    '<link rel="stylesheet" href="'+prefix+'assets/css/style.css">\n</head>\n<body>\n'+
    '<header class="site-header"><div class="container header-inner">'+
      '<a class="brand" href="'+prefix+'index.html"><img class="brand-logo" src="'+prefix+'assets/img/logo-amber.png" alt="افسانه‌ها"><span data-i18n="site">افسانه‌ها</span></a>'+
      '<div class="spacer"></div>'+
      '<a class="btn" href="'+prefix+'contributors.html" data-i18n="contributors">مشارکت‌کنندگان</a>'+
      '<a class="btn" href="'+prefix+'about.html" data-i18n="about">درباره</a>'+
      '<button class="btn" id="langBtn">EN</button><button class="btn" id="themeBtn" title="theme">◐</button>'+
    '</div></header>\n'+
    '<main class="container"><article class="article" id="article">'+
      '<a class="btn" href="'+prefix+'index.html">← <span data-i18n="back">بازگشت</span></a>'+
      '<h1 id="ttl" data-fa="'+attr(faTitle)+'" data-en="'+attr(enTitle)+'">'+esc(faTitle)+'</h1>'+
      '<div class="legend-toolbar"><span class="read-time" id="readTime">⏱</span>'+
        '<button class="btn" id="readBtn">📖 <span data-i18n="readingMode">حالت مطالعه</span></button>'+
        '<div class="share" id="share"><button class="btn" id="shareBtn">⤴ <span data-i18n="share">اشتراک‌گذاری</span></button>'+
          '<div class="share-menu"><button id="copyLink">🔗 <span data-i18n="copyLink">کپی لینک</span></button>'+
          '<a id="tg" target="_blank" rel="noopener" href="#">✈️ <span data-i18n="telegram">تلگرام</span></a>'+
          '<a id="wa" target="_blank" rel="noopener" href="#">🟢 <span data-i18n="whatsapp">واتساپ</span></a></div></div>'+
      '</div>'+
      '<div class="metabar">'+metabar+'</div>'+
      (it.has_en?"":'<div class="notice" id="noEnNotice" style="display:none" data-i18n="noEnglish"></div>')+
      audio+
      '<div class="body body-fa" dir="rtl">'+faBodyHtml+'</div>'+
      (it.has_en?'<div class="body body-en" dir="ltr" style="display:none">'+enBodyHtml+'</div>':"")+
      '<div class="author" style="margin-top:26px;color:var(--muted)"><span data-i18n="by">نویسنده:</span> <b>'+esc(it.author||"ناشناس")+'</b></div>'+
      relHtml+
      '<section class="comments" id="comments"><h2 data-i18n="comments">نظرات</h2><div id="giscus"></div></section>'+
    '</article></main>'+
    '<button class="btn reading-exit" id="readingExit"></button>'+
    '<footer class="site-footer"><div class="container footer-inner"><span data-i18n="footer"></span></div></footer>'+
    '<script>window.__LEGEND__='+LJSON+';</script>'+
    '<script type="module" src="'+prefix+'assets/js/story.js"></script>'+
    '<script src="'+prefix+'assets/js/tilt.js" defer></script>'+
  '</body>\n</html>\n';
}
await fs.rm(STORY,{recursive:true,force:true});
for(const it of items){
  const depth = it.path.split("/").length + 1; // story/ + rel segments
  const prefix = "../".repeat(depth);
  const dir=path.join(STORY, ...it.path.split("/"));
  await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,"index.html"), storyHtml(it, prefix), "utf8");
}

// ---- RSS + JSON feed + sitemap ----
function rfc822(d){ const dt=d?new Date(d):new Date(); return isNaN(dt)?new Date().toUTCString():dt.toUTCString(); }
const rssItems=items.map(i=>{ const link=SITE?SITE+"/"+i.url:i.url;
  return "  <item>\n    <title>"+esc(i.title_fa||i.slug)+"</title>\n    <link>"+esc(link)+"</link>\n    <guid isPermaLink=\"true\">"+esc(link)+"</guid>\n    <pubDate>"+rfc822(i.created)+"</pubDate>\n"+(i.province?"    <category>"+esc(i.province)+"</category>\n":"")+"    <description>"+esc(i.excerpt_fa||"")+"</description>\n  </item>"; }).join("\n");
const rss="<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<rss version=\"2.0\">\n<channel>\n  <title>افسانه‌ها</title>\n  <link>"+esc(SITE||"")+"</link>\n  <description>گنجینه‌ی مردمی افسانه‌ها و قصه‌های محلی ایران</description>\n  <language>fa-IR</language>\n  <lastBuildDate>"+rfc822()+"</lastBuildDate>\n"+rssItems+"\n</channel>\n</rss>\n";
await fs.writeFile(path.join(ROOT,"feed.xml"), rss, "utf8");

const jsonFeed={ version:"https://jsonfeed.org/version/1.1", title:"افسانه‌ها", home_page_url:SITE||"", feed_url:(SITE?SITE+"/feed.json":"feed.json"),
  language:"fa", items:items.map(i=>({ id:(SITE?SITE+"/"+i.url:i.url), url:(SITE?SITE+"/"+i.url:i.url), title:i.title_fa||i.slug, content_text:i.excerpt_fa||"", date_published:i.created||null, tags:i.tags, authors:[{name:i.author||"ناشناس"}] })) };
await fs.writeFile(path.join(ROOT,"feed.json"), JSON.stringify(jsonFeed,null,2), "utf8");

const staticUrls=["index.html","about.html","contribute.html","contributors.html"];
const sm="<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"+
  staticUrls.map(u=>"  <url><loc>"+esc((SITE?SITE+"/":"")+u)+"</loc></url>").join("\n")+"\n"+
  items.map(i=>"  <url><loc>"+esc(SITE?SITE+"/"+i.url:i.url)+"</loc></url>").join("\n")+"\n</urlset>\n";
await fs.writeFile(path.join(ROOT,"sitemap.xml"), sm, "utf8");

console.log("✓ "+items.length+" legends -> manifest, "+items.length+" story pages, feed.xml, feed.json, sitemap.xml");
