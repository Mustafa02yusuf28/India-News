'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  media_url?: string | null;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

interface TwitterResponse {
  tweets: Tweet[];
  timeUntilRefresh?: number;
  canRefresh?: boolean;
  error?: string;
  details?: string;
}

interface TwitterContextType {
  tweets: Tweet[];
  loading: boolean;
  error: string | null;
  timeUntilRefresh: number;
  canRefresh: boolean;
  lastRefreshTime: number | null;
  fetchTweets: () => Promise<void>;
}

const TwitterContext = createContext<TwitterContextType | undefined>(undefined);

const COOLDOWN_DURATION = 15 * 60; // 15 minutes in seconds

// Get last refresh time from localStorage
const getLastRefreshTime = (): number | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('lastRefreshTime');
  if (!stored) {
    // If no stored time, set it to now to start the cooldown
    const now = Math.floor(Date.now() / 1000);
    localStorage.setItem('lastRefreshTime', now.toString());
    console.log('Initializing user timer:', {
      timestamp: now,
      readableTime: new Date(now * 1000).toISOString(),
      cooldownDuration: COOLDOWN_DURATION
    });
    return now;
  }
  const time = parseInt(stored, 10);
  console.log('Retrieved user timer:', {
    timestamp: time,
    readableTime: new Date(time * 1000).toISOString(),
    timeSinceLastRefresh: Math.floor(Date.now() / 1000) - time
  });
  return time;
};

// Save last refresh time to localStorage
const saveLastRefreshTime = (timestamp: number) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lastRefreshTime', timestamp.toString());
  console.log('Updated user timer:', {
    timestamp: timestamp,
    readableTime: new Date(timestamp * 1000).toISOString(),
    cooldownEnds: new Date((timestamp + COOLDOWN_DURATION) * 1000).toISOString()
  });
};

export function TwitterProvider({ children }: { children: React.ReactNode }) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(getLastRefreshTime());
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(COOLDOWN_DURATION);

  // Calculate if we can refresh
  const canRefresh = !lastRefreshTime || 
    (Math.floor(Date.now() / 1000) - lastRefreshTime) >= COOLDOWN_DURATION;

  const fetchTweets = async () => {
    // Double check if we can refresh
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceLastRefresh = lastRefreshTime ? currentTime - lastRefreshTime : COOLDOWN_DURATION;
    const canRefreshNow = timeSinceLastRefresh >= COOLDOWN_DURATION;

    console.log('Refresh attempt:', {
      currentTime: new Date(currentTime * 1000).toISOString(),
      lastRefreshTime: lastRefreshTime ? new Date(lastRefreshTime * 1000).toISOString() : 'Never',
      timeSinceLastRefresh,
      canRefreshNow
    });

    if (!canRefreshNow) {
      const remainingTime = COOLDOWN_DURATION - timeSinceLastRefresh;
      setError(`Please wait ${Math.ceil(remainingTime / 60)} minutes before refreshing again`);
      console.log('Refresh blocked:', {
        remainingTime,
        nextRefreshTime: new Date((currentTime + remainingTime) * 1000).toISOString()
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<TwitterResponse>('/api/twitter');
      
      if (response.data.tweets) {
        setTweets(response.data.tweets);
        setLastRefreshTime(currentTime);
        saveLastRefreshTime(currentTime);
        console.log('Tweets fetched successfully:', {
          timestamp: currentTime,
          readableTime: new Date(currentTime * 1000).toISOString(),
          tweetCount: response.data.tweets.length
        });
      } else {
        throw new Error('Invalid response format from Twitter API');
      }
    } catch (err) {
      const error = err as AxiosError<TwitterResponse>;
      console.error('Error fetching tweets:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        timestamp: new Date().toISOString()
      });
      if (error.response?.status === 429) {
        setError('Rate limit exceeded. Please wait 15 minutes before trying again.');
        // Force cooldown on rate limit
        setLastRefreshTime(currentTime);
        saveLastRefreshTime(currentTime);
      } else {
        setError(error.response?.data?.details || 'Failed to load tweets. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize timers and check cooldown status every second
  useEffect(() => {
    const checkCooldown = () => {
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (!lastRefreshTime) {
        setTimeUntilRefresh(COOLDOWN_DURATION);
        console.log('No last refresh time, using full cooldown:', {
          currentTime: new Date(currentTime * 1000).toISOString(),
          cooldownDuration: COOLDOWN_DURATION
        });
        return;
      }

      const timeSinceLastRefresh = currentTime - lastRefreshTime;
      const remainingTime = Math.max(0, COOLDOWN_DURATION - timeSinceLastRefresh);
      
      setTimeUntilRefresh(remainingTime);

      // Log timer status every 5 seconds to avoid console spam
      if (remainingTime % 5 === 0) {
        console.log('Timer status:', {
          currentTime: new Date(currentTime * 1000).toISOString(),
          lastRefreshTime: new Date(lastRefreshTime * 1000).toISOString(),
          timeSinceLastRefresh,
          remainingTime,
          nextRefreshTime: new Date((lastRefreshTime + COOLDOWN_DURATION) * 1000).toISOString()
        });
      }
    };

    // Initial check
    checkCooldown();

    // Set up interval
    const timer = setInterval(checkCooldown, 1000);
    return () => clearInterval(timer);
  }, [lastRefreshTime]);

  const value = {
    tweets,
    loading,
    error,
    timeUntilRefresh,
    canRefresh,
    lastRefreshTime,
    fetchTweets
  };

  return (
    <TwitterContext.Provider value={value}>
      {children}
    </TwitterContext.Provider>
  );
}

export function useTwitter() {
  const context = useContext(TwitterContext);
  if (context === undefined) {
    throw new Error('useTwitter must be used within a TwitterProvider');
  }
  return context;
} 