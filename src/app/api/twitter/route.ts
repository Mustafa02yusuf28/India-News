import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    const cached = await kv.get('twitter-tweets');
    if (cached) {
      return NextResponse.json(JSON.parse(cached.toString()));
    } else {
      return NextResponse.json({ tweets: [] });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tweets' }, { status: 500 });
  }
} 