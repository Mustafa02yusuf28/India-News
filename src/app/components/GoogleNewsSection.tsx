'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  content?: string;
  score?: number;
  isBreaking?: boolean;
}

export default function GoogleNewsSection() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch data on component mount
  useEffect(() => {
    const fetchNews = async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        // Fetch data from API that serves the same cached data to all users
        const response = await axios.get('/api/google-news');
        const newArticles = response.data.articles;
        if (newArticles.length > 0 || articles.length === 0) {
          setArticles(newArticles);
        }
        const now = new Date();
        const formattedDate = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        setLastUpdated(formattedDate);
        setError('');
      } catch (err) {
        console.error('Error fetching news:', err);
        if (articles.length === 0) {
          setError('Failed to load news. Updates will be attempted automatically.');
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    };
    fetchNews();
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNews(false);
      }
    }, 300000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastUpdated) {
        const lastUpdateTime = new Date(lastUpdated).getTime();
        const now = new Date().getTime();
        const minutesSinceLastUpdate = (now - lastUpdateTime) / 60000;
        if (minutesSinceLastUpdate > 5) {
          fetchNews(false);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [articles.length, lastUpdated]);

  if (loading && articles.length === 0) {
    return (
      <div className="animate-pulse space-y-6">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="news-card animate-pulse">
            {index === 0 && (
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
            )}
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="flex justify-between items-center mt-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded shadow-sm">
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Function to format publication date consistently
  const formatArticleDate = (dateString: string) => {
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

  return (
    <div className="space-y-6">
      {lastUpdated && (
        <div className="text-bloomberg-xs text-gray-500 dark:text-gray-400 flex items-center mb-4">
          <span className="inline-block w-1 h-3 bg-gray-300 dark:bg-gray-700 mr-1"></span>
          <span className="uppercase font-semibold tracking-wider">Last Updated: {lastUpdated}</span>
          {loading && <span className="ml-2 italic text-xs">Refreshing...</span>}
        </div>
      )}
      
      {articles.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No alerts available.</p>
      ) : (
        <div className="space-y-6">
          {articles.map((article, index) => {
            const formattedDate = formatArticleDate(article.pubDate);
            return (
              <div 
                key={index} 
                className="news-card fade-in"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                {article.isBreaking && (
                  <div className="mb-3">
                    <span className="breaking-badge">
                      Breaking
                    </span>
                  </div>
                )}
                
                <h3 className="text-bloomberg-title mb-3">
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 no-underline border-b border-gray-400 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-400"
                  >
                    {article.title}
                  </a>
                </h3>
                
                <div className="flex flex-wrap justify-between items-center text-bloomberg-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="source-badge">{article.source}</span>
                  <span className="datetime-display">{formattedDate.date} | {formattedDate.time}</span>
                </div>
                
                {article.content && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mt-2">{article.content}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 