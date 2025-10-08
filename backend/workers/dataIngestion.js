const cron = require('node-cron');
const config = require('../config');
const { createClient } = require('@supabase/supabase-js');
const RedditIngestion = require('./sources/reddit');
const GitHubIngestion = require('./sources/github');
const ArxivIngestion = require('./sources/arxiv');
const RSSIngestion = require('./sources/rss');
const HackerNewsIngestion = require('./sources/hackernews');
const KeywordProcessor = require('./processors/keywordProcessor');

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

class DataIngestionWorker {
  constructor() {
    this.isRunning = false;
    this.keywordProcessor = new KeywordProcessor();
    this.initializeSources();
  }

  initializeSources() {
    this.sources = {
      reddit: new RedditIngestion(config),
      github: new GitHubIngestion(config),
      arxiv: new ArxivIngestion(config),
      rss: new RSSIngestion(config),
      hackernews: new HackerNewsIngestion(config)
    };
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Data ingestion worker is already running');
      return;
    }

    console.log('🚀 Starting TrendFeed Data Ingestion Worker...');
    this.isRunning = true;

    // Schedule Reddit ingestion (every 2 hours)
    if (config.sources.reddit) {
      cron.schedule(config.sources.reddit.updateInterval, async () => {
        console.log('📱 Starting Reddit ingestion...');
        await this.ingestReddit();
      });
    }

    // Schedule GitHub ingestion (every 4 hours)
    if (config.sources.github) {
      cron.schedule(config.sources.github.updateInterval, async () => {
        console.log('🐙 Starting GitHub ingestion...');
        await this.ingestGitHub();
      });
    }

    // Schedule arXiv ingestion (daily at 6 AM)
    if (config.sources.arxiv) {
      cron.schedule(config.sources.arxiv.updateInterval, async () => {
        console.log('📚 Starting arXiv ingestion...');
        await this.ingestArxiv();
      });
    }

    // Schedule RSS ingestion (every hour)
    if (config.sources.rss) {
      cron.schedule(config.sources.rss.updateInterval, async () => {
        console.log('📰 Starting RSS ingestion...');
        await this.ingestRSS();
      });
    }

    // Schedule Hacker News ingestion (every 2 hours)
    if (config.sources.hackernews) {
      cron.schedule(config.sources.hackernews.updateInterval, async () => {
        console.log('🔶 Starting Hacker News ingestion...');
        await this.ingestHackerNews();
      });
    }

    // Schedule keyword processing (every 6 hours)
    cron.schedule('0 */6 * * *', async () => {
      console.log('🔍 Starting keyword processing...');
      await this.processKeywords();
    });

    // Run initial ingestion
    console.log('🔄 Running initial data ingestion...');
    await this.runInitialIngestion();

