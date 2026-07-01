// Minimal, dependency-free Markdown renderer + YAML-ish frontmatter parser.
// Enough for legend pages: headings, bold/italic, lists, quotes, links, images,
// code, hr, paragraphs. Escapes HTML first for safety.

export function parseFrontmatter(text){
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if(!m) return { data:{}, body:text };
  const data={};
  for(const line of m[1].split(/\r?\n/)){
    const mm = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if(!mm) continue;
    let v = mm[2].trim();
    if(/^\[.*\]$/.test(v)){
      v = v.slice(1,-1).split(",").map(s=>s.trim().replace(/^[\"']|[\"']$/g,"")).filter(Boolean);
    } else {
      v = v.replace(/^[\"']|[\"']$/g,"");
      if(v==="null"||v==="") v=null;
    }
    data[mm[1]] = v;
  }
  return { data, body: text.slice(m[0].length) };
}

function esc(s){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function inline(s){
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img alt="$1" src="$2">');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" rel="noopener">$1</a>');
  s = s.replace(/`([^`]+)`/g,"<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g,"$1<em>$2</em>");
  s = s.replace(/~~([^~]+)~~/g,"<del>$1</del>");
  return s;
}

export function renderMarkdown(md){
  const lines = md.replace(/\r\n/g,"\n").split("\n");
  let html="", i=0;
  const closeList = (()=>{});
  while(i<lines.length){
    let line = lines[i];
    if(/^```/.test(line)){
      let code=""; i++;
      while(i<lines.length && !/^```/.test(lines[i])){ code+=lines[i]+"\n"; i++; }
      i++; html+="<pre><code>"+esc(code)+"</code></pre>"; continue;
    }
    if(/^\s*$/.test(line)){ i++; continue; }
    let h=/^(#{1,4})\s+(.*)$/.exec(line);
    if(h){ const n=h[1].length; html+=`<h${n}>${inline(h[2])}</h${n}>`; i++; continue; }
    if(/^\s*(-{3,}|\*{3,})\s*$/.test(line)){ html+="<hr>"; i++; continue; }
    if(/^>\s?/.test(line)){
      let q="";
      while(i<lines.length && /^>\s?/.test(lines[i])){ q+=inline(lines[i].replace(/^>\s?/,""))+"<br>"; i++; }
      html+="<blockquote>"+q+"</blockquote>"; continue;
    }
    if(/^\s*([-*+])\s+/.test(line)){
      let items="";
      while(i<lines.length && /^\s*([-*+])\s+/.test(lines[i])){ items+="<li>"+inline(lines[i].replace(/^\s*([-*+])\s+/,""))+"</li>"; i++; }
      html+="<ul>"+items+"</ul>"; continue;
    }
    if(/^\s*\d+\.\s+/.test(line)){
      let items="";
      while(i<lines.length && /^\s*\d+\.\s+/.test(lines[i])){ items+="<li>"+inline(lines[i].replace(/^\s*\d+\.\s+/,""))+"</li>"; i++; }
      html+="<ol>"+items+"</ol>"; continue;
    }
    let para="";
    while(i<lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,4}\s|>|\s*([-*+])\s|\s*\d+\.\s|```)/.test(lines[i])){
      para+=(para?" ":"")+lines[i]; i++;
    }
    html+="<p>"+inline(para)+"</p>";
  }
  return html;
}
