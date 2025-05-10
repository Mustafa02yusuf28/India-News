'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author: string;
}

export default function TwitterSection() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [showAllTweets, setShowAllTweets] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchTweets = async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        // Fetch data from API that serves the same cached data to all users
        const response = await axios.get('/api/twitter');
        console.log('Response received:', response.data); // Log the response data
        if (response.data.tweets.length > 0 || tweets.length === 0) {
          setTweets(response.data.tweets);
        }
        const now = new Date();
        const formattedTime = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        setLastUpdated(formattedTime);
        setError('');
      } catch (err) {
        console.error('Error fetching tweets:', err);
        if (tweets.length === 0) {
          setError('Failed to load tweets. Updates will be attempted automatically.');
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    };
    fetchTweets();
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchTweets(false);
      }
    }, 300000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastUpdated) {
        const lastUpdateTime = new Date(lastUpdated).getTime();
        const now = new Date().getTime();
        const minutesSinceLastUpdate = (now - lastUpdateTime) / 60000;
        if (minutesSinceLastUpdate > 5) {
          fetchTweets(false);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tweets.length, lastUpdated]);

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

  if (error && tweets.length === 0) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded shadow-sm">
        <p className="text-red-700 dark:text-red-400">{error}</p>
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
        {lastUpdated && (
          <div className="datetime-display">
            <span className="uppercase">Updated: {lastUpdated}</span>
            {loading && <span className="ml-2 italic text-xs">Refreshing...</span>}
          </div>
        )}
      </div>
      
      {tweets.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No tweets available.</p>
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