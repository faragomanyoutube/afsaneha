// افسانه‌ها — bilingual UI strings + language/theme helpers (no dependencies)
export const STR = {
  fa: {
    dir:"rtl", htmlLang:"fa",
    site:"افسانه‌ها",
    tagline:"گنجینه‌ی مردمی افسانه‌ها و قصه‌های محلی ایران",
    heroText:"افسانه‌های شهر و روستای خودت را ثبت کن و برای همیشه ماندگارشان کن. هر افسانه با نامِ نویسنده‌اش نگه‌داری می‌شود.",
    browse:"مرور افسانه‌ها", contribute:"ثبت افسانه‌ی جدید",
    search:"جستجو در افسانه‌ها...",
    allProvinces:"همه‌ی استان‌ها", allCreatures:"همه‌ی موجودات",
    legends:"افسانه", by:"نویسنده:", unknown:"ناشناس",
    readMore:"خواندن", empty:"افسانه‌ای مطابق جستجو پیدا نشد.",
    back:"بازگشت", province:"استان", city:"شهر/روستا", dialect:"لهجه", creature:"موجود",
    noEnglish:"نسخه‌ی انگلیسی این افسانه هنوز ثبت نشده است.",
    notFound:"افسانه پیدا نشد.",
    footer:"محتوا با مجوز CC BY 4.0 — یک پروژه‌ی متن‌باز و مردمی",
    about:"درباره", contributeTitle:"ثبت یک افسانه‌ی محلی",
    fFa:"عنوان افسانه (فارسی)", fBody:"متن افسانه (فارسی)",
    fProvince:"استان", fCity:"شهر یا روستا", fDialect:"لهجه (اختیاری)",
    fCreature:"نوع موجود/دسته (اختیاری)", fAuthor:"نام شما (نمایش داده می‌شود)",
    fEmail:"ایمیل (اختیاری، برای ثبت در تاریخچه)", fEnTitle:"عنوان انگلیسی (اختیاری)", fEnBody:"متن انگلیسی (اختیاری)",
    submit:"ارسال برای بازبینی", sending:"در حال ارسال...",
    okMsg:"سپاس! افسانه‌ی شما ثبت شد و پس از بازبینی منتشر می‌شود.",
    errMsg:"ارسال ناموفق بود. لطفاً بعداً دوباره تلاش کنید.",
    notConfigured:"سرویس ارسال هنوز پیکربندی نشده است (آدرس Worker را در config.json بگذارید).",
    langBtn:"EN"
  },
  en: {
    dir:"ltr", htmlLang:"en",
    site:"Afsaneha",
    tagline:"A community archive of Iran's local legends and folklore",
    heroText:"Record the legends of your own town and village and preserve them forever. Every legend keeps its author's name.",
    browse:"Browse legends", contribute:"Add a legend",
    search:"Search legends...",
    allProvinces:"All provinces", allCreatures:"All creatures",
    legends:"legends", by:"By:", unknown:"Unknown",
    readMore:"Read", empty:"No legends match your search.",
    back:"Back", province:"Province", city:"City/Village", dialect:"Dialect", creature:"Creature",
    noEnglish:"An English version of this legend hasn't been added yet.",
    notFound:"Legend not found.",
    footer:"Content licensed under CC BY 4.0 — an open, community project",
    about:"About", contributeTitle:"Submit a local legend",
    fFa:"Legend title (Persian)", fBody:"Legend text (Persian)",
    fProvince:"Province", fCity:"City or village", fDialect:"Dialect (optional)",
    fCreature:"Creature type/category (optional)", fAuthor:"Your name (shown publicly)",
    fEmail:"Email (optional, recorded in history)", fEnTitle:"English title (optional)", fEnBody:"English text (optional)",
    submit:"Submit for review", sending:"Sending...",
    okMsg:"Thank you! Your legend was submitted and will be published after review.",
    errMsg:"Submission failed. Please try again later.",
    notConfigured:"Submission service is not configured yet (set the Worker URL in config.json).",
    langBtn:"فا"
  }
};

export function getLang(){
  return localStorage.getItem("afsaneha_lang") || "fa";
}
export function setLang(l){ localStorage.setItem("afsaneha_lang", l); }
export function getTheme(){
  return localStorage.getItem("afsaneha_theme") || "dark";
}
export function setTheme(t){
  localStorage.setItem("afsaneha_theme", t);
  document.documentElement.setAttribute("data-theme", t);
}
export function applyDocLang(lang){
  const s = STR[lang];
  document.documentElement.lang = s.htmlLang;
  document.documentElement.dir = s.dir;
}
