import { NextResponse } from 'next/server';

type Tweet = {
  id: string;
  text: string;
  created_at: string;
  [key: string]: unknown;
};

declare let latestTweet: Tweet | null;

export async function GET() {
  if (typeof latestTweet === 'undefined' || latestTweet === null) {
    return NextResponse.json({ tweet: null, message: 'No tweet cached yet.' });
  }
  return NextResponse.json({ tweet: latestTweet });
} 