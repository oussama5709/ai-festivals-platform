# AI Festivals Platform — خريطة المعرفة الدائمة للمشروع

> تم بناء هذه الوثيقة بعد فهرسة كامل الشيفرة (Frontend + Backend + Scraper + بحث بايثون + إعدادات النشر).
> الهدف: مرجع دائم يُستخدم قبل أي تطوير جديد لتفادي تكرار عمل موجود.
> النشر الحالي: https://ai-festivals-platform.vercel.app

---

## 1. الخريطة المعمارية (Architecture Map)

المشروع فعلياً 4 أنظمة مستقلة تتصل عبر HTTP:

| النظام | المسار | التقنية | النشر |
|---|---|---|---|
| Frontend | `frontend/` | Next.js 14 (App Router) + Tailwind + NextAuth | Vercel |
| Backend API | `api/` | Express + TypeScript + Prisma | Railway (كان Render سابقاً — `render.yaml` قديم) |
| Scraper (Actor) | `actor/` | Node.js + Apify SDK v3 + Cheerio | Apify Cloud (Actor ID في `APIFY_ACTOR_ID`) |
| بحث/تجميع بايثون | `ai-events-research/` | Python asyncio + aiohttp | تجريبي/بحثي، غير منشور حالياً |

### تدفق البيانات الرئيسي (Data Flow)
```
[Apify Actor: actor/main.js]
   → يجمع من: مصادر ثابتة (HARDCODED) + conftech.ai + conferences.ai + wikicfp.com
   → يدفع النتائج إلى Apify Dataset
        │
        ├── مسار 1 (Webhook — الأساسي في الإنتاج):
        │     Apify Webhook → POST /api/webhook/apify (api/src/routes/webhook.ts)
        │     → mapToEvent() يحوّل الشكلين (actor format / new format)
        │     → upsertEvents() في eventService.ts يحفظ في DB + يكتشف "جديد" أو "تغيّر الموعد"
        │     → notifyNewEvent() / notifyDeadlineChange() (Telegram + WhatsApp + Push)
        │
        └── مسار 2 (Polling — بديل، عبر jobs/pipeline.ts + jobs/scheduler.ts):
              triggerActorRun() → pollUntilDone() → processDataset() → نفس upsertEvents()
              يُشغَّل تلقائياً يومياً 06:00 UTC وأسبوعياً (Sunday 03:00 UTC، نتائج أعمق)

[Frontend] → GET /api/events (مع فلاتر) → عرض في /events, /tunisia, /dashboard
[ai-events-research] → يسحب من API العام (GET /api/events) — نظام استهلاك خارجي منفصل، ليس مصدر بيانات
```

### قاعدة البيانات (Prisma — `api/prisma/schema.prisma`)
- `Event` — الجدول الرئيسي: عام (title/date/location/region/category/qualityScore) + حقول مسابقات (isCompetition/prize/submissionDeadline/competitionStatus) + CFP (hasCfp/cfpDeadline) + خاص بتونس (isTunisia/festivalType/governorate) + مسابقات أفلام (isFilmCompetition/filmGenres/filmFreewayUrl).
- `ScrapeRun` — سجل كل عملية سحب (حالة، عدد الأحداث، مدة).
- `PushSubscription` — اشتراكات إشعارات المتصفح (endpoint + مفاتيح + topics).
- `SecurityLog` — سجل التهديدات الأمنية (من middleware/security.ts).
- ملاحظة تقنية: `DATABASE_URL` محلياً بصيغة SQLite (`file:./prisma/dev.db`) بينما `schema.prisma` الأساسي PostgreSQL — يُبدَّل تلقائياً عبر `scripts/switch-schema.js` حسب صيغة الرابط. يجب تشغيل `npm run db:push` قبل أول تشغيل محلي.

