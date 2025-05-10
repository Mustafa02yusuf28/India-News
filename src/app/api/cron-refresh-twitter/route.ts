import { NextResponse } from 'next/server';
import axios from 'axios';

let latestTweet: any = null; // In-memory cache

const TWITTER_HANDLE = 'sidhant';

async function getLatestTweet(): Promise<any> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) return null;
  // Get user ID
  const userResp = await axios.get(
    `https://api.twitter.com/2/users/by/username/${TWITTER_HANDLE}`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );
  const userId = userResp.data.data.id;
  // Get latest tweet
  const tweetResp = await axios.get(
    `https://api.twitter.com/2/users/${userId}/tweets`,
    {
      params: { max_results: 1, 'tweet.fields': 'created_at' },
      headers: { Authorization: `Bearer ${bearerToken}` }
    }
  );
  return tweetResp.data.data?.[0] || null;
}

export async function GET() {
  try {
    latestTweet = await getLatestTweet();
    return NextResponse.json({ success: true, tweet: latestTweet });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch tweet', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
} 