# استخدم الصورة الأساسية من Apify
FROM apify/actor-node:20

# نسخ ملفات المشروع (بما فيها sources/ و utils/ التي يحتاجها main.js)
COPY package.json ./
RUN npm install --omit=dev
COPY . .

# تشغيل الـ actor
CMD ["node", "main.js"]
