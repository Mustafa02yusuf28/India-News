import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import axios from 'axios';

const TWITTER_HANDLE = 'sidhant';

interface RawTweet {
  id: string;
  text: string;
  created_at: string;
  author: string;
}

async function getUserId(username: string, bearerToken: string): Promise<string | null> {
  try {
    const response = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      }
    );
    if (response.data.data && response.data.data.id) {
      return response.data.data.id;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user ID:', err);
    return null;
  }
}

async function fetchLatestTweets(): Promise<RawTweet[]> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    console.error('No Twitter Bearer Token set in environment variables.');
    return [];
  }
  const userId = await getUserId(TWITTER_HANDLE, bearerToken);
  if (!userId) {
    console.error('No user ID found for Twitter handle.');
    return [];
  }
  try {
    const response = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets`,
      {
        params: {
          max_results: 10,
          'tweet.fields': 'created_at',
          expansions: 'author_id'
        },
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      }
    );
    if (response.data.data && response.data.data.length > 0) {
      return response.data.data.map((tweet: { id: string; text: string; created_at: string }) => ({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        author: TWITTER_HANDLE
      }));
    }
    return [];
  } catch (err) {
    console.error('Error fetching tweets from Twitter API:', err);
    return [];
  }
}

export async function GET() {
  try {
    const tweets = await fetchLatestTweets();
    await kv.set('twitter-tweets', JSON.stringify({ tweets, timestamp: Date.now() }));
    return NextResponse.json({ success: true, count: tweets.length });
  } catch (err) {
    console.error('Error in cron-refresh-twitter:', err);
    return NextResponse.json({
      error: 'Failed to refresh tweets',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
} 