    console.log('✅ Data ingestion worker started successfully');
  }

  async runInitialIngestion() {
    try {
      await Promise.allSettled([
        this.ingestReddit(),
        this.ingestGitHub(),
        this.ingestArxiv(),
        this.ingestRSS(),
        this.ingestHackerNews()
      ]);
      
      // Process keywords after initial ingestion
      await this.processKeywords();
    } catch (error) {
      console.error('❌ Error in initial ingestion:', error);
    }
  }

  async ingestReddit() {
    try {
      if (!this.sources.reddit.isAvailable()) {
        console.log('⚠️  Reddit source not available (missing credentials)');
        return;
      }

      const articles = await this.sources.reddit.fetchArticles();
      await this.saveArticles(articles, 'reddit');
      console.log(`✅ Reddit: Ingested ${articles.length} articles`);
    } catch (error) {
      console.error('❌ Reddit ingestion error:', error.message);
    }
  }

  async ingestGitHub() {
    try {
      const articles = await this.sources.github.fetchArticles();
      await this.saveArticles(articles, 'github');
      console.log(`✅ GitHub: Ingested ${articles.length} articles`);
    } catch (error) {
      console.error('❌ GitHub ingestion error:', error.message);
    }
  }

  async ingestArxiv() {
    try {
      const articles = await this.sources.arxiv.fetchArticles();
      await this.saveArticles(articles, 'arxiv');
      console.log(`✅ arXiv: Ingested ${articles.length} articles`);
    } catch (error) {
      console.error('❌ arXiv ingestion error:', error.message);
    }
  }

  async ingestRSS() {
    try {
      const articles = await this.sources.rss.fetchArticles();
      await this.saveArticles(articles, 'rss');
      console.log(`✅ RSS: Ingested ${articles.length} articles`);
    } catch (error) {
      console.error('❌ RSS ingestion error:', error.message);
    }
  }

  async ingestHackerNews() {
    try {
      const articles = await this.sources.hackernews.fetchArticles();
      await this.saveArticles(articles, 'hackernews');
      console.log(`✅ Hacker News: Ingested ${articles.length} articles`);
    } catch (error) {
      console.error('❌ Hacker News ingestion error:', error.message);
    }
  }

  async saveArticles(articles, sourceType) {
    if (!articles || articles.length === 0) return;

    try {
      // Get or create source record
      const { data: source, error: sourceError } = await supabase
        .from('sources')
        .select('id')
        .eq('name', sourceType)
        .single();

      let sourceId;
      if (sourceError || !source) {
        const { data: newSource, error: createError } = await supabase
          .from('sources')
          .insert([{
            name: sourceType,
            url: `https://${sourceType}.com`,
            category: this.getSourceCategory(sourceType),
            authority_weight: this.getAuthorityWeight(sourceType),
            access_method: 'api'
          }])
          .select('id')
          .single();

        if (createError) throw createError;
        sourceId = newSource.id;
      } else {
        sourceId = source.id;
      }

      // Save articles
      const articlesToInsert = articles.map(article => ({
        source_id: sourceId,
        title: article.title,
        content: article.content,
        url: article.url,
        published_at: article.published_at,
        raw_data: article.raw_data
      }));

      const { error: insertError } = await supabase
        .from('raw_articles')
        .insert(articlesToInsert);

      if (insertError) throw insertError;

    } catch (error) {
      console.error(`❌ Error saving ${sourceType} articles:`, error);
    }
  }

  async processKeywords() {
    try {
      // Get recent articles (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: articles, error } = await supabase
        .from('raw_articles')
        .select('*')
        .gte('created_at', yesterday.toISOString());

      if (error) throw error;

      if (!articles || articles.length === 0) {
        console.log('⚠️  No recent articles to process');
        return;
      }

      console.log(`🔍 Processing keywords from ${articles.length} articles...`);

      // Process keywords for each article
      for (const article of articles) {
        await this.keywordProcessor.processArticle(article);
      }

      // Calculate trend scores
      await this.calculateTrendScores();

      console.log('✅ Keyword processing completed');
    } catch (error) {
      console.error('❌ Keyword processing error:', error);
    }
  }

  async calculateTrendScores() {
    try {
      // Get all unique keywords from the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: keywords, error } = await supabase
        .from('extracted_keywords')
        .select(`
          keyword,
          raw_articles!inner (
            created_at,
            sources!inner (
              authority_weight,
              category
            )
          )
        `)
        .gte('raw_articles.created_at', yesterday.toISOString());

      if (error) throw error;

      // Group keywords and calculate scores
      const keywordGroups = {};
      keywords.forEach(kw => {
        const keyword = kw.keyword.toLowerCase().trim();
        if (!keywordGroups[keyword]) {
          keywordGroups[keyword] = {
            keyword,
            mentions: [],
            sources: new Set(),
            categories: new Set()
          };
        }
        
        keywordGroups[keyword].mentions.push(kw.raw_articles);
        keywordGroups[keyword].sources.add(kw.raw_articles.sources.authority_weight);
        keywordGroups[keyword].categories.add(kw.raw_articles.sources.category);
      });

      // Calculate trend scores
      const trends = Object.values(keywordGroups).map(group => {
        const volume = group.mentions.length;
        const sourceAuthority = Array.from(group.sources).reduce((sum, weight) => sum + weight, 0);
        const sourceDiversity = group.categories.size;
        
        // Simple trend score calculation (can be enhanced)
        const trendScore = (volume * 0.3) + (sourceAuthority * 0.4) + (sourceDiversity * 0.3);
        
        return {
          keyword: group.keyword,
          volume,
          source_authority: sourceAuthority,
          source_diversity: sourceDiversity,
          trend_score: trendScore
        };
      });

      // Sort by trend score and take top 10
      const topTrends = trends
        .sort((a, b) => b.trend_score - a.trend_score)
        .slice(0, 10);

      // Save trend scores
      const today = new Date().toISOString().split('T')[0];
      
      for (let i = 0; i < topTrends.length; i++) {
        const trend = topTrends[i];
        
        // Get or create canonical trend
        const { data: canonicalTrend, error: trendError } = await supabase
          .from('canonical_trends')
          .select('id')
          .eq('canonical_name', trend.keyword)
          .single();

        let trendId;
        if (trendError || !canonicalTrend) {
          const { data: newTrend, error: createError } = await supabase
            .from('canonical_trends')
            .insert([{
              canonical_name: trend.keyword,
              description: `Trending keyword: ${trend.keyword}`
            }])
            .select('id')
            .single();

          if (createError) throw createError;
          trendId = newTrend.id;
        } else {
          trendId = canonicalTrend.id;
        }

        // Save trend score
        const { error: scoreError } = await supabase
          .from('trend_scores')
          .upsert([{
            trend_id: trendId,
            date: today,
            volume: trend.volume,
            source_authority: trend.source_authority,
            source_diversity: trend.source_diversity,
            trend_score: trend.trend_score
          }], {
            onConflict: 'trend_id,date'
          });

        if (scoreError) throw scoreError;
      }

      console.log(`✅ Calculated trend scores for ${topTrends.length} trends`);
    } catch (error) {
      console.error('❌ Error calculating trend scores:', error);
    }
  }

  getSourceCategory(sourceType) {
    const categories = {
      reddit: 'social',
      github: 'code',
      arxiv: 'academic',
      rss: 'media',
      hackernews: 'social'
    };
    return categories[sourceType] || 'other';
  }

  getAuthorityWeight(sourceType) {
    const weights = {
      reddit: 7,
      github: 8,
      arxiv: 9,
      rss: 7,
      hackernews: 8
    };
    return weights[sourceType] || 5;
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 Data ingestion worker stopped');
  }
}

// Start the worker if this file is run directly
if (require.main === module) {
  const worker = new DataIngestionWorker();
  worker.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down data ingestion worker...');
    worker.stop();
    process.exit(0);
  });
}

module.exports = DataIngestionWorker;
