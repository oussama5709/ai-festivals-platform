# 🔗 إعداد Apify MCP Server - دليل شامل

## ما هو Apify MCP؟

**Model Context Protocol (MCP)** هو بروتوكول يسمح لـ Claude والأدوات الأخرى بالتواصل المباشر مع Apify بدون واجهة ويب.

---

## 🚀 الإعداد السريع

### الخطوة 1: الحصول على API Token

```bash
# 1. اذهب إلى https://console.apify.com
# 2. Integrations → API Tokens
# 3. انسخ Default token
# 4. احفظه في مكان آمن!
```

### الخطوة 2: إضافة MCP Configuration

#### 📍 لـ Claude Desktop (Windows/Mac/Linux):

إذا كنت تستخدم Claude Desktop App:

```json
// ~/.config/Claude/claude_desktop_config.json
// أو C:\Users\<YourUsername>\AppData\Roaming\Claude\claude_desktop_config.json (Windows)

{
  "mcpServers": {
    "apify": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.apify.com/",
        "--header",
        "Authorization: Bearer YOUR_API_TOKEN_HERE"
      ]
    }
  }
}
```

#### 🌐 لـ Claude.ai (Web):

للأسف، Claude.ai الويب **لا يدعم MCP Servers** مباشرة حالياً.

بدلاً من ذلك استخدم:
- ✅ Claude Desktop App
- ✅ API Integration (عبر n8n)
- ✅ Web Integration (عبر Apify REST API)

---

## 📋 خطوات التثبيت التفصيلية

### على Windows:

```
1. افتح مجلد AppData
   C:\Users\<YourUsername>\AppData\Roaming\Claude\

2. إذا لم يوجد المجلد، أنشئه

3. أنشئ ملف: claude_desktop_config.json

4. أضف هذا المحتوى:
```

```json
{
  "mcpServers": {
    "apify": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.apify.com/",
        "--header",
        "Authorization: Bearer YOUR_API_TOKEN_HERE"
      ]
    }
  }
}
```

### على Mac:

```bash
# 1. افتح Terminal
# 2. انسخ هذا الأمر:
mkdir -p ~/.config/Claude

# 3. أنشئ الملف:
touch ~/.config/Claude/claude_desktop_config.json

# 4. افتح الملف وأضف المحتوى أعلاه
```

### على Linux:

```bash
# 1. افتح Terminal
# 2. انسخ:
mkdir -p ~/.config/Claude

# 3. أنشئ الملف:
nano ~/.config/Claude/claude_desktop_config.json

# 4. أضف المحتوى وحفظ (Ctrl+O ثم Enter ثم Ctrl+X)
```

---

## 🔐 أمان API Token

### ⚠️ **تحذير مهم:**

❌ **لا تنسخ Token مباشرة في الملف**  
✅ **استخدم Environment Variables**

### الطريقة الآمنة:

#### على Windows:

```batch
# 1. افتح CMD
# 2. أضف متغير البيئة:
setx APIFY_API_TOKEN "YOUR_TOKEN_HERE"

# 3. أعد تشغيل الجهاز أو البرنامج
```

#### على Mac/Linux:

```bash
# 1. افتح Terminal
# 2. أضف إلى ~/.zshrc أو ~/.bashrc:
export APIFY_API_TOKEN="YOUR_TOKEN_HERE"

# 3. حفظ وأعد التحميل:
source ~/.zshrc  # أو ~/.bashrc
```

### تحديث الـ Config:

```json
{
  "mcpServers": {
    "apify": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.apify.com/",
        "--header",
        "Authorization: Bearer ${APIFY_API_TOKEN}"
      ]
    }
  }
}
```

---

## ✅ اختبار الاتصال

بعد التكوين، أعد تشغيل Claude Desktop:

```
1. اغلق Claude تماماً
2. افتحه من جديد
3. جرّب الأمر:

   "شغّل الـ Actor ai-festivals-scraper مع هذه البارامترات:
    searchRegions: ['middle-east']
    maxResults: 50"
```

إذا عملت، ستظهر رسالة تأكيد! ✅

---

## 🎯 الخيارات المتاحة عبر MCP

### 1. تشغيل Actor

```
Claude: شغّل Actor ai-festivals-scraper
Parameters:
  - searchRegions: ["worldwide"]
  - maxResults: 100
```

### 2. الحصول على معلومات Actor

```
Claude: أخبرني عن ai-festivals-scraper
```

### 3. جدولة التشغيل

