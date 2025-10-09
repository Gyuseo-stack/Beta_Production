const express = require('express');
const cors = require('cors');
const config = require('./config');
const { createClient } = require('@supabase/supabase-js');
const DataIngestionWorker = require('./workers/dataIngestion');

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

const app = express();
const PORT = config.server.port;

/**
 * Split text into sentences using a conservative regex to avoid overly short fragments.
 * @param {string} text
 * @returns {string[]}
 */
function splitIntoSentences(text) {
  if (!text || typeof text !== 'string') return [];

  return text
    .replace(/\s+/g, ' ')
    .match(/[^.!?\n]+[.!?]?/g)
    ?.map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0) || [];
}

/**
 * Create a concise 2-3 sentence summary for a keyword from related article snippets.
 * @param {Array} articles
 * @param {number} target
 * @returns {{sentences: string[], text: string}}
 */
function buildKeywordSummary(articles, target = 3) {
  if (!articles || articles.length === 0) {
    return {
      sentences: ['관련 기사가 충분하지 않아 요약을 생성할 수 없습니다.'],
      text: '관련 기사가 충분하지 않아 요약을 생성할 수 없습니다.'
    };
  }

  const desiredLength = Math.max(2, target);
  const sortedArticles = [...articles].sort((a, b) => {
    const aDate = new Date(a.published_at || a.created_at || 0).getTime();
    const bDate = new Date(b.published_at || b.created_at || 0).getTime();
    return bDate - aDate;
  });

  const collected = [];
  const seen = new Set();

  for (const article of sortedArticles) {
    const sentences = splitIntoSentences(article.summary || article.title || '');

    for (const sentence of sentences) {
      const normalized = sentence.replace(/\s+/g, ' ').trim();
      if (!normalized || normalized.length < 15) continue;
      if (seen.has(normalized)) continue;

      collected.push(normalized);
      seen.add(normalized);
      if (collected.length >= desiredLength) break;
    }

    if (collected.length >= desiredLength) break;
  }

  // Fallback: add article titles if we still don't have enough material
  if (collected.length < 2) {
    for (const article of sortedArticles) {
      if (!article.title) continue;
      const title = article.title.trim();
      if (title.length < 10 || seen.has(title)) continue;
      collected.push(title);
      seen.add(title);
      if (collected.length >= desiredLength) break;
    }
  }

  const sentences = collected.slice(0, Math.max(2, collected.length));
  return {
    sentences,
    text: sentences.join(' ')
  };
}

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

// Get AI keyword insights with aggregated summaries
app.get('/api/keywords/insights', async (req, res) => {
  try {
    const { limit = 10, hours = 24 } = req.query;
    const now = new Date();
    const start = new Date(now.getTime() - Number(hours) * 60 * 60 * 1000);

    const { data: keywordRows, error } = await supabase
      .from('extracted_keywords')
      .select(`
        id,
        keyword,
        keyword_type,
        confidence_score,
        created_at,
        raw_articles!inner (
          id,
          title,
          url,
          published_at,
          created_at,
          sources!inner (
            name,
            category
          )
        )
      `)
      .gte('raw_articles.created_at', start.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!keywordRows || keywordRows.length === 0) {
      return res.json({
        success: true,
        generated_at: now.toISOString(),
        window: {
          hours: Number(hours),
          start: start.toISOString(),
          end: now.toISOString()
        },
        keywords: []
      });
    }

    const articleIds = Array.from(
      new Set(
        keywordRows
          .map((row) => row.raw_articles?.id)
          .filter(Boolean)
      )
    );

    let summaryMap = new Map();
    if (articleIds.length > 0) {
      const { data: summaries, error: summaryError } = await supabase
        .from('article_summaries')
        .select('article_id, summary, summary_sentences')
        .in('article_id', articleIds);

      if (summaryError) throw summaryError;

      summaryMap = new Map(
        (summaries || []).map((item) => [item.article_id, item])
      );
    }

    const keywordMap = new Map();

    for (const row of keywordRows) {
      const normalized = row.keyword?.trim().toLowerCase();
      if (!normalized) continue;

      if (!keywordMap.has(normalized)) {
        keywordMap.set(normalized, {
          keyword: row.keyword.trim(),
          mentions: [],
          articles: new Map(),
          types: new Set(),
          totalConfidence: 0,
          firstSeen: row.raw_articles?.created_at || row.created_at,
          lastSeen: row.raw_articles?.created_at || row.created_at
        });
      }

      const group = keywordMap.get(normalized);
      group.types.add(row.keyword_type || 'unknown');
      group.totalConfidence += Number(row.confidence_score || 0);
      group.mentions.push({
        id: row.id,
        article_id: row.raw_articles?.id,
        confidence: row.confidence_score,
        type: row.keyword_type,
        created_at: row.created_at
      });

      const createdAt = row.raw_articles?.created_at || row.created_at;
      if (!group.firstSeen || new Date(createdAt) < new Date(group.firstSeen)) {
        group.firstSeen = createdAt;
      }
      if (!group.lastSeen || new Date(createdAt) > new Date(group.lastSeen)) {
        group.lastSeen = createdAt;
      }

      const articleId = row.raw_articles?.id;
      if (!articleId || group.articles.has(articleId)) continue;

      const summaryEntry = summaryMap.get(articleId);
      group.articles.set(articleId, {
        id: articleId,
        title: row.raw_articles?.title,
        url: row.raw_articles?.url,
        published_at: row.raw_articles?.published_at,
        created_at: row.raw_articles?.created_at,
        source: row.raw_articles?.sources?.name || 'Unknown',
        source_category: row.raw_articles?.sources?.category || 'unknown',
        summary: summaryEntry?.summary || null,
        summary_sentences: summaryEntry?.summary_sentences || null
      });
    }

    const groupedKeywords = Array.from(keywordMap.values())
      .map((group) => {
        const articles = Array.from(group.articles.values());
        const summary = buildKeywordSummary(articles);

        const uniqueSources = new Set(
          articles.map((article) => article.source)
        );

        return {
          keyword: group.keyword,
          total_mentions: group.mentions.length,
          unique_articles: articles.length,
          unique_sources: uniqueSources.size,
          average_confidence: Number(
            (group.totalConfidence / Math.max(1, group.mentions.length)).toFixed(2)
          ),
          keyword_types: Array.from(group.types),
          first_seen: group.firstSeen,
          last_seen: group.lastSeen,
          summary: summary.text,
          summary_sentences: summary.sentences,
          articles: articles
            .sort((a, b) => {
              const aDate = new Date(a.published_at || a.created_at || 0).getTime();
              const bDate = new Date(b.published_at || b.created_at || 0).getTime();
              return bDate - aDate;
            })
            .slice(0, 10)
        };
      })
      .sort((a, b) => b.total_mentions - a.total_mentions)
      .slice(0, Number(limit))
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));

    res.json({
      success: true,
      generated_at: now.toISOString(),
      window: {
        hours: Number(hours),
        start: start.toISOString(),
        end: now.toISOString()
      },
      total_keywords: groupedKeywords.length,
      keywords: groupedKeywords
    });
  } catch (error) {
    console.error('Error generating keyword insights:', error);
    res.status(500).json({ success: false, error: error.message });
  }
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
