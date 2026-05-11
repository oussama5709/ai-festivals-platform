# 🔗 دليل ربط Repository GitHub مع Apify Console

## ✅ معلوماتك:

```
GitHub Repository URL:
https://github.com/oussama5709/ai-festivals-scraper.git

Username: oussama5709
Repository Name: ai-festivals-scraper
```

---

## 🚀 الخطوات العملية:

### الخطوة 1️⃣: تسجيل الدخول إلى Apify Console
```
1. اذهب إلى: https://console.apify.com
2. سجّل الدخول بـ بيانات Apify الخاصة بك
3. اختر: My Actors (أو Development)
```

### الخطوة 2️⃣: فتح نافذة ربط Git Repository
```
1. اضغط على: "Link Actor source code from a Git repository"
2. سيفتح لك نافذة جديدة بعنوان:
   "Link Actor source code from a Git repository"
```

### الخطوة 3️⃣: إدخال رابط Repository
```
في حقل "Link Git repository":

أدخل هذا الرابط بالضبط:
https://github.com/oussama5709/ai-festivals-scraper.git

ملاحظات مهمة:
✓ يجب أن ينتهي الرابط بـ .git
✓ تأكد من عدم وجود مسافات زيادة
✓ الحروف كبيرة/صغيرة مهمة
✓ تأكد من أن Repository عام (Public)
```

### الخطوة 4️⃣: خيارات إضافية (اختياري)

#### اختيار فرع معين:
```
إذا كنت تريد فرع معين (بدلاً من main):
أضف # متبوعة باسم الفرع

مثال:
https://github.com/oussama5709/ai-festivals-scraper.git#develop
```

#### اختيار مجلد معين:
```
إذا كان الـ Actor في مجلد فرعي:
أضف اسم المجلد

مثل:
https://github.com/oussama5709/ai-festivals-scraper.git/actors/ai-festivals
```

### الخطوة 5️⃣: الموافقة والربط
```
1. اضغط على: "Link Actor"
2. انتظر قليلاً (10-30 ثانية)
3. سيظهر لك:
   ✓ "Successfully linked"
   أو
   ✗ رسالة خطأ (اقرأ الحل أدناه)
```

---

## ✅ التحقق من النجاح

### بعد الربط الناجح:

```
1. ستظهر رسالة: "Successfully linked to GitHub"
2. ستظهر معلومات Repository:
   - Repository URL
   - Branch (الفرع)
   - Directory (إن وجد)
3. سيظهر زر "Build" أزرق
4. اضغط "Build" للبناء الأول
```

### أثناء البناء:

```
ستظهر رسالة: "Building..."
مع شريط تقدم

انتظر حتى تكتمل (عادة 2-5 دقائق)
```

### بعد انتهاء البناء:

```
ستظهر رسالة: ✓ "Build successful"
أو إذا كان هناك خطأ: ✗ "Build failed"

إذا نجح:
1. اضغط "Run" لتشغيل الـ Actor
2. سيبدأ في جمع البيانات
```

---

## 🆘 حل المشاكل الشائعة

### ❌ خطأ: "Repository not found"

**الأسباب والحلول:**

```
السبب 1: Repository خاص (Private)
✓ الحل: اجعل Repository عام (Public)
  1. اذهب إلى Settings في GitHub
  2. اختر: Repository settings
  3. اختر: Danger zone
  4. Change repository visibility
  5. اختر: Public
  6. اضغط: I understand, change repository visibility

السبب 2: الرابط خاطئ
✓ الحل: تحقق من الرابط
  - يجب أن ينتهي بـ .git
  - تأكد من اسم المستخدم: oussama5709
  - تأكد من اسم Repository: ai-festivals-scraper
  - الرابط الصحيح:
    https://github.com/oussama5709/ai-festivals-scraper.git

السبب 3: Repository محذوف
✓ الحل: 
  - تأكد من وجود Repository على GitHub
  - يمكنك الذهاب إلى: github.com/oussama5709/ai-festivals-scraper
```

### ❌ خطأ: "apify.json not found"

**الحل:**

```
تأكد من وجود apify.json في الجذر:
✓ يجب أن يكون في:
  https://github.com/oussama5709/ai-festivals-scraper/blob/main/apify.json

✓ يمكنك إضافة apify.json:
{
  "actorSpecification": 1,
  "name": "ai-festivals-scraper",
  "title": "AI Festivals & Conferences Scraper",
  "description": "Smart scraper for AI events worldwide",
  "version": "1.0.0"
}
```

### ❌ خطأ: "Build failed"

**الحلول الممكنة:**

```
السبب 1: package.json خاطئ
✓ تأكد من صحة JSON syntax
✓ اختبر محلياً: npm install

السبب 2: ملف مفقود
✓ تأكد من وجود:
  - package.json
  - apify.json
  - ai-festivals-scraper.js (أو main.js)
  - Dockerfile

السبب 3: خطأ في الكود
✓ راجع سجل الأخطاء في Apify Console
✓ اختبر الكود محلياً: npm test

السبب 4: المتعلقات ناقصة
✓ تأكد من package.json يحتوي على جميع المتعلقات:
  - apify
  - axios
  - cheerio
```