### المصادقة (Authentication) — 3 آليات منفصلة، غير موحدة
1. **NextAuth** (`frontend/app/api/auth/[...nextauth]/route.ts`) — تسجيل دخول Google/Facebook للمستخدمين، مع حظر نطاقات بريد مؤقتة (mailinator إلخ). غير مربوط فعلياً بأي صفحة محمية حالياً (يبدو مُجهَّزاً لميزة مستقبلية).
2. **API Key** (`middleware/auth.ts: requireApiKey`) — يحمي `POST /api/scrape/trigger` عبر هيدر `x-api-key` مقارنةً بـ `API_KEY` في البيئة.
3. **Admin Password** (`middleware/auth.ts: requireAdminPassword`) — يحمي `GET /api/admin/test-notify` عبر `x-admin-password` أو query param، مقارنةً بـ `ADMIN_PASSWORD`. **ملاحظة أمنية:** صفحة `/dashboard` في الفرونت‌إند تتحقق من كلمة السر **على المتصفح فقط** (`password === 'admin'` مكتوبة صراحة في الكود) — هذه ليست حماية حقيقية، أي شخص يقرأ الكود المصدري يتجاوزها. الحماية الفعلية الوحيدة هي على مستوى الـ API (`triggerScrape` يتطلب `API_KEY` حقيقي من الخادم).

### نظام الإشعارات (تم إصلاحه مسبقاً — راجع الجلسة السابقة)
- `api/src/services/notificationService.ts` — Telegram (سليم) + WhatsApp عبر Twilio (يحتاج بيانات حقيقية).
- `api/src/services/pushService.ts` — Web Push عبر VAPID (يحتاج مفاتيح — تم توليدها).
- **تكرار معماري مكتشف حديثاً:** يوجد مسار إشعارات ثالث منفصل تماماً في `api/src/jobs/monitor.ts` (دالة `checkNewAICompetitions`) يعمل كل 30 دقيقة عبر `scheduler.ts`، ويكتشف "مسابقات جديدة" بشكل مستقل (`createdAt >= آخر ساعة`) ويرسل Telegram/WhatsApp **مباشرة بدون المرور بـ pushService أو منطق newEvents في eventService**. هذا يعني احتمال إشعارين منفصلين لنفس الحدث الجديد (مرة فورية عبر webhook/pipeline، ومرة أخرى خلال الساعة التالية عبر monitor). يُنصح بدمج المسارين مستقبلاً.
- `api/src/routes/admin.ts` يوفر `GET /api/admin/test-notify?password=...` — أسرع طريقة لاختبار الإشعارات فعلياً على الخادم المنشور (بدلاً من تشغيل سكربت محلي).

### الأتمتة والجدولة (`api/src/jobs/`)
- `scheduler.ts` — **الجدولة الفعلية المستخدمة** (مُستدعاة من index.ts عند `NODE_ENV=production`): سحب يومي 06:00 UTC، سحب أسبوعي عميق الأحد 03:00 UTC، فحوصات صحة كل 30 دقيقة.
- `keepAlive.ts` — يحتوي دالتين: `startKeepAlive()` (مستخدمة فعلياً — تبقي الخادم مستيقظاً على Render/Railway المجاني عبر ping كل 14 دقيقة) و`startDailyScrape()` **غير مستخدمة إطلاقاً** (كود ميت، منطق جدولة قديم كرّرته `scheduler.ts` لاحقاً بشكل أفضل).
- `retry.ts` — Circuit Breaker + exponential backoff، يُستخدم بشكل صحيح عبر `dbCircuit` في webhook/pipeline/monitor.

### الأمان (`api/src/middleware/security.ts` + `rateLimit.ts`)
- طبقتا Rate Limiting منفصلتان تعملان معاً (`globalRateLimit` 200/15min + `speedLimiter` + `rateLimiter` 100/min) — تكرار وظيفي بسيط لكن غير ضار (دفاع متعدد الطبقات).
- كشف سكانرات أمنية (sqlmap, nikto...)، كشف حقن SQL/XSS، Honeypot routes، تتبع مخالفات IP، تسجيل في `SecurityLog`، وتنبيهات Telegram فورية — منظومة جيدة وتعمل فعلاً (تستخدم قناة Telegram السليمة).

### نمط تقني متكرر يستحق التوحيد
كل ملف تقريباً (`eventService.ts`, `webhook.ts`, `notifications.ts`, `pushService.ts`, `monitor.ts`, `autoSeed.ts`, `security.ts`, `rateLimit.ts`, `index.ts`) ينشئ نسخته الخاصة من `new PrismaClient()` بدل استخدام singleton مشترك. يعمل لكنه يفتح عدة connection pools بلا داعٍ — تحسين مستقبلي مقترح: ملف `db.ts` واحد يُصدّر instance مشتركة.

