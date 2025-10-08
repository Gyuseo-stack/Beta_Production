const axios = require('axios');
const config = require('../../config');

class HackerNewsIngestion {
  constructor(config) {
    this.config = config;
    this.baseURL = 'https://hacker-news.firebaseio.com/v0';
  }

  isAvailable() {
    return true; // Hacker News API is always available and free
  }

  async fetchArticles() {
    const articles = [];
    
    try {
      // Get top stories
      const topStoriesResponse = await axios.get(`${this.baseURL}/topstories.json`);
      const topStoryIds = topStoriesResponse.data.slice(0, 30); // Get top 30 stories

      // Fetch details for each story
      for (const storyId of topStoryIds) {
        try {
          const storyResponse = await axios.get(`${this.baseURL}/item/${storyId}.json`);
          const story = storyResponse.data;

          // Filter for AI/ML related content
          if (this.isAIRelated(story)) {
            const article = {
              title: story.title,
              content: this.generateContent(story),
              url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
              published_at: new Date(story.time * 1000).toISOString(),
              raw_data: {
                hn_id: story.id,
                score: story.score,
                by: story.by,
                descendants: story.descendants, // comment count
                type: story.type,
                text: story.text
              }
            };

            articles.push(article);
          }

          // Rate limiting - be respectful
          await this.delay(100);
        } catch (storyError) {
          console.error(`❌ Error fetching HN story ${storyId}:`, storyError.message);
          continue;
        }
      }

      return articles;
    } catch (error) {
      console.error('❌ Hacker News API error:', error);
      throw error;
    }
  }

  isAIRelated(story) {
    if (!story.title) return false;

    const aiKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
      'neural network', 'llm', 'gpt', 'claude', 'gemini', 'chatgpt', 'openai',
      'anthropic', 'transformer', 'diffusion', 'stable diffusion', 'midjourney',
      'hugging face', 'pytorch', 'tensorflow', 'keras', 'nlp', 'computer vision',
      'reinforcement learning', 'generative', 'embedding', 'fine-tuning',
      'prompt engineering', 'rag', 'vector database', 'langchain', 'llama',
      'mistral', 'model', 'training', 'inference', 'gpu', 'nvidia', 'cuda'
    ];

    const titleLower = story.title.toLowerCase();
    const textLower = (story.text || '').toLowerCase();
    const combined = titleLower + ' ' + textLower;

    return aiKeywords.some(keyword => combined.includes(keyword));
  }

  generateContent(story) {
    const content = [];
    
    if (story.text) {
      // Remove HTML tags
      const cleanText = story.text.replace(/<[^>]*>/g, '').trim();
      content.push(cleanText);
    }
    
    content.push(`Score: ${story.score} points`);
    content.push(`Comments: ${story.descendants || 0}`);
    content.push(`By: ${story.by}`);
    
    return content.join('\n\n');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = HackerNewsIngestion;
