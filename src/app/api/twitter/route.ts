import { NextResponse } from 'next/server';
import axios from 'axios';

const TWITTER_API_URL = 'https://api.twitter.com/2';
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const TWITTER_USER_ID = '25073877'; // @sidhant's Twitter ID

export async function GET() {
  if (!TWITTER_BEARER_TOKEN) {
    console.error('Twitter Bearer Token is not configured');
    return NextResponse.json(
      { error: 'Twitter API is not configured properly' },
      { status: 500 }
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
        },
      }
    );

    console.log('Twitter API response:', response.data);

    if (!response.data.data || response.data.data.length === 0) {
      return NextResponse.json({ tweets: [] });
    }

    return NextResponse.json({
      tweets: response.data.data
    });
  } catch (error: any) {
    console.error('Error fetching tweets:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // Return a more specific error message
    return NextResponse.json(
      { 
        error: 'Failed to fetch tweets',
        details: error.response?.data?.detail || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
} 