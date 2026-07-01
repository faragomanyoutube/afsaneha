# پنل مدیریت (Decap CMS)

آدرس: `https://faragomanyoutube.github.io/afsaneha/admin/`

## OAuth (مهم)
Decap با بک‌اند `github` روی GitHub Pages نیاز به یک OAuth provider دارد. یک ورکر کلودفلر OAuth یا GitHub OAuth App بساز، سپس در `admin/config.yml` خطوط `base_url` و `auth_endpoint` را از کامنت دربیاور و مقدار بده.

## روند
لاگین گیت‌هاب → ویرایش/ساخت افسانه → commit روی `legends/<استان>/<شناسه>/fa.md` → اکشن `node scripts/build.mjs` خودکار اجرا می‌شود.
