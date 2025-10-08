# 🚀 TrendFeed Quick Start Guide

## What Just Happened?

✅ **Backend API Server** is running on `http://localhost:3001`
✅ **Frontend** has opened in your browser

## Current Status

### Backend Server (Running)
- **URL**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Status**: Running in background

### Data Sources (23 Sources Active)
- 📚 **arXiv**: Academic papers (Free, always available)
- 💻 **GitHub**: Trending repositories (Free, always available)
- 🔶 **Hacker News**: Tech discussions (Free, always available)
- 📰 **RSS Feeds**: 15 news sources (Free, always available)
- 💬 **Reddit**: 16 subreddits (Requires API key)

## How to Use

### 1. First Time User
1. The frontend should be open in your browser
2. Click **"회원가입"** (Sign Up)
3. Enter any email and password
4. You'll see the AI Trends Dashboard!

### 2. Existing User
1. Click **"로그인"** (Login)
2. Enter your credentials
3. View the latest AI trends!

### 3. Forgot Password?
1. Click **"비밀번호를 잊으셨나요? 비밀번호 찾기"**
2. Enter your email
3. Your password will be displayed and copied to clipboard

## What You'll See

### Dashboard Features
- 🔥 **Top 10 AI Trends** of the day
- 📊 **Trend Metrics**:
  - Trend Score (composite score)
  - Volume (number of mentions)
  - Velocity (growth rate)
  - Sentiment (positive/negative)
- 📰 **Direct Links** to Google News
- 🔄 **Refresh Button** for latest data

### Data Sources Display
You'll see which sources are providing data:
- 📚 학술: arXiv
- 💻 코드: GitHub, Hugging Face
- 💬 커뮤니티: Reddit (16개), Hacker News
- 📰 뉴스: 15개 RSS 피드

## Current Mode

### 🟡 Demo Mode (Backend Without Reddit)
Since Reddit API keys are not configured, you'll see data from:
- ✅ GitHub (Working)
- ✅ arXiv (Working)
- ✅ Hacker News (Working)
- ✅ RSS Feeds (Working)
- ⚠️ Reddit (Skipped - no API keys)

The system will still work and show trends from 4 active sources!

## Testing the System

### Check Backend Status
Open in browser: http://localhost:3001/api/health

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-08T...",
  "sources": ["reddit", "github", "arxiv", "rss", "hackernews"]
}
```

### Check Available Sources
Open: http://localhost:3001/api/sources

You'll see which sources are available and configured.

### Check Daily Trends
Open: http://localhost:3001/api/trends/daily

You'll see the top 10 trends (or empty if data hasn't been collected yet).

## Data Collection

### Automatic Collection
The backend will automatically collect data:
- **Every 1 hour**: RSS feeds
- **Every 2 hours**: Reddit, Hacker News
- **Every 4 hours**: GitHub
- **Daily at 6 AM**: arXiv papers
- **Every 6 hours**: Keyword processing

### Manual Refresh
Click the **🔄 새로고침** button in the dashboard to reload trends.

## Stopping the Backend

To stop the backend server:
1. Press `Ctrl+C` in the terminal where it's running
2. Or close the terminal window

## Restarting Everything

### Quick Restart
```bash
# In the backend directory
npm start
```

Then open `Frontend/index.html` in your browser.

### Full Restart with Worker
```bash
# Terminal 1 - API Server
cd backend
npm start

# Terminal 2 - Data Worker
cd backend
npm run worker
```

## Optional: Configure Reddit API

To enable Reddit data collection (400+ posts/day):

1. **Create Reddit App**:
   - Go to https://www.reddit.com/prefs/apps
   - Click "Create App" or "Create Another App"
   - Fill in:
     - Name: TrendFeed
     - Type: Script
     - Redirect URI: http://localhost:3001
   - Click "Create app"
   - Copy the **Client ID** and **Client Secret**

2. **Update Configuration**:
   Create `backend/.env` file:
   ```
   REDDIT_CLIENT_ID=your_client_id_here
   REDDIT_CLIENT_SECRET=your_client_secret_here
   REDDIT_USER_AGENT=TrendFeed/1.0
   ```

3. **Restart Backend**:
   ```bash
   npm start
   ```

## Troubleshooting

### Frontend Shows Demo Data
- **Cause**: Backend not running or not accessible
- **Solution**: Check http://localhost:3001/api/health
- **Fix**: Restart backend with `npm start`

### Backend Error: "Cannot find module"
- **Cause**: Dependencies not installed
- **Solution**: Run `npm install` in backend directory

### No Trends Showing
- **Cause**: Data not collected yet (takes 5-10 minutes initially)
- **Solution**: Wait for initial data collection or view demo data

### Port 3001 Already in Use
- **Cause**: Backend already running or port occupied
- **Solution**: Kill the process or change port in `backend/config.js`

## Next Steps

1. ✅ **Test the Dashboard** - Create account and explore
2. 📊 **View Trends** - See what AI topics are trending
3. 🔗 **Follow Links** - Click Google News to read more
4. 🔄 **Refresh Data** - Come back in an hour for fresh trends
5. ⚙️ **Configure Reddit** - Add API keys for more data

## Support

For more information:
- **Full Documentation**: `README.md`
- **Data Sources List**: `DATA_SOURCES.md`
- **Integration Details**: `INTEGRATION_SUMMARY.md`
- **Backend Setup**: `backend/README.md`

---

🎉 **Enjoy exploring AI trends with TrendFeed!**

