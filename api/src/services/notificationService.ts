import axios from 'axios';
import { sendPushToTopic } from './pushService';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
const USER_PHONE = process.env.NOTIFY_WHATSAPP_TO ?? '+21626314325';

export async function sendTelegramAlert(message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Notify] Telegram not configured - skipping.');
    return;
  }
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'HTML',
  });
}

function toWhatsAppAddress(num: string): string {
  return num.startsWith('whatsapp:') ? num : `whatsapp:${num}`;
}

export async function sendWhatsAppAlert(message: string): Promise<void> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    console.warn('[Notify] WhatsApp (Twilio) not configured - skipping.');
    return;
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const body = new URLSearchParams({
    From: toWhatsAppAddress(TWILIO_WHATSAPP_NUMBER),
    To: toWhatsAppAddress(USER_PHONE),
    Body: message,
  });
  await axios.post(url, body, {
    auth: { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

export interface NotifyEvent {
  title: string;
  regionArabic?: string | null;
  region?: string | null;
  url?: string | null;
  date?: Date | string | null;
  location?: string | null;
  category?: string | null;
  isTunisia?: boolean;
  isFilmCompetition?: boolean;
  isCompetition?: boolean;
}

function formatEventMessage(event: NotifyEvent, headline: string): string {
  return (
    `${headline}\n` +
    `Title: ${event.title}\n` +
    `Region: ${event.regionArabic ?? event.region ?? 'N/A'}\n` +
    (event.location ? `Location: ${event.location}\n` : '') +
    (event.date ? `Date: ${new Date(event.date).toLocaleDateString('en-GB')}\n` : '') +
    `Link: ${event.url ?? 'N/A'}`
  );
}

export function notifyNewEvent(event: NotifyEvent): void {
  const isFilm = event.isFilmCompetition || /film|cinema/i.test(event.title);
  const headline = isFilm
    ? 'New AI film festival!'
    : event.isCompetition
    ? 'New AI competition!'
    : 'New AI event!';
  const message = formatEventMessage(event, headline);
  const topic = event.isTunisia ? 'tunisia' : 'ai-competitions';

  Promise.allSettled([
    sendTelegramAlert(message),
    sendWhatsAppAlert(message),
    sendPushToTopic(topic, { title: headline, body: event.title, url: event.url ?? undefined }),
  ]).then((results) => {
    const channels = ['Telegram', 'WhatsApp', 'Push'];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[Notify] ${channels[i]} failed:`, r.reason);
      } else {
        console.log(`[Notify] ${channels[i]} sent`);
      }
    });
  });
}

export const notifyUser = notifyNewEvent;

export function notifyDeadlineChange(
  event: NotifyEvent,
  kind: 'submission' | 'cfp',
  oldDeadline: Date | null,
  newDeadline: Date | null
): void {
  const label = kind === 'submission' ? 'Submission deadline' : 'CFP deadline';
  const oldStr = oldDeadline ? new Date(oldDeadline).toLocaleDateString('en-GB') : 'N/A';
  const newStr = newDeadline ? new Date(newDeadline).toLocaleDateString('en-GB') : 'N/A';
  const message = `${label} changed!\nTitle: ${event.title}\nFrom: ${oldStr} -> To: ${newStr}\nLink: ${event.url ?? 'N/A'}`;
  const topic = event.isTunisia ? 'tunisia' : 'ai-competitions';

  Promise.allSettled([
    sendTelegramAlert(message),
    sendWhatsAppAlert(message),
    sendPushToTopic(topic, { title: `${label} changed`, body: event.title, url: event.url ?? undefined }),
  ]).then((results) => {
    const channels = ['Telegram', 'WhatsApp', 'Push'];
    results.forEach((r, i) => {
      if (r.status === 'rejected') console.error(`[Notify] deadline-change ${channels[i]} failed:`, r.reason);
    });
  });
}
