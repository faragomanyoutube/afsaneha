/**
 * افسانه‌ها — Cloudflare Worker (submission bot)
 * -------------------------------------------------
 * وظیفه: دریافت فرم از سایت → ساخت فایل markdown → باز کردن Pull Request روی مخزن عمومی.
 *
 * امنیت (مهم — مخزن عمومی است):
 *  - توکن فقط در Worker Secrets ذخیره می‌شود (wrangler secret put ...). هرگز در ریپو نرود.
 *  - ترجیحاً یک GitHub App بساز و installation token بگیر (امن‌تر از PAT). برای شروع می‌توان از fine-grained PAT محدود به همین یک مخزن استفاده کرد.
 *  - Turnstile (کپچا) را اعتبارسنجی می‌کند تا اسپم رباتی جلوگیری شود.
 *
 * Secrets لازم (با wrangler secret put تنظیم کن):
 *   GITHUB_TOKEN         – توکن دسترسی به مخزن (contents + pull_requests)
 *   TURNSTILE_SECRET     – کلید مخفی Turnstile (اختیاری)
 * Vars (در wrangler.toml):
 *   GH_OWNER, GH_REPO, GH_BASE (مثلاً main), ALLOWED_ORIGIN
 */

const API_BASE = "https://api.github.com";
const JSON_HEADERS = { "Content-Type": "application/json" };

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: "Bad JSON" }, 400, cors); }

    // 1) anti-spam: Turnstile
    if (env.TURNSTILE_SECRET) {
      const ok = await verifyTurnstile(env.TURNSTILE_SECRET, body.turnstileToken, request);
      if (!ok) return json({ error: "Captcha failed" }, 403, cors);
    }

    // 2) validate
    const title_fa = (body.title_fa || "").trim();
    const body_fa = (body.body_fa || "").trim();
    const province = (body.province || "").trim();
    const author = (body.author || "").trim() || "ناشناس";
    if (!title_fa || !body_fa || !province) return json({ error: "Missing required fields" }, 400, cors);
    if (body_fa.length > 20000) return json({ error: "Too long" }, 413, cors);

    const slug = slugify(title_fa) + "-" + Date.now().toString(36);
    const province_slug = slugify(province) || "other";
    const hasEn = !!(body.title_en && body.body_en);

    const files = [];
    files.push({
      path: `legends/${province_slug}/${slug}/fa.md`,
      content: frontmatter({
        title: title_fa, slug, province, city: body.city, village: null,
        dialect: body.dialect, creature: body.creature, author,
        has_en: hasEn, created: new Date().toISOString().slice(0,10),
      }, body_fa),
    });
    if (hasEn) {
      files.push({
        path: `legends/${province_slug}/${slug}/en.md`,
        content: frontmatter({ title: (body.title_en||"").trim(), slug, lang:"en" }, (body.body_en||"").trim()),
      });
    }

    // 3) create branch + commit files + open PR
    try {
      const url = await openPullRequest(env, {
        branch: `legend/${slug}`,
        title: `افسانه‌ی جدید: ${title_fa}`,
        authorName: author,
        authorEmail: body.email || null,
        files,
      });
      return json({ ok: true, pr: url }, 200, cors);
    } catch (e) {
      return json({ error: "GitHub error", detail: String(e) }, 502, cors);
    }
  },
};

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { ...JSON_HEADERS, ...extra } });
}

function slugify(s) {
  return (s || "").toString().toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "item";
}

function frontmatter(meta, bodyText) {
  const esc = (v) => (v === null || v === undefined || v === "") ? "null" : String(v).replace(/\n/g, " ");
  const lines = Object.entries(meta).map(([k, v]) => `${k}: ${esc(v)}`);
  return `---\n${lines.join("\n")}\n---\n\n${bodyText}\n`;
}

async function verifyTurnstile(secret, token, request) {
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const d = await r.json();
  return !!d.success;
}

// --- GitHub REST helpers ---
async function gh(env, path, method = "GET", payload) {
  const r = await fetch(API_BASE + path, {
    method,
    headers: {
      "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "afsaneha-bot",
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${await r.text()}`);
  return r.json();
}

async function openPullRequest(env, { branch, title, authorName, authorEmail, files }) {
  const owner = env.GH_OWNER, repo = env.GH_REPO, base = env.GH_BASE || "main";
  const ref = await gh(env, `/repos/${owner}/${repo}/git/ref/heads/${base}`);
  const baseSha = ref.object.sha;
  await gh(env, `/repos/${owner}/${repo}/git/refs`, "POST", { ref: `refs/heads/${branch}`, sha: baseSha });

  for (const f of files) {
    const message = `افزودن افسانه از ${authorName}` +
      (authorEmail ? `\n\nCo-authored-by: ${authorName} <${authorEmail}>` : "");
    await gh(env, `/repos/${owner}/${repo}/contents/${encodeURI(f.path)}`, "PUT", {
      message,
      content: b64(f.content),
      branch,
    });
  }

  const pr = await gh(env, `/repos/${owner}/${repo}/pulls`, "POST", {
    title, head: branch, base,
    body: `ارسال‌شده توسط فرم سایت. نویسنده: **${authorName}**.\n\nلطفاً پیش از مرج بازبینی شود.`,
  });
  return pr.html_url;
}

function b64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
