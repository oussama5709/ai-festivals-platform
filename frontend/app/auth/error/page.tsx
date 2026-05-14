'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';

function ErrorContent() {
  const params = useSearchParams();
  const error = params.get('error');

  const messages: Record<string, string> = {
    OAuthSignin:        'خطأ في الاتصال بـ Google/Facebook. حاول مرة أخرى.',
    OAuthCallback:      'خطأ في المصادقة. حاول مرة أخرى.',
    OAuthAccountNotLinked: 'هذا الإيميل مستخدم مع طريقة دخول أخرى.',
    AccessDenied:       'تم رفض الوصول.',
    Default:            'خطأ غير متوقع. حاول مرة أخرى.',
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-xl font-semibold mb-2">خطأ في تسجيل الدخول</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {messages[error ?? 'Default'] ?? messages.Default}
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          حاول مرة أخرى ←
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <>
      <Navbar />
      <Suspense>
        <ErrorContent />
      </Suspense>
    </>
  );
}
