# 🚀 AI Festivals Scraper - دليل البدء السريع

## ✅ ماذا تم إنشاؤه لك؟

لقد قمت ببناء **نظام كامل** لجمع مهرجانات وأحداث الذكاء الاصطناعي من حول العالم! 

### 📦 الملفات المُنتجة:

```
ai-festivals-scraper/
├── ai-festivals-scraper.js      ⭐ الكود الرئيسي للـ Actor
├── package.json                 📦 المتعلقات والإعدادات
├── INPUT_SCHEMA.json            📋 واجهة الإدخال
├── Dockerfile                   🐳 صيغة Docker
├── apify.json                   ⚙️ إعدادات Apify
├── test.js                      🧪 اختبارات سريعة
├── n8n-workflow.json            🔄 قالب n8n
├── README.md                    📖 الوثائق الكاملة
├── INSTALLATION_GUIDE.md        📚 دليل التثبيت
└── START_HERE.md               👈 أنت هنا!
```

---

## 🎯 3 خطوات للبدء الفوري

### الخطوة 1️⃣: إعداد الحساب (5 دقائق)

```bash
# 1. إنشاء حساب Apify (مجاني)
# اذهب إلى: https://apify.com/signup

# 2. الحصول على API Token
# من الإعدادات → API Tokens → انسخ Default Token

# 3. تثبيت Apify CLI
npm install -g apify-cli

# 4. تسجيل الدخول
apify login
# ألصق الـ Token
```

---

### الخطوة 2️⃣: رفع الـ Actor (10 دقائق)

```bash
# 1. الانتقال إلى مجلد المشروع
cd ai-festivals-scraper

# 2. رفع الـ Actor
apify push

# سيظهر رابط مثل:
# https://console.apify.com/actors/YOUR_USER_ID/ai-festivals-scraper
# 👈 احفظ هذا الرابط!
```

---

### الخطوة 3️⃣: الربط مع n8n (15 دقيقة)

```bash
# 1. اذهب إلى n8n
# https://app.n8n.cloud/login

# 2. أضف Apify Credentials
# Credentials → New → Apify
# أدخل API Token

# 3. أنشئ Workflow جديد
# اتبع التعليمات في INSTALLATION_GUIDE.md
```

---

## 📊 ماذا يفعل الـ Actor؟

```
🌍 يجمع من 6 مناطق عالمية
  ├─ 🌎 عالمي (Worldwide)
  ├─ 🏜️ الشرق الأوسط (Middle East)
  ├─ 🌍 أفريقيا (Africa)
  ├─ 🇪🇺 أوروبا (Europe)
  ├─ 🏯 آسيا (Asia)
  └─ 🗽 الأمريكيتان (Americas)

📱 من 5 مصادر مختلفة
  ├─ 🎪 Eventbrite
  ├─ 👥 Meetup
  ├─ 💼 LinkedIn
  ├─ 🌐 المواقع الرسمية
  └─ 📊 مجمعات المؤتمرات

🏆 يجمع 7 أنواع أحداث
  ├─ 🎓 مؤتمرات (Conferences)
  ├─ 🛠️ ورش عمل (Workshops)
  ├─ 👫 لقاءات (Meetups)
  ├─ 📹 ندوات (Webinars)
  ├─ 🏔️ قمم (Summits)
  ├─ 💻 هاكاثون (Hackathons)
  └─ 📚 دورات (Courses)
```

---

## 💡 أمثلة الاستخدام

### مثال 1: تقرير يومي عن أحداث الشرق الأوسط

```json
{
  "searchRegions": ["middle-east"],
  "upcomingOnly": true,
  "maxResults": 50
}
```

**النتيجة:** 50 حدث AI من الشرق الأوسط فقط ✅

---

### مثال 2: جميع الورش والدورات العالمية

```json
{
  "searchRegions": ["worldwide"],
  "includeEventTypes": ["workshop", "course"],
  "maxResults": 200
}
```

**النتيجة:** 200 ورشة ودورة من حول العالم ✅

---

### مثال 3: مراقبة أفريقيا وآسيا للعام القادم

```json
{
  "searchRegions": ["africa", "asia"],
  "minDate": "2025-06-01",
  "upcomingOnly": true
}
```

