import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY;
const USER_PHONE = '21626314325'; // without +

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
  if (!CALLMEBOT_API_KEY) {
    console.warn('[Notify] CallMeBot not configured — skipping.');
    return;
  }
  const encoded = encodeURIComponent(message);
  await axios.get(
    `https://api.callmebot.com/whatsapp.php?phone=${USER_PHONE}&text=${encoded}&apikey=${CALLMEBOT_API_KEY}`
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
