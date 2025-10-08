# TrendFeed Backend - AI Zeitgeist Engine

This is the backend API for TrendFeed, implementing the AI Zeitgeist Engine for real-time AI trend analysis using free data sources.

## Features

- **Real-time Data Ingestion** from multiple free sources:
  - Reddit API (r/MachineLearning, r/artificial, etc.)
  - GitHub API (trending repositories)
  - arXiv API (academic papers)
  - RSS Feeds (TechCrunch, The Verge, etc.)

- **Advanced Keyword Processing**:
  - Named Entity Recognition
  - Keyphrase Extraction
  - Topic Modeling
  - Trend Normalization

- **Sophisticated Scoring Algorithm**:
  - Volume (mention count)
  - Velocity (growth rate)
  - Source Authority (weighted by source credibility)
  - Source Diversity (cross-platform mentions)
  - Sentiment Analysis

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the backend directory:

```env
# Supabase Configuration (already configured)
SUPABASE_URL=https://hjmbrmdpvcrzthkxwjhm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbWJybWRwdmNyenRoa3h3amhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTUyMDYsImV4cCI6MjA3NDc5MTIwNn0.5VzmIJlwp_o6q7jthr4gbh5aeiTHLazi6Osmzv9Ef4U

# Optional: Reddit API (for higher rate limits)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=TrendFeed/1.0

# Optional: GitHub Token (for higher rate limits)
GITHUB_TOKEN=your_github_token

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Set Up Database

Run the database schema in your Supabase SQL editor:

```sql
-- Copy and paste the contents of database/schema.sql
```

### 4. Start the Server

```bash
# Start the API server
npm start

# In another terminal, start the data ingestion worker
npm run worker
```

### 5. Test the API

```bash
# Health check
curl http://localhost:3001/api/health

# Get daily trends
curl http://localhost:3001/api/trends/daily

# Get trends for specific domain
curl http://localhost:3001/api/trends/daily/인공지능%2F머신러닝
```

## API Endpoints

### GET /api/health
Health check endpoint

### GET /api/trends/daily
Get top 10 daily trends across all domains

### GET /api/trends/daily/:domain
Get trends for a specific domain

### GET /api/sources
Get available data sources and their status

### POST /api/agents/:agentId/refresh
Manually trigger data refresh for an agent

### GET /api/ingestion/status
Get data ingestion statistics

## Data Sources

### Free Sources (No Billing Required)

1. **Reddit API** (Free)
   - Subreddits: r/MachineLearning, r/artificial, r/compsci, etc.
   - Rate limit: 60 requests/minute
   - Requires: Reddit app registration (free)

2. **GitHub API** (Free)
   - Trending repositories by topic
   - Rate limit: 60 requests/hour (5000 with token)
   - No authentication required for public repos

3. **arXiv API** (Free)
   - Academic papers in AI/ML categories
   - No rate limits
   - No authentication required

4. **RSS Feeds** (Free)
   - TechCrunch AI, The Verge AI, Towards Data Science
   - No rate limits
   - No authentication required

### Optional Paid Sources

- **NewsAPI** (Free tier: 100 requests/day)
- **X/Twitter API** (Paid)
- **Hugging Face API** (Free for most usage)

## Architecture

```
Frontend (HTML/CSS/JS) 
    ↓
Backend API (Node.js/Express)
    ↓
Data Ingestion Workers
    ↓
Free Data Sources (Reddit, GitHub, arXiv, RSS)
    ↓
Supabase Database
```

## Data Flow

1. **Ingestion**: Workers collect data from free sources every 1-6 hours
2. **Processing**: Keywords are extracted using NLP techniques
3. **Scoring**: Trends are scored using the TrendScore algorithm
4. **Storage**: Results are stored in Supabase
5. **API**: Frontend fetches real-time trends via REST API

## Development

### Adding New Sources

1. Create a new source class in `workers/sources/`
2. Add configuration to `config.js`
3. Update the ingestion worker
4. Add database schema if needed

### Modifying Scoring Algorithm

Edit the `calculateTrendScores()` method in `workers/dataIngestion.js` to adjust the TrendScore formula.

## Monitoring

Check the console output for:
- ✅ Successful data ingestion
- ❌ API errors or rate limits
- 📊 Keyword processing statistics
- 🔄 Scheduled job execution

## Troubleshooting

### Common Issues

1. **Reddit API Errors**: Check client ID/secret in .env
2. **GitHub Rate Limits**: Add GitHub token to .env
3. **Database Errors**: Ensure schema is properly set up
4. **CORS Issues**: Frontend and backend must be on same domain or configure CORS

### Logs

- API server logs: Console output
- Worker logs: Console output with timestamps
- Database logs: Supabase dashboard

## Performance

- **Data Volume**: ~100-500 articles per day from free sources
- **Processing Time**: ~5-10 minutes for keyword extraction
- **API Response**: <200ms for trend queries
- **Storage**: ~1MB per day of raw data

## Security

- No sensitive data stored
- API keys in environment variables
- Rate limiting on external APIs
- Input validation on all endpoints

## Next Steps

1. **Add More Sources**: Discord bots, web scraping
2. **Enhance NLP**: Better keyword extraction, sentiment analysis
3. **Real-time Updates**: WebSocket connections
4. **Caching**: Redis for better performance
5. **Analytics**: Trend prediction, historical analysis
