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
  } catch (err) {
    console.error('Error in /api/twitter:', err);
    return NextResponse.json({ error: 'Failed to fetch tweets', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
} 