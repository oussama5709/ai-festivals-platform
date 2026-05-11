import axios from 'axios';
import twilio from 'twilio';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER ?? 'whatsapp:+14155238886';
const USER_WHATSAPP = 'whatsapp:+21626314325';

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
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn('[Notify] Twilio not configured — skipping.');
    return;
  }
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  await client.messages.create({
    from: TWILIO_WHATSAPP_NUMBER,
    to: USER_WHATSAPP,
    body: message,
  });
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
