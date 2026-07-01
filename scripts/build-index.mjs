// فهرستِ افسانه‌ها را از روی پوشه‌ی legends/ می‌سازد و در assets/data/legends.json می‌نویسد.
// بدون هیچ وابستگی خارجی اجرا می‌شود: node scripts/build-index.mjs
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const LEG = path.join(ROOT, "legends");
const OUT = path.join(ROOT, "assets", "data", "legends.json");

function parseFrontmatter(text){
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  const data = {};
  let body = text;
  if (m){
    body = text.slice(m[0].length);
    for (const line of m[1].split(/\r?\n/)){
      const mm = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
      if (!mm) continue;
      let raw = mm[2].trim();
      let v;
      if (/^\[.*\]$/.test(raw)) {
        v = raw.slice(1, -1).split(",").map(s => s.trim().replace(/^[\"']|[\"']$/g, "")).filter(Boolean);
      } else {
        v = raw.replace(/^[\"']|[\"']$/g, "");
        if (v === "null" || v === "") v = null;
      }
      data[mm[1]] = v;
    }
  }
  return { data, body };
}

function excerpt(body, n = 140){
  const clean = body.replace(/[#>*`_\-]/g, " ").replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n) + "…" : clean;
}

async function walk(dir){
  const out = [];
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries){
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.name === "fa.md") out.push(p);
  }
  return out;
}

const faFiles = await walk(LEG);
const items = [];
for (const fa of faFiles){
  const rel = path.relative(LEG, path.dirname(fa)).split(path.sep).join("/");
  const faText = await fs.readFile(fa, "utf8");
  const { data, body } = parseFrontmatter(faText);
  let has_en = false, title_en = null, excerpt_en = null;
  try {
    const enText = await fs.readFile(path.join(path.dirname(fa), "en.md"), "utf8");
    has_en = true;
    const en = parseFrontmatter(enText);
    title_en = en.data.title || null;
    excerpt_en = excerpt(en.body);
  } catch {}
  items.push({
    slug: data.slug || rel.split("/").pop(),
    path: rel,
    title_fa: data.title || null,
    title_en,
    province: data.province || null,
    city: data.city || null,
    dialect: data.dialect || null,
    creature: data.creature || null,
    author: data.author || null,
    tags: data.tags || [],
    has_en,
    excerpt_fa: excerpt(body),
    excerpt_en,
    created: data.created || null,
  });
}
items.sort((a, b) => (b.created || "").localeCompare(a.created || ""));
await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, JSON.stringify(items, null, 2), "utf8");
console.log(`✓ ${items.length} legends → assets/data/legends.json`);