```
Claude: شغّل الـ Actor يومياً الساعة 9 صباحاً
```

### 4. عرض النتائج

```
Claude: اعرض نتائج آخر تشغيل للـ Actor
```

---

## 📊 مقارنة بين الطرق

| الطريقة | السرعة | الأمان | السهولة | الدعم |
|--------|-------|-------|--------|-------|
| **MCP Server** | ⚡⚡⚡ | ⭐⭐⭐ | ⭐⭐ | Desktop فقط |
| **REST API** | ⚡⚡ | ⭐⭐⭐ | ⭐⭐⭐ | الكل |
| **n8n** | ⚡ | ⭐⭐⭐ | ⭐⭐ | الكل |
| **Web UI** | ⚡⚡ | ⭐⭐ | ⭐⭐⭐ | الكل |

---

## 🔧 استكشاف الأخطاء

### ❌ "MCP Server not found"

✅ **الحل:**
```
1. تحقق من صحة JSON في claude_desktop_config.json
2. استخدم JSON validator: https://jsonlint.com/
3. أعد تشغيل Claude
```

### ❌ "Authorization failed"

✅ **الحل:**
```
1. تأكد من صحة API Token
2. تحقق من انتهاء صلاحيته
3. أنشئ token جديد من console.apify.com
```

### ❌ "Connection timeout"

✅ **الحل:**
```
1. تحقق من الإنترنت
2. جرّب VPN
3. تحقق من حالة Apify: https://status.apify.com/
```

---

## 🚀 أمثلة الاستخدام

### مثال 1: جمع أحداث الشرق الأوسط

```
أنا: شغّل ai-festivals-scraper للشرق الأوسط مع أقصى 100 نتيجة

Claude: سأقوم بتشغيل الـ Actor الآن...
```

### مثال 2: معالجة تلقائية

```
أنا: شغّل الـ Actor، ثم احفظ النتائج في ملف JSON

Claude: سأقوم بـ:
1. تشغيل ai-festivals-scraper
2. انتظار انتهاء التشغيل
3. حفظ النتائج
```

### مثال 3: مراقبة مستمرة

```
أنا: شغّل الـ Actor كل 12 ساعة وأرسل نتائج جديدة عبر البريد

Claude: سأقوم بـ:
1. جدولة التشغيل
2. إضافة بريد إلكتروني
3. إرسال إشعارات
```

---

## 📝 ملف الإعدادات الكامل

```json
{
  "mcpServers": {
    "apify": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.apify.com/",
        "--header",
        "Authorization: Bearer YOUR_API_TOKEN_HERE"
      ],
      "env": {
        "APIFY_API_TOKEN": "YOUR_API_TOKEN_HERE"
      }
    }
  },
  "experimental": {
    "openRouter": {
      "apiKey": "optional-if-using-openrouter"
    }
  }
}
```

---

## 🎯 الخطوات النهائية

### 1. ✅ تأكد من:
- [ ] نسخ API Token صحيح
- [ ] الملف JSON صحيح
- [ ] موقع الملف صحيح

### 2. ✅ أعد تشغيل:
- [ ] Claude Desktop
- [ ] الجهاز (اختياري)

### 3. ✅ اختبر:
- [ ] جرّب أمر بسيط
- [ ] تحقق من الاتصال
- [ ] احفظ النتائج

---

## 💡 نصائح مهمة

✨ **استخدم المتغيرات:**
```
${APIFY_API_TOKEN}
${HOME}
${USER}
```

✨ **احتفظ بنسخة احتياطية:**
```
احفظ نسخة من الملف قبل التعديل
```

✨ **أمان API:**
```
لا تشارك Token مع أحد
غيّره كل 3 أشهر
استخدم Environment Variables دائماً
```

---

## 🔗 روابط مفيدة

- 📖 [Apify MCP Docs](https://docs.apify.com/platform/integrations/model-context-protocol)
- 🔐 [Claude Desktop Config](https://modelcontextprotocol.io/docs/tools/mcp-remote)
- 🆘 [Apify Support](https://www.apify.com/contact)
- 💬 [Apify Community](https://www.apify.com/community)

---

## 🎉 تم!

أنت الآن جاهز لاستخدام Apify MCP مع Claude!

**الخطوة التالية:**
1. أعد تشغيل Claude Desktop
2. جرّب تشغيل الـ Actor
3. استمتع بالأتمتة الذكية! 🚀

---

Made with ❤️ for the Arab AI Community

تم الإنشاء: 2025-03-03  
الإصدار: 1.0.0
