const Parser = require('rss-parser');
const axios = require('axios');
const config = require('../../config');

class RSSIngestion {
  constructor(config) {
    this.config = config;
    this.parser = new Parser({
      customFields: {
        item: ['media:content', 'media:thumbnail']
      }
    });
  }

  isAvailable() {
    return true; // RSS is always available
  }

  async fetchArticles() {
    const articles = [];
    const feeds = this.config.sources.rss.feeds;

    try {
      for (const feedConfig of feeds) {
        try {
          const feed = await this.parser.parseURL(feedConfig.url);
          
          for (const item of feed.items.slice(0, 10)) { // Limit to 10 items per feed
            const article = {
              title: item.title,
              content: this.generateContent(item),
              url: item.link,
              published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
              raw_data: {
                feed_name: feedConfig.name,
                feed_url: feedConfig.url,
                author: item.creator || item.author,
                categories: item.categories || [],
                guid: item.guid,
                media_content: item['media:content'],
                media_thumbnail: item['media:thumbnail']
              }
            };

            articles.push(article);
          }

          // Rate limiting between feeds
          await this.delay(2000);
        } catch (feedError) {
          console.error(`❌ Error fetching RSS feed ${feedConfig.name}:`, feedError.message);
          continue;
        }
      }

      return articles;
    } catch (error) {
      console.error('❌ RSS ingestion error:', error);
      throw error;
    }
  }

  generateContent(item) {
    const content = [];
    
    if (item.contentSnippet) {
      content.push(item.contentSnippet);
    } else if (item.content) {
      // Strip HTML tags for content
      const textContent = item.content.replace(/<[^>]*>/g, '').trim();
      content.push(textContent);
    }
    
    if (item.categories && item.categories.length > 0) {
      content.push(`Categories: ${item.categories.join(', ')}`);
    }
    
    if (item.creator || item.author) {
      content.push(`Author: ${item.creator || item.author}`);
    }
    
    return content.join('\n\n');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RSSIngestion;
