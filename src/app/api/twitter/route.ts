import { NextResponse } from 'next/server';

declare let latestTweet: any;

export async function GET() {
  if (typeof latestTweet === 'undefined' || latestTweet === null) {
    return NextResponse.json({ tweet: null, message: 'No tweet cached yet.' });
  }
  return NextResponse.json({ tweet: latestTweet });
} 