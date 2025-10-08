const express = require('express');
const cors = require('cors');
const config = require('./config');
const { createClient } = require('@supabase/supabase-js');
const DataIngestionWorker = require('./workers/dataIngestion');

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    sources: Object.keys(config.sources)
  });
});

// Get summarized articles
app.get('/api/articles/summaries', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const { data, error } = await supabase
      .from('article_summaries')
      .select(`
        article_id,
        summary,
        summary_sentences,
        raw_articles!inner (
          id,
          title,
          url,
          published_at,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    const items = (data || []).map((row) => ({
      id: row.raw_articles.id,
      title: row.raw_articles.title,
      url: row.raw_articles.url,
      published_at: row.raw_articles.published_at,
      created_at: row.raw_articles.created_at,
      summary: row.summary,
      summary_sentences: row.summary_sentences
    }));

    res.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching summaries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a single article with summary
app.get('/api/articles/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('article_summaries')
      .select(`
        article_id,
        summary,
        summary_sentences,
        raw_articles!inner (
          id,
          title,
          content,
          url,
          published_at,
          created_at
        )
      `)
      .eq('raw_articles.id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      article: {
        id: data.raw_articles.id,
        title: data.raw_articles.title,
        url: data.raw_articles.url,
        content: data.raw_articles.content,
        published_at: data.raw_articles.published_at,
        created_at: data.raw_articles.created_at,
        summary: data.summary,
        summary_sentences: data.summary_sentences
      }
    });
  } catch (error) {
    console.error('Error fetching article summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get daily trends for a specific domain
app.get('/api/trends/daily/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const { limit = 10 } = req.query;

    // Get trends from database
    const { data: trends, error } = await supabase
      .from('trend_scores')
      .select(`
        *,
        canonical_trends (
          id,
          canonical_name,
          description
        )
      `)
      .eq('date', new Date().toISOString().split('T')[0])
      .order('trend_score', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({
      success: true,
      domain,
      date: new Date().toISOString().split('T')[0],
      trends: trends || []
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get trends for all domains (fallback to mock data if no real data)
app.get('/api/trends/daily', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Try to get real trends first
    const { data: trends, error } = await supabase
      .from('trend_scores')
      .select(`
        *,
        canonical_trends (
          id,
          canonical_name,
          description
        )
      `)
      .eq('date', new Date().toISOString().split('T')[0])
      .order('trend_score', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    // If no real data, return mock data (for development)
    if (!trends || trends.length === 0) {
      const mockTrends = [
        {
          canonical_trends: {
            canonical_name: 'GPT-5 출시 예정',
            description: 'OpenAI가 차세대 모델 GPT-5 출시 계획 발표'
          },
          trend_score: 98.5,
          volume: 15230,
          velocity: 1250,
          sentiment: 0.65
        },
        {
          canonical_trends: {
            canonical_name: 'Gemini 2.0 업데이트',
            description: '구글의 AI 모델 성능 대폭 향상'
          },
          trend_score: 92.1,
          volume: 8500,
          velocity: 450,
          sentiment: 0.72
        }
      ];
      
      return res.json({
        success: true,
        date: new Date().toISOString().split('T')[0],
        trends: mockTrends,
        source: 'mock'
      });
    }

    res.json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      trends,
      source: 'real'
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get available data sources
app.get('/api/sources', (req, res) => {
  res.json({
    success: true,
    sources: {
      reddit: {
        available: !!config.apis.reddit.clientId,
        subreddits: config.sources.reddit.subreddits
      },
      github: {
        available: true, // Always available (public API)
        topics: config.sources.github.topics
      },
      arxiv: {
        available: true, // Always available
        categories: config.sources.arxiv.categories
      },
      rss: {
        available: true, // Always available
        feeds: config.sources.rss.feeds.map(f => f.name)
      },
      newsapi: {
        available: !!config.apis.newsApi,
        limit: '100 requests/day (free tier)'
      }
    }
  });
});

// Manually trigger data refresh for an agent
app.post('/api/agents/:agentId/refresh', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // Get agent info
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Agent not found' 
      });
    }

    // Trigger data ingestion (this would normally be done by a worker)
    // For now, just return success
    res.json({
      success: true,
      message: 'Data refresh triggered',
      agent: {
        id: agent.id,
        name: agent.name,
        domain: agent.domain
      }
    });
  } catch (error) {
    console.error('Error refreshing agent:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get ingestion status
app.get('/api/ingestion/status', async (req, res) => {
  try {
    // Get latest ingestion stats
    const { data: latestIngestion, error } = await supabase
      .from('raw_articles')
      .select('created_at, source_id')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const stats = {
      total_articles: latestIngestion?.length || 0,
      last_update: latestIngestion?.[0]?.created_at || null,
      sources_active: [...new Set(latestIngestion?.map(a => a.source_id) || [])].length
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting ingestion status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 TrendFeed Backend running on port ${PORT}`);
  console.log(`📊 Available sources: ${Object.keys(config.sources).join(', ')}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  // Start ingestion + summarization worker automatically
  try {
    const worker = new DataIngestionWorker();
    worker.start();
    console.log('🧠 AI module (summarizer) and ingestion worker started');
  } catch (err) {
    console.error('❌ Failed to start ingestion/summarizer worker:', err);
  }
});

module.exports = app;
