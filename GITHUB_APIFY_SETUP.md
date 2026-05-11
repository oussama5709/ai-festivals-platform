# 🔗 دليل ربط GitHub مع Apify

## الخطوة 1️⃣: إنشاء Repository على GitHub

### 1.1 تسجيل الدخول إلى GitHub
```
اذهب إلى: https://github.com/login
أدخل بيانات دخولك
```

### 1.2 إنشاء Repository جديد
```
1. اضغط على + (أعلى اليمين)
2. اختر "New repository"
3. أملأ البيانات:
   - Repository name: ai-festivals-scraper
   - Description: 🤖 Intelligent AI events scraper for worldwide conferences
   - Public ✓ (مهم جداً!)
   - Initialize with README (اختياري)
4. اضغط "Create repository"
```

### 1.3 نسخ رابط Repository
```
- اضغط على الزر الأخضر "Code"
- انسخ الرابط HTTPS:
  https://github.com/YOUR_USERNAME/ai-festivals-scraper.git
```

---

## الخطوة 2️⃣: دفع الملفات إلى GitHub

### 2.1 تجهيز الملفات محلياً
```bash
# أنشئ مجلد جديد
mkdir ai-festivals-scraper
cd ai-festivals-scraper

# نسخ جميع الملفات من الـ outputs
# (ai-festivals-scraper.js, package.json, إلخ...)
```

### 2.2 تهيئة Git محلياً
```bash
# تهيئة Git
git init

# إضافة الملفات
git add .

# الالتزام الأول
git commit -m "Initial commit: AI Festivals Scraper v1.0"

# إضافة Remote
git remote add origin https://github.com/YOUR_USERNAME/ai-festivals-scraper.git

# دفع إلى GitHub (الفرع الرئيسي)
git branch -M main
git push -u origin main
```

### 2.3 التحقق على GitHub
```
اذهب إلى: https://github.com/YOUR_USERNAME/ai-festivals-scraper
✅ يجب أن ترى جميع الملفات هناك
```

---

## الخطوة 3️⃣: ربط Repository مع Apify Console

### 3.1 فتح Apify Console
```
اذهب إلى: https://console.apify.com/actors/development
```

### 3.2 الضغط على "Link Actor"
```
1. اضغط على الزر: "Link Actor source code from a Git repository"
2. سيفتح لك صفحة جديدة
```

### 3.3 إدخال رابط Repository
```
في الحقل "Link Git repository":
أدخل: https://github.com/YOUR_USERNAME/ai-festivals-scraper.git

ملاحظات:
✓ يجب أن يكون Repository عام (Public)
✓ الرابط يجب أن ينتهي بـ .git
✓ يجب أن يحتوي على apify.json و package.json
```

### 3.4 تأكيد الربط
```
1. اضغط "Link Actor"
2. سيأخذ بعض الثواني...
3. ✓ يجب أن ترى رسالة "Successfully linked"
```

---

## الخطوة 4️⃣: اختبار الربط

### 4.1 تشغيل من Apify
```
1. اذهب إلى Console
2. اختر الـ Actor الخاص بك
3. اضغط "Build"
4. انتظر حتى تكتمل عملية البناء
5. اضغط "Run" للاختبار
```

### 4.2 التحقق من النجاح
```
✓ الكود تم تحديثه من GitHub
✓ البناء نجح بدون أخطاء
✓ التشغيل أنتج نتائج صحيحة
```

---

## الخطوة 5️⃣: الإعدادات المتقدمة

### 5.1 إضافة Deploy Key (اختياري)
```
هذا يسمح لـ Apify بالدخول لـ Repository الخاص بك

1. اذهب إلى Settings الـ Repository
2. Deploy Keys
3. اضغط "Add deploy key"
4. انسخ المفتاح من Apify وألصقه
```

### 5.2 جدولة البناء التلقائي (اختياري)
```
في Apify Console:
1. اذهب إلى Git settings
2. اختر Build schedule
3. اختر "Automatic on push"
4. ✓ سيتم البناء تلقائياً عند كل push
```

