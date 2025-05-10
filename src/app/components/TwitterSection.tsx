'use client';

import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author: string;
}

interface TwitterResponse {
  tweets: Tweet[];
  timeUntilRefresh: number;
  canRefresh: boolean;
  error?: string;
  details?: string;
}

export default function TwitterSection() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAllTweets, setShowAllTweets] = useState(false);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(15 * 60); // Start with 15 minutes
  const [canRefresh, setCanRefresh] = useState(false);

  // Format countdown for display
  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Move fetchTweets to top-level so it can be used in useEffect and as a handler
  const fetchTweets = async (showLoading = true) => {
    try { 
      // Only proceed if we can refresh - double check here
      if (!canRefresh) {
        console.log('Fetch prevented - timer not expired yet');
        setError(`Please wait ${formatCountdown(timeUntilRefresh)} before refreshing again`);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }
      
      // Fetch data from API that serves the same cached data to all users
      const response = await axios.get<TwitterResponse>('/api/twitter');
      console.log('Response received:', response.data); // Log the response data
      
      // Update timer and refresh status
      if (response.data.timeUntilRefresh !== undefined) {
        setTimeUntilRefresh(response.data.timeUntilRefresh);
        console.log('Client timer updated:', {
          timeUntilRefresh: response.data.timeUntilRefresh,
          canRefresh: response.data.canRefresh
        });
      }
      
      if (response.data.canRefresh !== undefined) {
        setCanRefresh(response.data.canRefresh);
      }
      
      // Update tweets if we have them
      if (response.data.tweets && (response.data.tweets.length > 0 || tweets.length === 0)) {
        setTweets(response.data.tweets);
      }
      
      setError('');
    } catch (err) {
      const error = err as AxiosError<TwitterResponse>;
      console.error('Error fetching tweets:', error);
      
      // Update the timer even on error if available
      if (error.response?.data?.timeUntilRefresh !== undefined) {
        setTimeUntilRefresh(error.response.data.timeUntilRefresh);
        console.log('Client timer updated from error response:', {
          timeUntilRefresh: error.response.data.timeUntilRefresh,
          canRefresh: error.response.data.canRefresh
        });
      }
      
      if (error.response?.data?.canRefresh !== undefined) {
        setCanRefresh(error.response.data.canRefresh);
      }
      
      if (tweets.length === 0) {
        setError(error.response?.data?.details || 'Failed to load tweets. Please click refresh when timer completes.');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // ONLY update the timer - NO automatic API calls on mount
  useEffect(() => {
    // Set up interval to update timer every second
    const timerIntervalId = setInterval(() => {
      setTimeUntilRefresh(prev => {
        // If timer reaches 0, allow refresh
        if (prev <= 1) {
          setCanRefresh(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Log the initial timer state
    console.log('Timer initialized:', {
      timeUntilRefresh,
      canRefresh,
      currentTime: new Date().toISOString()
    });
    
    return () => {
      clearInterval(timerIntervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Function to format date consistently
  const formatTweetDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  };

  // Get all tweets in a flat array, sorted by date (newest first)
  const allTweetsSorted = tweets.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Get top 3 latest tweets
  const latestTweets = allTweetsSorted.slice(0, 3);
  
  // Get remaining tweets
  const remainingTweets = allTweetsSorted.slice(3);

  if (loading && tweets.length === 0) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex justify-between items-center text-bloomberg-xs text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center">
            <span className="inline-block w-1 h-3 bg-orange-500 dark:bg-orange-500 mr-1"></span>
            <span className="uppercase font-semibold tracking-wider">Source: <a href="https://x.com/sidhant" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 no-underline">@sidhant</a></span>
          </div>
          <div className="text-right bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <span className="text-sm text-gray-500 dark:text-gray-400 block">
              Next update available in:
            </span>
            <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
              {formatCountdown(timeUntilRefresh)}
            </span>
          </div>
        </div>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="tweet-card animate-pulse">
            <div className="flex justify-between items-center mb-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
            <div className="mb-4 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const renderTweet = (tweet: Tweet, index: number) => {
    const tweetTime = formatTweetDate(tweet.created_at).time;
    return (
      <div 
        key={tweet.id} 
        className="tweet-card fade-in"
        style={{animationDelay: `${index * 0.1}s`}}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="bg-black text-white px-3 py-1 rounded-sm">
            <span className="text-bloomberg-xs">@{tweet.author.toUpperCase()}</span>
          </div>
          <span className="datetime-display">{tweetTime}</span>
        </div>
        
        <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
          {tweet.text}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-bloomberg-xs text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center">
          <span className="inline-block w-1 h-3 bg-orange-500 dark:bg-orange-500 mr-1"></span>
          <span className="uppercase font-semibold tracking-wider">Source: <a href="https://x.com/sidhant" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 no-underline">@sidhant</a></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <span className="text-sm text-gray-500 dark:text-gray-400 block">
              Next update available in:
            </span>
            <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
              {formatCountdown(timeUntilRefresh)}
            </span>
          </div>
          <button
            onClick={() => fetchTweets()}
            disabled={!canRefresh || loading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              (!canRefresh || loading)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? 'Refreshing...' : 'Refresh Tweets'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded shadow-sm mb-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {tweets.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No tweets available.</p>
          {canRefresh && (
            <button
              onClick={() => fetchTweets()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Load Tweets
            </button>
          )}
          {!canRefresh && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please wait for the timer to complete before loading tweets.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Latest 3 tweets */}
          <div className="space-y-6">
            {latestTweets.map((tweet, index) => renderTweet(tweet, index))}
          </div>
          
          {/* Show more tweets button */}
          {remainingTweets.length > 0 && (
            <div className="pt-2">
              <button 
                onClick={() => setShowAllTweets(!showAllTweets)}
                className="flex items-center w-full justify-between py-3 px-4 bg-gray-100 dark:bg-gray-800 text-bloomberg-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded"
              >
                <span className="flex items-center">
                  <span className="inline-block w-1 h-3 bg-orange-500 mr-2"></span>
                  {showAllTweets ? 'SHOW LESS' : `SHOW ${remainingTweets.length} MORE UPDATES`}
                </span>
                <span>{showAllTweets ? '▲' : '▼'}</span>
              </button>
              
              {/* Remaining tweets - scrollable container */}
              {showAllTweets && (
                <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden shadow-sm">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-bloomberg-xs text-gray-700 dark:text-gray-300">{remainingTweets.length} OLDER UPDATES</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Scroll to view all</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 p-4 space-y-6 bg-white dark:bg-[rgb(var(--background-rgb))]">
                    {remainingTweets.map((tweet, index) => renderTweet(tweet, index + 3))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 