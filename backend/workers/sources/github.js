const axios = require('axios');
const config = require('../../config');

class GitHubIngestion {
  constructor(config) {
    this.config = config;
    this.baseURL = 'https://api.github.com';
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'TrendFeed/1.0'
    };

    // Add token if available
    if (config.apis.github) {
      this.headers['Authorization'] = `token ${config.apis.github}`;
    }
  }

  isAvailable() {
    return true; // GitHub API is always available (public repos)
  }

  async fetchArticles() {
    const articles = [];
    const topics = this.config.sources.github.topics;
    const { sort, order, per_page } = this.config.sources.github;

    try {
      for (const topic of topics) {
        try {
          // Search for trending repositories
          const response = await axios.get(`${this.baseURL}/search/repositories`, {
            headers: this.headers,
            params: {
              q: `topic:${topic} language:python language:javascript language:typescript`,
              sort,
              order,
              per_page,
              created: '>2024-01-01' // Only recent repositories
            }
          });

          const repos = response.data.items;

          for (const repo of repos) {
            // Skip if repository is too old or has no recent activity
            const lastUpdated = new Date(repo.updated_at);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            if (lastUpdated < thirtyDaysAgo) continue;

            const article = {
              title: `${repo.name}: ${repo.description || 'GitHub Repository'}`,
              content: this.generateContent(repo),
              url: repo.html_url,
              published_at: repo.updated_at,
              raw_data: {
                repository: repo.name,
                owner: repo.owner.login,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                language: repo.language,
                topics: repo.topics,
                created_at: repo.created_at,
                updated_at: repo.updated_at,
                size: repo.size,
                open_issues: repo.open_issues_count
              }
            };

            articles.push(article);
          }

          // Rate limiting - GitHub allows 60 requests/hour without auth, 5000 with auth
          await this.delay(1000);
        } catch (topicError) {
          console.error(`❌ Error fetching GitHub topic ${topic}:`, topicError.message);
          continue;
        }
      }

      return articles;
    } catch (error) {
      console.error('❌ GitHub API error:', error);
      throw error;
    }
  }

  generateContent(repo) {
    const content = [];
    
    if (repo.description) {
      content.push(repo.description);
    }
    
    if (repo.topics && repo.topics.length > 0) {
      content.push(`Topics: ${repo.topics.join(', ')}`);
    }
    
    content.push(`Stars: ${repo.stargazers_count} | Forks: ${repo.forks_count}`);
    
    if (repo.language) {
      content.push(`Language: ${repo.language}`);
    }
    
    return content.join('\n');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GitHubIngestion;
