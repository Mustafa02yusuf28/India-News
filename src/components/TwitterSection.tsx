'use client';

import { formatDistanceToNow } from 'date-fns';
import { useTwitter } from '../context/TwitterContext';
import Image from 'next/image';

export default function TwitterSection() {
  const { tweets, loading, error, timeUntilRefresh, canRefresh, fetchTweets } = useTwitter();

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTweetDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown time';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Unknown time';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Twitter Updates</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">@sidhant</p>
        </div>
        <div className="flex items-center gap-4">
          {!canRefresh ? (
            <div className="text-right bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <span className="text-sm text-gray-500 dark:text-gray-400 block">
                Next update available in:
              </span>
              <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                {formatCountdown(timeUntilRefresh)}
              </span>
            </div>
          ) : (
            <button
              onClick={fetchTweets}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Refreshing...' : 'Refresh Tweets'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : tweets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No tweets available</p>
          {canRefresh && (
            <button
              onClick={fetchTweets}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Load Tweets
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <div
              key={tweet.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <p className="text-gray-800 dark:text-gray-200 mb-2 whitespace-pre-wrap">{tweet.text}</p>
              {tweet.media_url && (
                <div className="mt-2 mb-2">
                  <Image
                    src={tweet.media_url}
                    alt="Tweet media"
                    width={500}
                    height={300}
                    className="rounded-lg"
                  />
                </div>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>{formatTweetDate(tweet.created_at)}</span>
                {tweet.public_metrics && (
                  <div className="flex gap-4">
                    <span>❤️ {tweet.public_metrics.like_count}</span>
                    <span>🔄 {tweet.public_metrics.retweet_count}</span>
                    <span>💬 {tweet.public_metrics.reply_count}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 