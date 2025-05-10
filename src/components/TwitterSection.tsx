'use client';

import { formatDistanceToNow } from 'date-fns';
import { useTwitter } from '../context/TwitterContext';

export default function TwitterSection() {
  const { tweets, loading, error, timeUntilRefresh, canRefresh } = useTwitter();

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTweetDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown time';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Unknown time';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Twitter Updates</h2>
        {!canRefresh && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Please wait {formatCountdown(timeUntilRefresh)} for next update
          </span>
        )}
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
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tweets available</p>
      ) : (
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <div
              key={tweet.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <p className="text-gray-800 dark:text-gray-200 mb-2">{tweet.text}</p>
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