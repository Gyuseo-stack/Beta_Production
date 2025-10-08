const snoowrap = require('snoowrap');
const config = require('../../config');

class RedditIngestion {
  constructor(config) {
    this.config = config;
    this.reddit = null;
    this.initialize();
  }

  initialize() {
    if (this.config.apis.reddit.clientId && this.config.apis.reddit.clientSecret) {
      try {
        this.reddit = new snoowrap({
          userAgent: this.config.apis.reddit.userAgent,
          clientId: this.config.apis.reddit.clientId,
          clientSecret: this.config.apis.reddit.clientSecret,
          username: this.config.apis.reddit.username || 'TrendFeedBot',
          password: this.config.apis.reddit.password || ''
        });
      } catch (error) {
        console.log('⚠️  Reddit API configuration incomplete, will skip Reddit ingestion');
      }
    }
  }

  isAvailable() {
    return this.reddit !== null;
  }

  async fetchArticles() {
    if (!this.isAvailable()) {
      console.log('⚠️  Reddit API not configured - skipping');
      return [];
    }

    const articles = [];
    const subreddits = this.config.sources.reddit.subreddits;
    const limit = this.config.sources.reddit.limit || 25;

    try {
      for (const subredditName of subreddits) {
        try {
          const subreddit = this.reddit.getSubreddit(subredditName);
          const posts = await subreddit.getHot({ limit });

          for (const post of posts) {
            // Skip stickied posts
            if (post.stickied) continue;

            const article = {
              title: post.title,
              content: post.selftext || post.title,
              url: `https://reddit.com${post.permalink}`,
              published_at: new Date(post.created_utc * 1000).toISOString(),
              raw_data: {
                subreddit: subredditName,
                score: post.score,
                num_comments: post.num_comments,
                author: post.author ? post.author.name : 'unknown',
                upvote_ratio: post.upvote_ratio,
                post_id: post.id
              }
            };

            articles.push(article);
          }

          // Rate limiting - be respectful
          await this.delay(2000);
        } catch (subredditError) {
          console.error(`❌ Error fetching from r/${subredditName}:`, subredditError.message);
          continue;
        }
      }

      return articles;
    } catch (error) {
      console.error('❌ Reddit API error:', error);
      return [];
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RedditIngestion;
