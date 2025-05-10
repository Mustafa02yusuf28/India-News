'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

interface TwitterContextType {
  tweets: Tweet[];
  loading: boolean;
  error: string | null;
  timeUntilRefresh: number;
  canRefresh: boolean;
}

const TwitterContext = createContext<TwitterContextType | undefined>(undefined);

const COOLDOWN_DURATION = 15 * 60; // 15 minutes in seconds
const TWITTER_USER_ID = '25073877'; // @sidhant's Twitter ID

// Get last refresh time from localStorage
const getLastRefreshTime = (): number | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('lastRefreshTime');
  return stored ? parseInt(stored, 10) : null;
};

// Save last refresh time to localStorage
const saveLastRefreshTime = (timestamp: number) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lastRefreshTime', timestamp.toString());
};

export function TwitterProvider({ children }: { children: React.ReactNode }) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(getLastRefreshTime());
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(0);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/twitter');
      setTweets(response.data.tweets || []);
      const currentTime = Math.floor(Date.now() / 1000);
      setLastRefreshTime(currentTime);
      saveLastRefreshTime(currentTime);
    } catch (err: any) {
      console.error('Error fetching tweets:', err);
      setError(err.response?.data?.details || 'Failed to load tweets. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Check cooldown status every second
  useEffect(() => {
    const checkCooldown = () => {
      if (!lastRefreshTime) {
        setTimeUntilRefresh(0);
        return;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeSinceLastRefresh = currentTime - lastRefreshTime;
      const remainingTime = Math.max(0, COOLDOWN_DURATION - timeSinceLastRefresh);
      
      setTimeUntilRefresh(remainingTime);

      // If cooldown is over, fetch new tweets
      if (remainingTime === 0 && !loading) {
        fetchTweets();
      }
    };

    // Initial check
    checkCooldown();

    // Set up interval
    const timer = setInterval(checkCooldown, 1000);
    return () => clearInterval(timer);
  }, [lastRefreshTime, loading]);

  // Initial fetch if no cooldown
  useEffect(() => {
    if (!lastRefreshTime) {
      fetchTweets();
    }
  }, []);

  const value = {
    tweets,
    loading,
    error,
    timeUntilRefresh,
    canRefresh: timeUntilRefresh === 0
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