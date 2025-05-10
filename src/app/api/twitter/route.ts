import { NextResponse } from 'next/server';
import axios from 'axios';

const TWITTER_API_URL = 'https://api.twitter.com/2';
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const TWITTER_USER_ID = '25073877'; // @sidhant's Twitter ID
const COOLDOWN_DURATION = 15 * 60; // 15 minutes in seconds

// In-memory cache for last refresh time
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

export async function GET() {
  if (!TWITTER_BEARER_TOKEN) {
    console.error('Twitter Bearer Token is not configured');
    return NextResponse.json(
      { error: 'Twitter API is not configured properly' },
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
    currentTime: new Date(currentTime * 1000).toISOString(),
    lastRefreshTime: lastRefreshTime ? new Date(lastRefreshTime * 1000).toISOString() : 'None',
    timeSinceLastRefresh,
    remainingTime,
    canRefresh,
    nextRefreshAt: lastRefreshTime 
      ? new Date((lastRefreshTime + COOLDOWN_DURATION) * 1000).toISOString()
      : 'Now'
  });

  // Return cooldown response if timer is active
  if (!canRefresh) {
    return NextResponse.json(
      { 
        error: 'Rate limit cooldown active',
        details: `Please wait ${Math.ceil(remainingTime / 60)} minutes before trying again`,
        tweets: [],
        timeUntilRefresh: remainingTime,
        canRefresh: false,
        lastRefreshTime
      },
      { status: 429 }
    );
  }

  try {
    console.log('Fetching tweets for user:', TWITTER_USER_ID);
    const response = await axios.get(
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

    console.log('Twitter API response:', response.data);

    // Update last refresh time
    lastRefreshTime = currentTime;
    console.log('[GLOBAL TIMER] Updated:', {
      timestamp: lastRefreshTime,
      readableTime: new Date(lastRefreshTime * 1000).toISOString(),
      nextRefreshAt: new Date((lastRefreshTime + COOLDOWN_DURATION) * 1000).toISOString()
    });

    // Process tweets to include media URLs and author field
    const tweets = response.data.data && response.data.data.length > 0
      ? response.data.data.map((tweet: any) => ({
          ...tweet,
          author: 'sidhant', // Add author field
          media_url: tweet.attachments?.media_keys?.[0] 
            ? response.data.includes?.media?.find((m: any) => m.media_key === tweet.attachments.media_keys[0])?.url
            : null
        }))
      : [];

    return NextResponse.json({
      tweets,
      timeUntilRefresh: COOLDOWN_DURATION,
      canRefresh: false,
      lastRefreshTime
    });
  } catch (error: any) {
    console.error('Error fetching tweets:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // If we hit Twitter's rate limit, set our cooldown
    if (error.response?.status === 429) {
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
        details: error.response?.data?.detail || error.message,
        tweets: [],
        timeUntilRefresh: remainingTime,
        canRefresh: false,
        lastRefreshTime
      },
      { status: error.response?.status || 500 }
    );
  }
} 