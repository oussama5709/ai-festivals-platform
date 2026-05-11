# 📚 دليل التثبيت والنشر الكامل

## الخطوة 1️⃣: إعداد Apify Account

### 1.1 إنشاء حساب Apify
- اذهب إلى https://apify.com
- انقر على **Sign Up**
- أكمل التسجيل بالبريد الإلكتروني أو Google

### 1.2 الحصول على API Token
1. اذهب إلى https://console.apify.com
2. انقر على اسمك (أعلى اليمين)
3. اختر **Integrations** → **API Tokens**
4. انسخ الـ **Default token** (احفظه في مكان آمن!)

---

## الخطوة 2️⃣: تثبيت Apify CLI

```bash
# تثبيت npm (إن لم يكن مثبتاً)
# من https://nodejs.org/

# تثبيت Apify CLI
npm install -g apify-cli

# التحقق من التثبيت
apify --version

# تسجيل الدخول
apify login
# ألصق الـ API Token عند الطلب
```

---

## الخطوة 3️⃣: إعداد مشروع الـ Actor

### 3.1 نسخ ملفات المشروع

```bash
# إنشاء مجلد جديد
mkdir ai-festivals-scraper
cd ai-festivals-scraper

# نسخ الملفات
# انسخ هذه الملفات إلى المجلد:
# - ai-festivals-scraper.js → main.js
# - package.json
# - INPUT_SCHEMA.json
# - Dockerfile
# - apify.json
# - README.md
```

### 3.2 إنشاء Actor على Apify

```bash
# خيار 1: إنشاء actor جديد تماماً
apify create ai-festivals-scraper

# خيار 2: استخدام مجلد موجود
apify create --skip-git ai-festivals-scraper
```

### 3.3 اختبار محلياً قبل الرفع

```bash
# تثبيت المتعلقات
npm install

# تشغيل الـ Actor محلياً
apify run

# سيظهر مجلد "storage" يحتوي على النتائج
```

---

## الخطوة 4️⃣: رفع الـ Actor على Apify

```bash
# رفع الـ Actor
apify push

# سيطهر رابط الـ Actor الخاص بك
# مثال: https://console.apify.com/actors/YOUR_USER_ID/ai-festivals-scraper

# نسخ Actor ID (ستحتاجه لاحقاً)
```

---

## الخطوة 5️⃣: ربط n8n مع Apify

### 5.1 إضافة Apify Credentials إلى n8n

1. اذهب إلى n8n: https://app.n8n.cloud/
2. انقر على **Credentials** (شريط جانبي أيسر)
3. اختر **New** → **Apify**
4. أدخل:
   - **API Key**: (الـ API Token من Apify)
   - **Name**: `Apify AI Scraper`
5. انقر **Create**

### 5.2 إضافة Credentials أخرى (اختياري)

إذا أردت حفظ النتائج في مكان ما:

**Google Sheets:**
- Credentials → New → Google Sheets OAuth2
- تتبع الخطوات

**MongoDB:**
- Credentials → New → MongoDB
- أدخل Connection String

**Slack:**
- Credentials → New → Slack
- أدخل Bot Token

---

## الخطوة 6️⃣: إنشاء n8n Workflow

### 6.1 إنشاء Workflow جديد

1. اذهب إلى **Workflows** → **New**
2. أسمِّها: `AI Festivals Automation`

### 6.2 إضافة الـ Nodes

**Node 1: Manual Trigger**
- اختر **Trigger** → **Manual Trigger**

**Node 2: Run Apify Actor**
- اختر **Action** → **Run Actor**
- اختر الـ Credentials: `Apify AI Scraper`
- أدخل **Actor ID**: 
  ```
  YOUR_USERNAME/ai-festivals-scraper
  ```
- أضف الإدخالات:
  ```json
  {
    "searchRegions": ["middle-east", "africa"],
    "maxResults": 100,
    "upcomingOnly": true
  }
  ```

**Node 3: Process Data** (JavaScript/Function Node)
```javascript
const data = $input.all()[0].json;
const events = data.events || [];

return {
  totalEvents: events.length,
  events: events.filter(e => 
    new Date(e.dateInfo) > new Date()
  )
};
```

**Node 4: Save Results** (اختر واحداً):

Option A: **Google Sheets**
- اختر Credentials
- أدخل Sheet ID
- اختر الحقول المراد حفظها

