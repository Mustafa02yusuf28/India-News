import { NextResponse } from 'next/server';
import axios from 'axios';

const TWITTER_API_URL = 'https://api.twitter.com/2';
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const TWITTER_USER_ID = '25073877'; // @sidhant's Twitter ID
const COOLDOWN_DURATION = 15 * 60; // 15 minutes in seconds

// Define Twitter API types
interface TwitterMedia {
  media_key: string;
  url?: string;
  preview_image_url?: string;
}

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  attachments?: {
    media_keys?: string[];
  };
}

interface TwitterResponse {
  data: TwitterTweet[];
  includes?: {
    media?: TwitterMedia[];
  };
}

interface ProcessedTweet extends TwitterTweet {
  author: string;
  media_url: string | null;
}

// In-memory cache for last refresh time (global timer)
let lastRefreshTime: number | null = null;

// Initialize lastRefreshTime if null
if (lastRefreshTime === null) {
  lastRefreshTime = Math.floor(Date.now() / 1000);
  console.log('[GLOBAL TIMER] Initialized:', {
    timestamp: lastRefreshTime,
    readableTime: new Date(lastRefreshTime * 1000).toISOString(),
    nextRefreshAt: new Date((lastRefreshTime + COOLDOWN_DURATION) * 1000).toISOString()
  });
}

// Mock tweets for returning when we can't actually fetch from Twitter
// This way we don't need to make the Twitter API call at all when timers aren't ready
const mockTweets: ProcessedTweet[] = [
  {
    id: 'cached-1',
    text: 'Please wait for the timer to complete before fetching new tweets.',
    created_at: new Date().toISOString(),
    author: 'sidhant',
    media_url: null
  }
];

export async function GET(request: Request) {
  // Get the URL from the request
  const url = new URL(request.url);
  const forceFetch = url.searchParams.get('force') === 'true';
  
  if (!TWITTER_BEARER_TOKEN) {
    console.error('Twitter Bearer Token is not configured');
    return NextResponse.json(
      { 
        error: 'Twitter API is not configured properly',
        tweets: [],
        timeUntilRefresh: COOLDOWN_DURATION,
        canRefresh: false
      },
      { status: 500 }
    );
  }

  // Calculate cooldown status
  const currentTime = Math.floor(Date.now() / 1000);
  const timeSinceLastRefresh = lastRefreshTime ? currentTime - lastRefreshTime : COOLDOWN_DURATION;
  const remainingTime = Math.max(0, COOLDOWN_DURATION - timeSinceLastRefresh);
  const canRefresh = remainingTime <= 0;

  // Log timer status in terminal for every request
  console.log('[GLOBAL TIMER] Status:', {
    path: url.pathname,
    query: url.search,
    currentTime: new Date(currentTime * 1000).toISOString(),
    lastRefreshTime: lastRefreshTime ? new Date(lastRefreshTime * 1000).toISOString() : 'None',
    timeSinceLastRefresh,
    remainingTime,
    canRefresh,
    nextRefreshAt: lastRefreshTime 
      ? new Date((lastRefreshTime + COOLDOWN_DURATION) * 1000).toISOString()
      : 'Now'
  });

  // Return cooldown response if timer is active (unless force=true for testing)
  if (!canRefresh && !forceFetch) {
    console.log('[GLOBAL TIMER] Request blocked - cooldown active');
    return NextResponse.json(
      { 
        error: 'Rate limit cooldown active',
        details: `Please wait ${Math.ceil(remainingTime / 60)} minutes before refreshing again`,
        tweets: mockTweets, // Return mock tweets during cooldown
        timeUntilRefresh: remainingTime,
        canRefresh: false,
        lastRefreshTime
      },
      { status: 200 } // Return 200 instead of 429 to prevent console errors
    );
  }

  try {
    console.log('[TWITTER API] Fetching tweets for user:', TWITTER_USER_ID);
    const response = await axios.get<TwitterResponse>(
      `${TWITTER_API_URL}/users/${TWITTER_USER_ID}/tweets`,
      {
        headers: {
          Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
        },
        params: {
          max_results: 10,
          'tweet.fields': 'created_at,public_metrics',
          expansions: 'attachments.media_keys',
          'media.fields': 'url,preview_image_url'
        },
      }
    );

    console.log('[TWITTER API] Response received');

    // Update last refresh time
    lastRefreshTime = currentTime;
    console.log('[GLOBAL TIMER] Updated:', {
      timestamp: lastRefreshTime,
      readableTime: new Date(lastRefreshTime * 1000).toISOString(),
      nextRefreshAt: new Date((lastRefreshTime + COOLDOWN_DURATION) * 1000).toISOString()
    });

    // Process tweets to include media URLs and author field
    const tweets = response.data.data && response.data.data.length > 0
      ? response.data.data.map((tweet: TwitterTweet): ProcessedTweet => ({
          ...tweet,
          author: 'sidhant', // Add author field
          media_url: tweet.attachments?.media_keys?.[0] 
            ? response.data.includes?.media?.find((m: TwitterMedia) => m.media_key === tweet.attachments?.media_keys?.[0])?.url || null
            : null
        }))
      : [];

    return NextResponse.json({
      tweets,
      timeUntilRefresh: COOLDOWN_DURATION,
      canRefresh: false,
      lastRefreshTime
    });
  } catch (error: unknown) {
    const err = error as Error & { 
      response?: { 
        status?: number; 
        data?: { detail?: string } 
      } 
    };
    
    console.error('[TWITTER API] Error fetching tweets:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });

    // If we hit Twitter's rate limit, set our cooldown
    if (err.response?.status === 429) {
      lastRefreshTime = currentTime;
      console.log('[GLOBAL TIMER] Rate limited, reset timer:', {
        timestamp: lastRefreshTime,
        readableTime: new Date(lastRefreshTime * 1000).toISOString(),
        nextRefreshAt: new Date((lastRefreshTime + COOLDOWN_DURATION) * 1000).toISOString()
      });
    }

    // Return a more specific error message
    return NextResponse.json(
      { 
        error: 'Failed to fetch tweets',
        details: err.response?.data?.detail || err.message,
        tweets: mockTweets, // Return mock tweets on error
        timeUntilRefresh: remainingTime,
        canRefresh: false,
        lastRefreshTime
      },
      { status: 200 } // Return 200 instead of error code to prevent console errors
    );
  }
} 