### 5.3 إضافة Branch معينة (اختياري)
```
إذا كنت تريد استخدام فرع معين:
1. في الرابط، أضف: #branch-name
   https://github.com/user/repo.git#develop
2. Apify سيبني من هذا الفرع فقط
```

---

## 📝 Workflow التطوير

### عند إضافة ميزة جديدة:

```bash
# 1. إنشاء فرع جديد
git checkout -b feature/new-source

# 2. عمل التغييرات
# (عدّل الملفات حسب الحاجة)

# 3. اختبر محلياً
npm test

# 4. التزم التغييرات
git commit -m "feat: add new event source"

# 5. دفع إلى GitHub
git push origin feature/new-source

# 6. فتح Pull Request على GitHub

# 7. بعد الموافقة، دمج مع main
git checkout main
git merge feature/new-source
git push origin main

# 8. Apify سيبني تلقائياً من main
```

---

## 🆘 حل المشاكل

### المشكلة: "Repository not found"
```
✓ تأكد من أن Repository عام (Public)
✓ تحقق من الرابط - يجب أن ينتهي بـ .git
✓ تأكد من وجود apify.json في الجذر
```

### المشكلة: "Build failed"
```
✓ تحقق من package.json - هل صحيح؟
✓ تحقق من وجود جميع الملفات المطلوبة
✓ راجع سجل الأخطاء في Apify Console
✓ جرّب البناء محلياً: npm install && npm test
```

### المشكلة: "Changes not reflected"
```
✓ تأكد من أن التغييرات تم دفعها: git push
✓ انتظر حتى يكتمل البناء الأوتوماتيكي
✓ أعد تحميل صفحة Apify Console
✓ جرّب البناء اليدوي: اضغط "Build"
```

### المشكلة: "Actor source not updating"
```
✓ اذهب إلى Settings الـ Actor
✓ اضغط "Unlink" ثم "Link" مرة أخرى
✓ تأكد من أن الفرع صحيح
✓ جرّب في فرع مختلف
```

---

## 🔐 الأمان

### نصائح أمان مهمة:

```
❌ لا تضع:
- API Keys في الكود
- Credentials مباشرة
- معلومات حساسة
- Secrets أو Tokens

✅ استخدم بدلاً من ذلك:
- Environment Variables
- Apify Secrets
- .env.local (في .gitignore)
- GitHub Secrets (للـ CI/CD)
```

### إضافة GitHub Secret:
```
1. اذهب إلى Repository Settings
2. Secrets and variables → Actions
3. اضغط "New repository secret"
4. أضف الـ Secret (مثلاً: API_TOKEN)
5. استخدمه في الكود:
   const token = process.env.API_TOKEN
```

---

## 📊 Best Practices

### عند العمل مع GitHub و Apify:

1. **استخدم الفروع:**
   ```bash
   main → الإصدار المستقر
   develop → التطوير الجاري
   feature/* → ميزات جديدة
   ```

2. **اكتب رسائل Commit واضحة:**
   ```
   ✓ "feat: add MongoDB integration"
   ✓ "fix: resolve timeout issue"
   ✓ "docs: update installation guide"
   ✗ "update stuff"
   ✗ "fixes"
   ```

3. **اختبر قبل الدفع:**
   ```bash
   npm test
   npm run lint
   npm start (اختبار سريع)
   ```

4. **نظّف الفروع القديمة:**
   ```bash
   git branch -d feature/old-feature
   git push origin --delete feature/old-feature
   ```

---

## 🎯 الخطوات التالية

بعد ربط GitHub مع Apify:

1. ✅ انشر على Apify Store
2. ✅ شارك الـ Repository على GitHub
3. ✅ أضف إلى README الخاص بك رابط GitHub
4. ✅ فعّل GitHub Actions (اختياري)
5. ✅ أضف badges (اختياري)

---

## 📚 روابط مفيدة

- [GitHub Docs](https://docs.github.com/)
- [Git Cheat Sheet](https://git-scm.com/docs)
- [Apify Git Integration](https://docs.apify.com/platform/actors/development/git-integration)
- [GitHub Actions](https://github.com/features/actions)

---

**تم! الآن لديك Actor على GitHub مرتبط مع Apify! 🚀**

Made with ❤️ for the Arab AI Community
