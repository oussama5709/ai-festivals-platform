'use client';

import { useEffect, useState } from 'react';

type Status = 'checking' | 'online' | 'waking' | 'offline';

export function ApiStatus() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const check = async () => {
      const start = Date.now();
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/health`,
          { cache: 'no-store' }
        );
        const ms = Date.now() - start;
        setStatus(res.ok ? (ms > 5000 ? 'waking' : 'online') : 'offline');
      } catch {
        setStatus('offline');
      }
    };

    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);

  const config: Record<Status, { color: string; label: string }> = {
    checking: { color: 'bg-yellow-400', label: 'Checking API...' },
    online:   { color: 'bg-green-500',  label: 'API online' },
    waking:   { color: 'bg-orange-400', label: 'API waking up (~30s)' },
    offline:  { color: 'bg-red-500',    label: 'API offline' },
  };

  const { color, label } = config[status];

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`inline-block w-2 h-2 rounded-full ${color} ${status === 'checking' ? 'animate-pulse' : ''}`} />
      {label}
    </div>
  );
}
