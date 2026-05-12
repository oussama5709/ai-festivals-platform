'use client';

import { Share2, Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Share event"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" aria-hidden />
          Link copied!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" aria-hidden />
          Share
        </>
      )}
    </button>
  );
}
