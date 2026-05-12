import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 0;

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`, {
      cache: 'no-store',
    });
    const data = await res.json() as Record<string, unknown>;
    return NextResponse.json({ pinged: true, api: data });
  } catch {
    return NextResponse.json({ pinged: false }, { status: 503 });
  }
}
