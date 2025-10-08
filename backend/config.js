// Configuration for TrendFeed Backend
require('dotenv').config();

const config = {
  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL || 'https://hjmbrmdpvcrzthkxwjhm.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbWJybWRwdmNyenRoa3h3amhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTUyMDYsImV4cCI6MjA3NDc5MTIwNn0.5VzmIJlwp_o6q7jthr4gbh5aeiTHLazi6Osmzv9Ef4U'
  },

  // API Keys (Free sources only)
  apis: {
    newsApi: process.env.NEWS_API_KEY || null, // Free tier: 100 requests/day
    reddit: {
      clientId: process.env.REDDIT_CLIENT_ID || null,
      clientSecret: process.env.REDDIT_CLIENT_SECRET || null,
      userAgent: process.env.REDDIT_USER_AGENT || 'TrendFeed/1.0'
    },
    github: process.env.GITHUB_TOKEN || null, // Optional, free without token
    huggingface: process.env.HUGGINGFACE_TOKEN || null // Optional, free without token
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  },

  // Free Data Sources Configuration
  sources: {
    reddit: {
      subreddits: [
        'MachineLearning',        // 2.8M members
        'artificial',             // 200K members
        'compsci',                // 1.5M members
        'MachineLearningNews',    // 50K members
        'LocalLLaMA',             // 150K members
        'StableDiffusion',        // 300K members
        'learnmachinelearning',   // 500K members
        'deeplearning',           // 150K members
        'singularity',            // 200K members - AGI focus
        'agi',                    // 50K members - AGI focus
        'AIethics',               // 30K members - Ethics focus
        'MLQuestions',            // 100K members - Q&A
        'LanguageTechnology',     // 50K members - NLP/LLMs
        'computervision',         // 80K members - CV focus
        'datascience',            // 1.2M members - Data science
        'statistics'              // 300K members - Stats/ML theory
      ],
      limit: 25, // Posts per subreddit
      updateInterval: '0 */2 * * *' // Every 2 hours
    },
    github: {
      topics: [
        'machine-learning',
        'artificial-intelligence',
        'deep-learning',
        'llm',
        'transformer',
        'pytorch',
        'tensorflow'
      ],
      sort: 'stars',
      order: 'desc',
      per_page: 30,
      updateInterval: '0 */4 * * *' // Every 4 hours
    },
    arxiv: {
      categories: [
        'cs.AI',
        'cs.LG',
        'cs.CL',
        'stat.ML'
      ],
      maxResults: 50,
      updateInterval: '0 6 * * *' // Daily at 6 AM
    },
    rss: {
      feeds: [
        {
          name: 'TechCrunch AI',
          url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
          authority: 7
        },
        {
          name: 'The Verge AI',
          url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
          authority: 7
        },
        {
          name: 'Towards Data Science',
          url: 'https://towardsdatascience.com/feed',
          authority: 6
        },
        {
          name: 'MIT Technology Review AI',
          url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
          authority: 8
        },
        {
          name: 'VentureBeat AI',
          url: 'https://venturebeat.com/category/ai/feed/',
          authority: 7
        },
        {
          name: 'Wired AI',
          url: 'https://www.wired.com/feed/tag/ai/latest/rss',
          authority: 7
        },
        {
          name: 'KDnuggets',
          url: 'https://www.kdnuggets.com/feed',
          authority: 6
        },
        {
          name: 'Analytics Vidhya',
          url: 'https://www.analyticsvidhya.com/feed/',
          authority: 6
        },
        {
          name: 'Machine Learning Mastery',
          url: 'https://machinelearningmastery.com/feed/',
          authority: 6
        },
        {
          name: 'NVIDIA AI Blog',
          url: 'https://blogs.nvidia.com/feed/',
          authority: 9
        },
        {
          name: 'AWS Machine Learning Blog',
          url: 'https://aws.amazon.com/blogs/machine-learning/feed/',
          authority: 9
        },
        {
          name: 'Microsoft AI Blog',
          url: 'https://blogs.microsoft.com/ai/feed/',
          authority: 9
        },
        {
          name: 'Stanford HAI',
          url: 'https://hai.stanford.edu/news/feed',
          authority: 9
        },
        {
          name: 'Berkeley BAIR',
          url: 'https://bair.berkeley.edu/blog/feed.xml',
          authority: 9
        },
        {
          name: 'CMU ML Blog',
          url: 'https://blog.ml.cmu.edu/feed/',
          authority: 9
        }
      ],
      updateInterval: '0 */1 * * *' // Every hour
    },
    hackernews: {
      maxStories: 30,
      updateInterval: '0 */2 * * *' // Every 2 hours
    }
  }
};

module.exports = config;