Option B: **Slack Notification**
- أدخل Channel: `#ai-events`
- اكتب الرسالة

Option C: **Send Email**
- أدخل البريد المستقبل
- اكتب محتوى الرسالة

### 6.3 ربط الـ Nodes

```
Manual Trigger → Run Apify Actor → Process Data → Save Results
```

---

## الخطوة 7️⃣: جدولة التشغيل التلقائي

### 7.1 إضافة مُشغل زمني

استبدل **Manual Trigger** بـ:
1. اختر **Trigger** → **Schedule**
2. اختر التكرار:
   - **Every day** (يومياً)
   - **Every week** (أسبوعياً)
   - **Every month** (شهرياً)
3. اختر التوقيت (مثلاً: 9:00 AM)

---

## الخطوة 8️⃣: الاختبار والتشغيل

### 8.1 اختبار Workflow

```
اضغط "Test" في أعلى الـ Workflow
```

### 8.2 معالجة الأخطاء

إذا حدث خطأ:

❌ **Error: "Actor not found"**
```
✅ تحقق من Actor ID بدقة
✅ استخدم: YOUR_USERNAME/ai-festivals-scraper
```

❌ **Error: "Invalid API key"**
```
✅ تأكد من نسخ API Token صحيحاً
✅ تحقق من أنه لم ينتهِ صلاحيته
```

❌ **Error: "Timeout"**
```
✅ قلل maxResults
✅ قلل عدد المناطق
✅ استخدم Apify Proxy
```

### 8.3 تشغيل Workflow نهائي

```
اضغط "Save" ثم "Activate"
```

---

## الخطوة 9️⃣: مراقبة والتحديثات

### 9.1 مراقبة Apify

```
https://console.apify.com/actors/YOUR_ACTOR_ID/runs
```

### 9.2 مراقبة n8n

```
https://app.n8n.cloud/workflows/YOUR_WORKFLOW_ID
```

### 9.3 عرض النتائج

```
https://console.apify.com/actors/YOUR_ACTOR_ID/datasets/YOUR_DATASET_ID
```

---

## 🎯 أمثلة استخدام عملية

### مثال 1: تقرير يومي للمنطقة العربية

```n8n
Input → Run Actor:
  regions: ["middle-east"]
  schedule: "every day at 9:00 AM"

→ Send Email: 
  to: team@company.com
  subject: "أحداث AI اليومية"
```

### مثال 2: مراقبة مستمرة عالمية

```n8n
Input → Run Actor:
  regions: ["worldwide"]
  schedule: "every 6 hours"

→ Save to MongoDB:
  database: "ai_events"
  collection: "festivals"

→ Slack Notification:
  channel: "#ai-updates"
```

### مثال 3: نشرة أسبوعية مفصلة

```n8n
Input → Run Actor:
  regions: ["africa", "middle-east", "asia"]
  schedule: "every Monday at 8:00 AM"

→ Process Data:
  Filter by type, region, date

→ Google Sheets Update:
  Sheet: "AI Events Weekly"

→ Send Email with Report:
  Attach data as PDF
```

---

## 📝 ملاحظات هامة

✅ **الحفاظ على الـ Credentials آمنة**
- لا تشارك API Keys
- استخدم Environment Variables
- مراجعة صلاحيات الحسابات بانتظام

✅ **مراقبة الاستخدام**
- Apify له حد أقصى من الاستخدام
- راقب Dashboard للاستهلاك
- اضبط `maxResults` حسب الحاجة

✅ **التحديثات**
- حافظ على Actor محدثاً
- اختبر التغييرات محلياً أولاً
- استخدم Version Control

---

## 🆘 الدعم والمساعدة

**مشاكل شائعة والحلول:**

| المشكلة | الحل |
|--------|------|
| Actor لا يعمل | تحقق من `package.json` والـ dependencies |
| بيانات فارغة | استخدم مصادر مختلفة في الإدخالات |
| بطء في الجمع | استخدم Apify Proxy وقلل maxResults |
| خطأ في الربط | تحقق من API Keys والـ Credentials |

**روابط مفيدة:**
- 📖 Apify Documentation: https://docs.apify.com
- 📖 n8n Documentation: https://docs.n8n.io
- 💬 Apify Community: https://www.apify.com/community
- 💬 n8n Community: https://community.n8n.io

---

**تم! الآن لديك نظام كامل لجمع أحداث AI تلقائياً! 🎉**
