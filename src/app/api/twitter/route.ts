import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

type Tweet = {
  id: string;
  text: string;
  created_at: string;
  [key: string]: unknown;
};

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  const data = await redis.get<{ tweet: Tweet; timestamp: number }>('latest_tweet');
  if (!data || !data.tweet) {
    return NextResponse.json({ tweet: null, message: 'No tweet cached yet.' });
  }
  return NextResponse.json({ tweet: data.tweet, lastUpdated: data.timestamp });
} 