### ❌ خطأ: "Changes not showing"

**الحلول:**

```
المشكلة: عدّلت الكود على GitHub لكن Apify لا يظهر التغييرات

الحل 1: أعد البناء يدويًا
1. اذهب إلى Apify Console
2. اضغط: "Build"
3. انتظر حتى ينتهي

الحل 2: تفعيل البناء التلقائي
1. في Settings الـ Actor
2. اختر: "Automatic builds on Git push"
3. ✓ الآن سيبني تلقائياً عند كل push

الحل 3: حذف والربط من جديد
1. في Settings
2. اضغط: "Unlink" 
3. ثم "Link" مرة أخرى
4. أدخل الرابط من جديد
```

---

## 🔄 Workflow التطوير

### عندما تريد تطوير الـ Actor:

```bash
# 1. اجلب آخر النسخة
git pull origin main

# 2. أنشئ فرع جديد
git checkout -b feature/new-feature

# 3. عدّل الملفات
# (عدّل ai-festivals-scraper.js أو غيره)

# 4. اختبر محلياً
npm test
npm start

# 5. التزم التغييرات
git add .
git commit -m "feat: add new feature"

# 6. دفع إلى GitHub
git push origin feature/new-feature

# 7. في Apify Console:
# - سيبني تلقائياً من main
# - إذا كان البناء من feature:
#   https://github.com/oussama5709/ai-festivals-scraper.git#feature/new-feature

# 8. بعد الاختبار، دمج مع main
git checkout main
git merge feature/new-feature
git push origin main

# 9. Apify سيبني من main تلقائياً ✓
```

---

## 🛠️ إعدادات متقدمة

### تفعيل البناء التلقائي:

```
في Apify Console:
1. اذهب إلى: Actor Settings
2. اختر: Git Settings
3. فعّل: Automatic builds on Git push
4. ✓ الآن سيبني تلقائياً عند كل push إلى GitHub
```

### إضافة Deploy Key (اختياري):

```
للمستودعات الخاصة (لا تحتاجها الآن):

1. في Apify: Git Settings → Deploy Key
2. انسخ المفتاح
3. في GitHub: Settings → Deploy Keys
4. Add Deploy Key
5. ألصق المفتاح
```

### تعيين GitHub Username و Email:

```bash
# قبل البدء:
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## 📋 قائمة التحقق

قبل الربط:
- [ ] تسجيل الدخول إلى Apify Console
- [ ] Repository عام (Public) ✓
- [ ] الرابط صحيح بالضبط
- [ ] وجود apify.json في الجذر
- [ ] وجود package.json صحيح
- [ ] الكود مختبر محلياً

بعد الربط:
- [ ] ظهرت رسالة "Successfully linked"
- [ ] البناء نجح ✓
- [ ] التشغيل أنتج نتائج صحيحة
- [ ] يمكنك رؤية البيانات في Dataset

---

## 🎯 الخطوات التالية

### بعد الربط الناجح:

1. ✅ **اختبر الـ Actor:**
   ```
   1. في Apify Console
   2. اضغط "Run"
   3. انتظر النتائج
   4. تحقق من البيانات
   ```

2. ✅ **انشر على Apify Store:**
   ```
   1. في Settings
   2. اختر: Build Settings
   3. Public → True
   4. حفظ
   5. سيظهر في Apify Store
   ```

3. ✅ **شارك Repository:**
   ```
   1. اذهب إلى: github.com/oussama5709/ai-festivals-scraper
   2. اضغط: Star (إذا أعجبك)
   3. شارك الرابط
   ```

4. ✅ **استقبل مساهمات:**
   ```
   1. فعّل Issues
   2. فعّل Pull Requests
   3. أجب على المساهمات
   ```

---

## 💡 نصائح مهمة

### عند التطوير:

```
✓ اختبر محلياً قبل push:
  npm test
  npm start

✓ اكتب رسائل commit واضحة:
  ✓ "feat: add new source"
  ✓ "fix: resolve timeout"
  ✗ "update stuff"

✓ استخدم أسماء فروع واضحة:
  ✓ feature/add-meetup-source
  ✓ fix/connection-timeout
  ✗ test, fix1, new
```

### عند الربط:

```
✓ يجب أن يكون Repository عام (Public)
✓ الرابط يجب أن ينتهي بـ .git
✓ apify.json يجب أن يكون موجوداً
✓ package.json يجب أن يكون صحيحاً
✓ Dockerfile يجب أن يكون موجوداً
```

---

## 🔗 روابط مفيدة

- **Repository:** https://github.com/oussama5709/ai-festivals-scraper
- **Apify Console:** https://console.apify.com
- **Apify Docs:** https://docs.apify.com
- **GitHub Docs:** https://docs.github.com

---

## ✅ تم!

الآن لديك Repository على GitHub مرتبط مع Apify Console! 🎉

**الخطوة التالية:**
1. اضغط "Build" في Apify Console
2. اختبر الـ Actor
3. انشره على Apify Store

**استمتع! 🚀**

---

Made with ❤️ for the Arab AI Community
