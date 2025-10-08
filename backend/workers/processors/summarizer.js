const { createClient } = require('@supabase/supabase-js');
const config = require('../../config');
const compromise = require('compromise');

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

class SummarizerProcessor {
  async summarizeRecentArticles() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Fetch recent articles that do not have a summary yet
    const { data: articles, error } = await supabase
      .from('raw_articles')
      .select('id, title, content, url, created_at')
      .gte('created_at', yesterday.toISOString());

    if (error) {
      console.error('❌ Error fetching articles for summarization:', error.message);
      return;
    }

    if (!articles || articles.length === 0) {
      console.log('⚠️  No recent articles to summarize');
      return;
    }

    // Filter out ones already summarized
    const { data: existingSummaries } = await supabase
      .from('article_summaries')
      .select('article_id');

    const summarizedIds = new Set((existingSummaries || []).map((s) => s.article_id));
    const candidates = articles.filter((a) => !summarizedIds.has(a.id));

    if (candidates.length === 0) {
      console.log('ℹ️  All recent articles already summarized');
      return;
    }

    console.log(`🧠 Summarizing ${candidates.length} articles...`);

    for (const article of candidates) {
      try {
        const summary = this.generateSummaryText(article.title, article.content);
        if (!summary) continue;

        const sentenceCount = (summary.match(/([.!?])\s+/g) || []).length + 1;

        const { error: insertError } = await supabase
          .from('article_summaries')
          .upsert([
            {
              article_id: article.id,
              summary,
              summary_sentences: Math.max(3, sentenceCount)
            }
          ], { onConflict: 'article_id' });

        if (insertError) {
          console.error('❌ Error saving summary:', insertError.message);
        }
      } catch (err) {
        console.error('❌ Summarization error:', err.message);
      }
    }

    console.log('✅ Summarization complete');
  }

  generateSummaryText(title, content) {
    // Fallbacks if content is missing
    const baseText = [title, content].filter(Boolean).join('. ');
    if (!baseText || baseText.trim().length === 0) return null;

    // Use compromise to split sentences and pick key ones
    const doc = compromise(baseText);
    const sentences = doc.sentences().out('array');

    if (!sentences || sentences.length === 0) return null;

    // Heuristic: take first 3 informative sentences, preferring longer ones
    const informative = sentences
      .map((s) => s.trim())
      .filter((s) => s.length > 25)
      .slice(0, 5);

    const selected = informative.length >= 3 ? informative.slice(0, 3) : sentences.slice(0, 3);
    return selected.join(' ');
  }
}

module.exports = SummarizerProcessor;

