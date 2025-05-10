# India-Pakistan News Monitor

A responsive web application that aggregates and displays the latest news about the India-Pakistan situation from Google News and specific Twitter handles.

## Features

- **Google News Section**: Fetches and displays the latest news articles from Google News about the India-Pakistan situation.
- **Twitter Updates**: Shows tweets from specific handles (@ndtv, @ANI, @PTIofficial, @BBCWorld) with rephrased content using a free LLM.
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop devices.
- **Fast Loading**: Optimized for performance with minimal load times.
- **Toggle Original/Rephrased**: Toggle between original and rephrased tweets.

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **API Handling**: Axios
- **Text Processing**: Hugging Face API (for rephrasing)
- **Data Sources**: Google News RSS, Twitter API

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/india-pakistan-news.git
cd india-pakistan-news
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:
```
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## API Routes

- `/api/google-news` - Fetches news articles from Google News
- `/api/twitter` - Fetches and rephrases tweets from specified handles

## Deployment

This application can be easily deployed to Vercel or any other Next.js-compatible hosting platform.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/yourusername/india-pakistan-news)

## License

[MIT](LICENSE)

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Google News](https://news.google.com/)
- [Twitter API](https://developer.twitter.com/en/docs/twitter-api)
- [Hugging Face](https://huggingface.co/)
