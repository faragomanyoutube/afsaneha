# ربات ارسال (Cloudflare Worker)

این Worker فرم «ثبت افسانه» را می‌گیرد و روی مخزن عمومی یک Pull Request باز می‌کند.
به این ترتیب کاربران بدون حساب گیت‌هاب هم می‌توانند مشارکت کنند، و تو پیش از مرج بازبینی می‌کنی.

> این پوشه جدای از سایت است و روی GitHub Pages منتشر نمی‌شود. می‌توانی آن را در همین ریپو نگه داری.

## راه‌اندازی

1. یک توکن دسترسی بساز (ترجیحاً **GitHub App**؛ یا برای شروع یک fine-grained PAT محدود به همین مخزن با دسترسی Contents + Pull requests).
2. `wrangler.toml.example` را به `wrangler.toml` تغییر نام بده و مقادیر را پر کن.
3. دستورات:
   ```bash
   npm i -g wrangler
   cd worker
   wrangler secret put GITHUB_TOKEN      # توکن را اینجا وارد کن (در ریپو ذخیره نمی‌شود)
   wrangler secret put TURNSTILE_SECRET  # اختیاری
   wrangler deploy
   ```
4. آدرس نهایی Worker (مثلاً `https://afsaneha-bot.USERNAME.workers.dev`) را بردار و در ریشه‌ی پروژه در فایل `config.json` در کلید `submitApiUrl` بگذار (با `/submit` یا بدون آن — همین Worker هر مسیری را POST قبول می‌کند).

## Turnstile (کپچا)
در داشبورد Cloudflare یک ویجت Turnstile بساز، کلید عمومی را در `config.json → turnstileSiteKey` بگذار
و کلید مخفی را با `wrangler secret put TURNSTILE_SECRET`.
