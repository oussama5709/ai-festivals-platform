import dotenv from 'dotenv';
dotenv.config();

import { sendTelegramAlert, sendWhatsAppAlert } from './src/services/notificationService';

const testEvent = {
  title: 'AI Film Festival Test 🎬',
  regionArabic: 'الشرق الأوسط',
  url: 'https://example.com/ai-film-fest',
  date: new Date('2025-10-01'),
  location: 'Tunis, Tunisia',
};

const message =
  `🎥 مهرجان أفلام ذكاء اصطناعي جديد!\n` +
  `العنوان: ${testEvent.title}\n` +
  `المنطقة: ${testEvent.regionArabic}\n` +
  `المكان: ${testEvent.location}\n` +
  `التاريخ: ${testEvent.date.toLocaleDateString('ar-TN')}\n` +
  `الرابط: ${testEvent.url}`;

async function main() {
  console.log('Sending test notifications...\n');
  console.log('Message:\n', message, '\n');

  const [tg, wa] = await Promise.allSettled([
    sendTelegramAlert(message),
    sendWhatsAppAlert(message),
  ]);

  console.log('Telegram:', tg.status === 'fulfilled' ? '✅ sent' : `❌ ${(tg as PromiseRejectedResult).reason}`);
  console.log('WhatsApp:', wa.status === 'fulfilled' ? '✅ sent' : `❌ ${(wa as PromiseRejectedResult).reason}`);
}

main().catch(console.error);
