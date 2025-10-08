const axios = require('axios');
const config = require('../../config');

class ArxivIngestion {
  constructor(config) {
    this.config = config;
    this.baseURL = 'http://export.arxiv.org/api/query';
  }

  isAvailable() {
    return true; // arXiv API is always available
  }

  async fetchArticles() {
    const articles = [];
    const categories = this.config.sources.arxiv.categories;
    const maxResults = this.config.sources.arxiv.maxResults || 50;

    try {
      for (const category of categories) {
        try {
          const response = await axios.get(this.baseURL, {
            params: {
              search_query: `cat:${category}`,
              start: 0,
              max_results: maxResults,
              sortBy: 'submittedDate',
              sortOrder: 'descending'
            }
          });

          const feed = this.parseArxivXML(response.data);
          
          for (const entry of feed.entries) {
            const article = {
              title: entry.title,
              content: this.generateContent(entry),
              url: entry.link,
              published_at: entry.published,
              raw_data: {
                arxiv_id: entry.id,
                authors: entry.authors,
                summary: entry.summary,
                categories: entry.categories,
                doi: entry.doi,
                journal_ref: entry.journal_ref
              }
            };

            articles.push(article);
          }

          // Be respectful to arXiv servers
          await this.delay(3000);
        } catch (categoryError) {
          console.error(`❌ Error fetching arXiv category ${category}:`, categoryError.message);
          continue;
        }
      }

      return articles;
    } catch (error) {
      console.error('❌ arXiv API error:', error);
      throw error;
    }
  }

  parseArxivXML(xmlData) {
    // Simple XML parsing for arXiv feed
    // In production, you'd want to use a proper XML parser like xml2js
    const entries = [];
    
    // Extract entries using regex (simplified approach)
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    
    while ((match = entryRegex.exec(xmlData)) !== null) {
      const entryXML = match[1];
      const entry = this.parseEntry(entryXML);
      if (entry) entries.push(entry);
    }

    return { entries };
  }

  parseEntry(entryXML) {
    try {
      const extractField = (field, xml) => {
        const regex = new RegExp(`<${field}>([\\s\\S]*?)<\\/${field}>`);
        const match = xml.match(regex);
        return match ? match[1].trim() : null;
      };

      const extractAuthors = (xml) => {
        const authorRegex = /<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g;
        const authors = [];
        let match;
        while ((match = authorRegex.exec(xml)) !== null) {
          authors.push(match[1]);
        }
        return authors;
      };

      const extractCategories = (xml) => {
        const categoryRegex = /<category term="([^"]+)"[^>]*\/>/g;
        const categories = [];
        let match;
        while ((match = categoryRegex.exec(xml)) !== null) {
          categories.push(match[1]);
        }
        return categories;
      };

      const title = extractField('title', entryXML);
      const summary = extractField('summary', entryXML);
      const published = extractField('published', entryXML);
      const link = extractField('id', entryXML);
      const doi = extractField('arxiv:doi', entryXML);
      const journalRef = extractField('arxiv:journal_ref', entryXML);

      if (!title || !link) return null;

      return {
        title,
        summary,
        published,
        link,
        doi,
        journal_ref: journalRef,
        authors: extractAuthors(entryXML),
        categories: extractCategories(entryXML),
        id: link
      };
    } catch (error) {
      console.error('❌ Error parsing arXiv entry:', error);
      return null;
    }
  }

  generateContent(entry) {
    const content = [];
    
    if (entry.summary) {
      content.push(entry.summary);
    }
    
    if (entry.authors && entry.authors.length > 0) {
      content.push(`Authors: ${entry.authors.join(', ')}`);
    }
    
    if (entry.categories && entry.categories.length > 0) {
      content.push(`Categories: ${entry.categories.join(', ')}`);
    }
    
    if (entry.journal_ref) {
      content.push(`Journal: ${entry.journal_ref}`);
    }
    
    return content.join('\n\n');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ArxivIngestion;
