import { NextResponse } from 'next/server';
import axios from 'axios';

// Twitter handle to track
const TWITTER_HANDLE = 'sidhant';

// Define tweet interface
interface RawTweet {
  id: string;
  text: string;
  created_at: string;
  author: string;
}

// Simple in-memory rate limiter
let lastTwitterApiCallTime = 0;
const TWITTER_RATE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

// Get real tweets if possible, or fall back to mock data
async function getTweets(): Promise<RawTweet[]> {
  // Check if we're within the rate limit
  const now = Date.now();
  const timeSinceLastCall = now - lastTwitterApiCallTime;
  
  // If we've called the API within the last 15 minutes, use mock data
  if (timeSinceLastCall < TWITTER_RATE_LIMIT_MS) {
    const minutesRemaining = Math.ceil((TWITTER_RATE_LIMIT_MS - timeSinceLastCall) / 60000);
    console.log(`Rate limit: Using mock data. Can call API again in ${minutesRemaining} minutes.`);
    return getMockTweets();
  }
  
  // If we have Twitter API credentials, try to get real tweets
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  
  if (bearerToken) {
    try {
      // Mark the time of this API call for rate limiting
      lastTwitterApiCallTime = now;
      console.log(`Making Twitter API call at ${new Date().toISOString()}`);
      
      // Using Twitter API v2 to get user tweets
      const userId = await getUserId(TWITTER_HANDLE, bearerToken);
      
      // Use a more informative message without throwing an error
      if (!userId) {
        console.log(`No user ID found for handle @${TWITTER_HANDLE}, using mock data instead`);
        return getMockTweets();
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
          console.log(`Successfully fetched ${response.data.data.length} tweets from Twitter API`);
          return response.data.data.map((tweet: { id: string; text: string; created_at: string }) => ({
            id: tweet.id,
            text: tweet.text,
            created_at: tweet.created_at,
            author: TWITTER_HANDLE
          }));
        } else {
          console.log('No tweets found in Twitter API response, using mock data');
          return getMockTweets();
        }
      } catch (fetchError: unknown) {
        if (fetchError instanceof Error) {
          console.error('Error fetching tweets from Twitter API:', fetchError.message);
        } else {
          console.error('Unknown error fetching tweets from Twitter API');
        }
        return getMockTweets();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error in Twitter API process:', error.message);
      } else {
        console.error('Unknown error in Twitter API process');
      }
      // Fall back to mock data
      return getMockTweets();
    }
  } else {
    console.log('No Twitter API bearer token found in environment variables, using mock data');
    return getMockTweets();
  }
}

// Return mock tweets for development/fallback
function getMockTweets(): RawTweet[] {
  console.log('Using mock tweets data');
  return [
    {
      id: 'tweet-sidhant-1',
      text: 'Breaking: Indian and Pakistani officials set to meet next week to discuss bilateral relations. Sources say dialogue channels remain open despite recent tensions.',
      created_at: new Date().toISOString(),
      author: TWITTER_HANDLE
    },
    {
      id: 'tweet-sidhant-2',
      text: 'Indian military increases presence along LoC following reports of movement on Pakistani side. Defence Ministry calls it "routine redeployment".',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      author: TWITTER_HANDLE
    },
    {
      id: 'tweet-sidhant-3',
      text: 'Sources tell me trade between India-Pakistan through Wagah border continues despite political tensions. Essential goods continue to flow.',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      author: TWITTER_HANDLE
    },
    {
      id: 'tweet-sidhant-4',
      text: "Pakistan's PM addresses UN General Assembly tomorrow, expected to raise Kashmir issue. Indian delegation prepared with response.",
      created_at: new Date(Date.now() - 10800000).toISOString(),
      author: TWITTER_HANDLE
    }
  ];
}

// Helper function to get Twitter user ID from username
async function getUserId(username: string, bearerToken: string): Promise<string | null> {
  try {
    console.log(`Attempting to fetch user ID for @${username}`);
    const response = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      }
    );
    
    if (response.data.data && response.data.data.id) {
      console.log(`Found user ID: ${response.data.data.id} for @${username}`);
      return response.data.data.id;
    }
    console.log(`No user data found for @${username}`);
    return null;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(`Twitter API error (${error.response?.status || 'unknown'}): ${error.message}`);
      if (error.response?.data) {
        console.error('Twitter API response:', JSON.stringify(error.response.data));
      }
    } else if (error instanceof Error) {
      console.error('Error finding user ID:', error.message);
    } else {
      console.error('Unknown error finding user ID');
    }
    return null;
  }
}

export async function GET() {
  try {
    // Get tweets (real or mock)
    const tweets = await getTweets();
    
    // Sort by date (newest first)
    tweets.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ tweets }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in Twitter API route:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch tweets', message: errorMessage },
      { status: 500 }
    );
  }
} 