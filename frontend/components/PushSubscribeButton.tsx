'use client';

import { useState, useEffect } from 'react';

export function PushSubscribeButton({ topics = ['ai-competitions', 'tunisia'] }: { topics?: string[] }) {
  const [state, setState] = useState<'idle' | 'loading' | 'subscribed' | 'unsupported'>('idle');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (localStorage.getItem('push-subscribed') === '1') {
      setState('subscribed');
    }
  }, []);

  const subscribe = async () => {
    if (state !== 'idle') return;
    setState('loading');

    try {
      // Fetch VAPID public key from API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      const { publicKey } = await fetch(`${apiUrl}/api/notifications/vapid-public-key`).then((r) => r.json());

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey, // pass raw base64url string — browsers accept it
      });

      await fetch(`${apiUrl}/api/notifications/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), topics }),
      });

      localStorage.setItem('push-subscribed', '1');
      setState('subscribed');
    } catch (err) {
      console.error('[push] subscribe failed:', err);
      setState('idle');
    }
  };

  if (state === 'unsupported') return null;

  return (
    <button
      onClick={subscribe}
      disabled={state === 'loading' || state === 'subscribed'}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        state === 'subscribed'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 cursor-default'
          : state === 'loading'
          ? 'opacity-60 cursor-wait bg-secondary text-muted-foreground'
          : 'bg-foreground text-background hover:opacity-90'
      }`}
      aria-label={state === 'subscribed' ? 'Push notifications active' : 'Enable push notifications'}
    >
      {state === 'subscribed' ? '🔔 مفعّل الإشعارات' : state === 'loading' ? '⏳ جاري التفعيل...' : '🔔 فعّل الإشعارات'}
    </button>
  );
}

