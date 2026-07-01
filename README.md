# Afsaneha (افسانه‌ها) 🏔️

An open, community archive of Iran's local legends and folklore. Anyone — even without a GitHub account — can submit the legend of their own town or village. The author's name is always preserved.

> فارسی: ./README.fa.md

## Quick start (a few minutes)

The site is fully **static** — no build step required.

1. Extract the zip contents into the root of a GitHub repo (e.g. a repo named `afsaneha`).
2. In **Settings → Pages**, set the source to branch `main`, folder `/ (root)`.
3. Done — the site goes live at `https://USERNAME.github.io/afsaneha/`.

`.nojekyll` and a pre-built `assets/data/legends.json` are already included, so it works with zero extra steps.

> Want the index rebuilt automatically? A workflow (`.github/workflows/deploy.yml`) is included: on every push it regenerates `legends.json` from the `legends/` folder and deploys to Pages.

## Project layout

```
index.html          Home (FA/EN toggle + dark/light + search & filters)
legend.html         Single legend view
contribute.html     Submission form
config.json         The ONLY place you set the Cloudflare Worker URL
assets/js/          Site logic (no deps): i18n, md, app, legend, contribute
assets/img/         All design layers + named variants (logo/map/bg...)
legends/            ⬅️ Text only! One clean markdown file per legend
worker/             Cloudflare submission bot (separate, not deployed to Pages)
scripts/build-index.mjs
```

The `legends/` folder is intentionally **JavaScript-free** — just clean text with a little frontmatter, so anyone can rely on the repo alone as a complete, readable archive.

## Language & theme
- The whole UI is bilingual (toggle top-right). Individual legends are bilingual only if the author provided an `en.md`; otherwise the site shows a short notice and the Persian text.
- The ◐ button switches night (dark map) / day (parchment map) themes; the choice is remembered.

## Contributing without a GitHub account
The form posts to a Cloudflare Worker that opens a Pull Request; you review before merging. See `worker/README.md`. Set the Worker URL only in `config.json`.

### ⚠️ Public repo notes
- Never commit any token. Tokens live only in Worker Secrets.
- Prefer a GitHub App or a fine-grained PAT scoped to this one repo.
- Enable Cloudflare Turnstile on the form to block bot spam.

## License
Content: CC BY 4.0 (with attribution). Code: MIT.