---

## 2. الواجهة الأمامية (Frontend) — خريطة الصفحات

| الصفحة | الوظيفة |
|---|---|
| `/` (page.tsx) | Landing page — إحصائيات ثابتة (hardcoded)، روابط للمناطق |
| `/events` | القائمة الرئيسية: بحث + فلاتر (منطقة/فئة/تاريخ/جودة/مجاني/مسابقات مفتوحة/CFP) + ترتيب + Pagination، تزامن الحالة مع URL |
| `/events/[id]` | تفاصيل حدث واحد |
| `/tunisia` | صفحة مخصصة بالدارجة التونسية: مسابقات مفتوحة، CFP، مجموع الجوائز، زر اشتراك push |
| `/dashboard` | لوحة تحكم (رسوم بيانية Recharts) + زر تشغيل سحب يدوي — محمية بكلمة سر **جانب العميل فقط** (ضعف أمني موصوف أعلاه) |
| `/api-docs` | توثيق الـ API |
| `/auth/signin`, `/auth/error` | صفحات NextAuth (Google/Facebook) — غير مربوطة بميزة فعلية بعد |

### مكونات مشتركة مهمة
`lib/api.ts` (كل نداءات API + توليد ملفات ICS للتقويم)، `lib/i18n.tsx` (عربي/فرنسي/إنجليزي/دارجة تونسية، مخزّن في localStorage)، `PushSubscribeButton.tsx` + `ServiceWorkerRegistrar.tsx` (اشتراك push، يعتمدان على إصلاح VAPID الذي تم سابقاً)، `FilterSidebar.tsx` (كل منطق الفلترة).

---

## 3. السكرابر (Actor) — `actor/main.js` (v3.0، الحالي والمنشور فعلياً)

- **28 مؤتمر "مضمون" مكتوب يدوياً (HARDCODED)** — دائماً يُضاف بغض النظر عن نجاح السحب (لأن السحب الحي غالباً يُحظر).
- 3 مصادر سحب حي: `conftech.ai`, `conferences.ai`, `wikicfp.com` (عبر axios + cheerio، مع معالجة أخطاء منفصلة لكل مصدر).
- Dedup بالـ URL، فلترة حسب `minDate`، قص حسب `maxResults`.
- **مجلد `actor/utils/` (proxy.js, rate-limiter.js, retry.js) غير مستخدم إطلاقاً من `main.js`** — كود جاهز وقيّم (تدوير بروكسي، Rate limiting، إعادة محاولة) لكنه معزول تماماً؛ يستحق الدمج إذا احتجنا لاحقاً تقوية السحب ضد الحظر.

---

## 4. بحث بايثون (`ai-events-research/`) — تجريبي، دور مختلف عمّا يبدو

هذا ليس سكرابر مصادر خارجية، بل **مستهلك** لـ API المنصة نفسها (`src/crawler/sources/ai_festivals_platform_source.py`) — يجلب من `/api/events` صفحة بصفحة (حتى 10 صفحات × 100 = 1000 حدث لكل نسخة إقليمية) لتغذية بحث/تحليل منفصل (توجد مجلدات `notebooks/`, `exports/`, `database/`, `kubernetes/`, `monitoring/` تشير لطموح توسّع لم يكتمل).

**عطلان مكتشفان:**
1. `API_BASE_URL` في هذا الملف يشير إلى **`ai-festivals-platform.onrender.com`** (رابط Render القديم) وليس رابط Railway الحالي — سيفشل أي استدعاء فعلي.
2. `src/crawler/main.py` السطر 35 يحتوي خطأ syntax صريح: `` len^(self.sources^) `` (يبدو أثر لصق من سكربت Windows batch) بدل `len(self.sources)` — هذا الملف **لن يعمل إطلاقاً بحالته الحالية**.

---

## 5. النشر والبنية التحتية

