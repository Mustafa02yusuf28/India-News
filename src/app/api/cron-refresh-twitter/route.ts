import { NextResponse } from 'next/server';
import axios from 'axios';
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

const TWITTER_HANDLE = 'sidhant';

async function getLatestTweet(): Promise<Tweet | null> {
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
  const tweet = tweetResp.data.data?.[0];
  if (!tweet) return null;
  return {
    id: tweet.id,
    text: tweet.text,
    created_at: tweet.created_at,
    ...tweet
  };
}

export async function GET() {
  try {
    const tweet = await getLatestTweet();
    if (tweet) {
      await redis.set('latest_tweet', tweet);
    }
    return NextResponse.json({ success: true, tweet });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch tweet', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
} 