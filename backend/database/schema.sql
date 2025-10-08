-- TrendFeed AI Zeitgeist Engine Database Schema
-- Run this in your Supabase SQL editor

-- Sources table for tracking data sources
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('academic', 'code', 'corporate', 'social', 'media', 'other')),
  authority_weight DECIMAL(3,2) NOT NULL DEFAULT 5.0,
  access_method TEXT NOT NULL CHECK (access_method IN ('api', 'rss', 'scrape')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raw articles from all sources
CREATE TABLE IF NOT EXISTS raw_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  raw_data JSONB, -- Store original API response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extracted keywords from articles
CREATE TABLE IF NOT EXISTS extracted_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES raw_articles(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  keyword_type TEXT CHECK (keyword_type IN ('entity', 'keyphrase', 'topic')),
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Canonical trends (normalized keywords)
CREATE TABLE IF NOT EXISTS canonical_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,
  description TEXT,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily trend scores
CREATE TABLE IF NOT EXISTS trend_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id UUID REFERENCES canonical_trends(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  volume INTEGER DEFAULT 0,
  velocity DECIMAL(5,2) DEFAULT 0,
  reach INTEGER DEFAULT 0,
  source_authority DECIMAL(5,2) DEFAULT 0,
  source_diversity INTEGER DEFAULT 0,
  sentiment DECIMAL(3,2) DEFAULT 0,
  trend_score DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trend_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_raw_articles_source_id ON raw_articles(source_id);
CREATE INDEX IF NOT EXISTS idx_raw_articles_created_at ON raw_articles(created_at);
CREATE INDEX IF NOT EXISTS idx_extracted_keywords_article_id ON extracted_keywords(article_id);
CREATE INDEX IF NOT EXISTS idx_extracted_keywords_keyword ON extracted_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_trend_scores_date ON trend_scores(date);
CREATE INDEX IF NOT EXISTS idx_trend_scores_trend_score ON trend_scores(trend_score DESC);

-- Insert default sources
INSERT INTO sources (name, url, category, authority_weight, access_method) VALUES
('reddit', 'https://reddit.com', 'social', 7.0, 'api'),
('github', 'https://github.com', 'code', 8.0, 'api'),
('arxiv', 'https://arxiv.org', 'academic', 9.0, 'api'),
('rss', 'https://rss.com', 'media', 7.0, 'rss')
ON CONFLICT (name) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canonical_trends_updated_at BEFORE UPDATE ON canonical_trends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for daily trends with trend names
CREATE OR REPLACE VIEW daily_trends AS
SELECT 
    ts.id,
    ts.date,
    ct.canonical_name,
    ct.description,
    ts.volume,
    ts.velocity,
    ts.reach,
    ts.source_authority,
    ts.source_diversity,
    ts.sentiment,
    ts.trend_score,
    ts.created_at
FROM trend_scores ts
JOIN canonical_trends ct ON ts.trend_id = ct.id
ORDER BY ts.date DESC, ts.trend_score DESC;

-- Function to get top trends for a specific date
CREATE OR REPLACE FUNCTION get_top_trends(target_date DATE DEFAULT CURRENT_DATE, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    rank INTEGER,
    canonical_name TEXT,
    description TEXT,
    trend_score DECIMAL(8,2),
    volume INTEGER,
    velocity DECIMAL(5,2),
    sentiment DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY ts.trend_score DESC)::INTEGER as rank,
        ct.canonical_name,
        ct.description,
        ts.trend_score,
        ts.volume,
        ts.velocity,
        ts.sentiment
    FROM trend_scores ts
    JOIN canonical_trends ct ON ts.trend_id = ct.id
    WHERE ts.date = target_date
    ORDER BY ts.trend_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