| الملف | الدور | الحالة |
|---|---|---|
| `railway.toml` (api/) | نشر الـ API الحالي على Railway | **نشط** |
| `render.yaml` (الجذر) | إعداد نشر Render قديم (نفس الخدمة، إعداد مختلف) | **قديم/مُستبدَل** — لا يُستخدم لكنه لم يُحذف |
| `.vercel/project.json` (الجذر وfrontend/) | ربط Vercel للفرونت‌إند | نشط |
| `docker-compose.yml` | تشغيل محلي كامل (Postgres + Redis + api + frontend) | متاح للتطوير المحلي |
| `apify.json` (actor/) | إعداد Actor على Apify Cloud | نشط |

---

## 6. التكرارات المكتشفة (Duplicates) — التوصية

| المكرر | النسخ | التوصية |
|---|---|---|
| سكرابر Node.js | `ai-festivals-scraper-main/ai-festivals-scraper.js` **مطابق حرفياً** لـ `old project/ai-festivals-scraper.js` (367 سطر لكل منهما)، مقابل `actor/main.js` (279 سطر، v3.0، أحدث وأبسط ومنشور فعلياً) | اعتماد `actor/main.js` كالنسخة الوحيدة الرسمية؛ أرشفة البقية |
| جدولة السحب اليومي | `jobs/scheduler.ts: scheduleDailyScrape()` (مُستخدمة) مقابل `jobs/keepAlive.ts: startDailyScrape()` (غير مستدعاة أبداً) | حذف/أرشفة الدالة الميتة في keepAlive.ts |
| إشعار "مسابقة جديدة" | مسار `webhook.ts/pipeline.ts` (فوري، عبر newEvents) مقابل `jobs/monitor.ts: checkNewAICompetitions` (كل 30 دقيقة، مستقل) | توحيد المسارين لتفادي إشعارات مكررة |
| مجلدات مشروع كاملة | `old project/`, `Nouveau dossier/`, `ai-festivals-scraper-main/` تحتوي نسخاً سابقة موثّقة جيداً (تحتوي `PROJECT_ARCHITECTURE.md`, `DATABASE_SCHEMA.sql`, `CRAWLER_COMPLETE_CODE.md`) | أرشيف مرجعي فقط — لا تُعدَّل، القيمة في الفكرة/التوثيق التاريخي وليس التنفيذ |

---

## 7. كود ميت / تجريبي (لا يُحذف — يُصنَّف فقط)

- `api/src/jobs/keepAlive.ts::startDailyScrape` — ميت، غير مستدعى.
- `actor/utils/*.js` (proxy, rate-limiter, retry) — كود جاهز غير مدمج، جيد لإعادة الاستخدام لاحقاً عند تقوية السكرابر.
- `ai-events-research/` بأكمله — تجريبي/غير مكتمل، به عطلان (رابط Render قديم + خطأ syntax في main.py).
- `render.yaml` — تهيئة نشر قديمة (Render)، محتفظ بها كأرشيف بعد الانتقال لـ Railway.
- ملفات اختبار داخلية من الجلسة السابقة: `api/src/services/_write_probe.ts`, `api/src/services/_writetest.txt` — غير مرتبطة بأي منطق، يمكن حذفها يدوياً (لم أستطع حذفها تلقائياً بسبب قيود المجلد).

---

## 8. كيف تُستخدم هذه الوثيقة مستقبلاً

قبل أي طلب ميزة جديدة، يجب مراجعة هذه الوثيقة أولاً لتفادي:
- إعادة كتابة سكرابر جديد بينما `actor/main.js` + `actor/utils/*` يوفران أساساً جاهزاً.
- إعادة بناء نظام إشعارات بينما `notificationService.ts` + `pushService.ts` يعملان (بعد الإصلاح السابق) — فقط يحتاجان دمج مسار `monitor.ts`.
- تكرار منطق الفلترة/الفئات/الأقاليم — موجود في 3 نسخ متطابقة تقريباً: `webhook.ts (inferRegion/normalizeCategory)`, `pipeline.ts`, `actor/main.js` — أي تعديل مستقبلي على منطق التصنيف يجب أن يُطبَّق في الثلاثة معاً أو يُوحَّد في مكتبة مشتركة.
