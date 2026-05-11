import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ULTRAMSG_INSTANCE = process.env.ULTRAMSG_INSTANCE || 'instance174679';
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN;
const USER_PHONE = '+21626314325';

export async function sendTelegramAlert(message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Notify] Telegram not configured — skipping.');
    return;
  }
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'HTML',
  });
}

export async function sendWhatsAppAlert(message: string): Promise<void> {
  if (!ULTRAMSG_TOKEN) {
    console.warn('[Notify] UltraMsg not configured — skipping.');
    return;
  }
  await axios.post(
    `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`,
    { token: ULTRAMSG_TOKEN, to: USER_PHONE, body: message },
    { headers: { 'Content-Type': 'application/json' } }
  );
}

interface FilmEvent {
  title: string;
  regionArabic?: string | null;
  url?: string | null;
  date?: Date | string | null;
  location?: string | null;
}

export function notifyUser(event: FilmEvent): void {
  const message =
    `🎥 مهرجان أفلام ذكاء اصطناعي جديد!\n` +
    `العنوان: ${event.title}\n` +
    `المنطقة: ${event.regionArabic ?? 'غير محدد'}\n` +
    (event.location ? `المكان: ${event.location}\n` : '') +
    (event.date ? `التاريخ: ${new Date(event.date).toLocaleDateString('ar-TN')}\n` : '') +
    `الرابط: ${event.url ?? 'غير متاح'}`;

  // Fire-and-forget — don't block webhook response
  Promise.allSettled([
    sendTelegramAlert(message),
    sendWhatsAppAlert(message),
  ]).then((results) => {
    results.forEach((r, i) => {
      const channel = i === 0 ? 'Telegram' : 'WhatsApp';
      if (r.status === 'rejected') {
        console.error(`[Notify] ${channel} failed:`, r.reason);
      } else {
        console.log(`[Notify] ${channel} sent ✓`);
      }
    });
  });
}