**النتيجة:** جميع أحداث الـ AI في أفريقيا وآسيا من يونيو 2025 فصاعداً ✅

---

## 📖 ملفات هامة

| الملف | الغرض |
|------|-------|
| **ai-festivals-scraper.js** | الكود الرئيسي - يحتوي على كل المنطق |
| **INPUT_SCHEMA.json** | واجهة الإدخال - تحديد الخيارات |
| **INSTALLATION_GUIDE.md** | دليل شامل خطوة بخطوة |
| **README.md** | الوثائق التقنية الكاملة |
| **test.js** | اختبارات سريعة قبل الرفع |
| **n8n-workflow.json** | قالب جاهز لـ n8n |

---

## 🆘 مشاكل وحلول سريعة

### ❌ "لا يوجد نتائج"

✅ **الحل:**
```json
{
  "searchRegions": ["worldwide"],  // استخدم worldwide
  "maxResults": 200,               // زيادة الحد الأقصى
  "minDate": "2024-01-01"          // أرجع التاريخ للخلف
}
```

---

### ❌ "Connection Timeout"

✅ **الحل:**
```json
{
  "searchRegions": ["middle-east"], // قلل المناطق
  "maxResults": 50,                 // قلل النتائج
  "dataSources": ["eventbrite"]     // استخدم مصدر واحد أولاً
}
```

---

### ❌ "API Key Invalid"

✅ **الحل:**
```bash
# 1. تحقق من الـ Token في Apify
# https://console.apify.com/settings/integrations

# 2. انسخه من جديد
# 3. حدّثه في n8n Credentials
```

---

## 🎓 خطوات التعلم (اختياري)

إذا أردت تخصيص الـ Actor:

1. **اقرأ الكود:** `ai-festivals-scraper.js`
2. **عدّل المصادر:** أضف URLs جديدة في `MAJOR_CONFERENCES`
3. **أضف مصادرك الخاصة:** ابدأ من دالة `scrapeEventbrite()`
4. **اختبر محلياً:** `node test.js`
5. **رفع مرة أخرى:** `apify push`

---

## 🚀 الخطوات التالية

### ✅ الآن:
- [ ] اقرأ هذا الملف
- [ ] اتبع الخطوات الثلاث أعلاه

### ⏭️ بعد الرفع:
- [ ] شغّل الـ Actor مرة واحدة
- [ ] انظر إلى النتائج في Apify
- [ ] ربطه مع n8n
- [ ] أنشئ automation

### 🎯 الأهداف المستقبلية:
- [ ] حفظ النتائج في Google Sheets
- [ ] إرسال تنبيهات Slack يومية
- [ ] إنشاء لوحة معلومات
- [ ] نشر النتائج على موقع ويب

---

## 📞 الدعم

### مشاكل تقنية؟

```
1. تحقق من README.md ← توثيق كامل
2. اقرأ INSTALLATION_GUIDE.md ← خطوات مفصلة
3. جرّب test.js ← اختبار البيئة
```

### روابط مفيدة:

- 📖 [Apify Docs](https://docs.apify.com/)
- 📖 [n8n Docs](https://docs.n8n.io/)
- 💬 [Apify Community](https://www.apify.com/community)
- 💬 [n8n Community](https://community.n8n.io/)

---

## ⚡ نصائح مهمة

💡 **الحفظ الآمن للـ API Keys**
```bash
# استخدم Environment Variables بدلاً من Hard Code
export APIFY_API_TOKEN="your-token-here"
```

💡 **اختبر محلياً أولاً**
```bash
# قبل الرفع على Apify
apify run --local
```

💡 **راقب الاستهلاك**
```
Dashboard → Statistics → Credits
```

💡 **حدّث بانتظام**
```bash
npm update
apify push
```

---

## 🎉 تهانينا!

لديك الآن:
- ✅ Actor كامل على Apify
- ✅ واجهة إدخال احترافية
- ✅ دعم اللغة العربية
- ✅ قالب n8n جاهز
- ✅ وثائق شاملة

**الآن حان وقت البدء! 🚀**

---

**آخر تحديث:** 2025-03-03  
**الإصدار:** 1.0.0  
**الحالة:** ✅ جاهز للاستخدام

Made with ❤️ for the Arab AI Community
