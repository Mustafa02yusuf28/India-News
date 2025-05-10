import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import axios from 'axios';

const parser = new Parser();

// Keywords that indicate significant developments
const ALERT_KEYWORDS = [
  'breaking', 'alert', 'urgent', 'just in', 'latest',
  'escalation', 'attack', 'conflict', 'border', 'violation',
  'military', 'tension', 'ceasefire', 'fire', 'incident',
  'war', 'crisis', 'missile', 'casualties', 'killed',
  'wounded', 'skirmish', 'troops', 'movement', 'deployment',
  'statement', 'official', 'minister', 'prime minister', 'president',
  'army', 'air force', 'navy', 'loc', 'line of control'
];

export async function GET() {
  try {
    // Google News RSS feed for India-Pakistan related news - using more specific search terms
    const feedUrl = 'https://news.google.com/rss/search?q=india+pakistan+conflict+war+relations+military+tension&hl=en-US&gl=US&ceid=US:en';
    
    // Fetch the RSS feed
    const feed = await parser.parseURL(feedUrl);
    
    // Filter for relevant articles
    const filteredArticles = feed.items.filter(item => {
      const title = item.title?.toLowerCase() || '';
      const content = item.contentSnippet?.toLowerCase() || '';
      
      // Check if the article is about India-Pakistan relations
      const hasIndia = title.includes('india') || content.includes('india');
      const hasPakistan = title.includes('pakistan') || content.includes('pakistan');
      
      // Check for alert keywords to find important updates
      const hasAlertKeywords = ALERT_KEYWORDS.some(keyword => 
        title.includes(keyword.toLowerCase()) || content.includes(keyword.toLowerCase())
      );
      
      // Must be about both countries and contain at least one alert keyword
      return hasIndia && hasPakistan && hasAlertKeywords;
    });
    
    // Add a relevance score to each article
    const scoredArticles = filteredArticles.map(item => {
      const title = item.title?.toLowerCase() || '';
      const content = item.contentSnippet?.toLowerCase() || '';
      let score = 0;
      
      // Score based on alert keywords
      ALERT_KEYWORDS.forEach(keyword => {
        if (title.includes(keyword.toLowerCase())) score += 2; // Keywords in title are more important
        if (content.includes(keyword.toLowerCase())) score += 1;
      });
      
      // Prioritize breaking news
      const isBreaking = 
        title.includes('breaking') || 
        title.includes('alert') || 
        title.includes('urgent') ||
        title.includes('just in');
        
      if (isBreaking) score += 5;
      
      // Recent news gets higher score
      const pubDate = new Date(item.pubDate || new Date());
      const ageInHours = (new Date().getTime() - pubDate.getTime()) / (1000 * 60 * 60);
      if (ageInHours < 6) score += 3;  // Less than 6 hours old
      else if (ageInHours < 24) score += 2;  // Less than 1 day old
      else if (ageInHours < 48) score += 1;  // Less than 2 days old
      
      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        source: item.source?.name || extractSourceFromTitle(item.title || ''),
        content: item.contentSnippet,
        score: score,
        isBreaking: isBreaking
      };
    });
    
    // Sort by score and then by date if scores are equal
    scoredArticles.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime();
    });
    
    // Get the top 10 most relevant articles
    const articles = scoredArticles.slice(0, 10);
    
    return NextResponse.json({ articles }, { status: 200 });
  } catch (error) {
    console.error('Error fetching Google News:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

// Helper function to extract source from Google News title format
function extractSourceFromTitle(title: string): string {
  // Google News format is often "Headline - Source"
  const parts = title.split(' - ');
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  return 'Google News';
} 