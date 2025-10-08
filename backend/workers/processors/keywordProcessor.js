const natural = require('natural');
const nlp = require('compromise');
const { createClient } = require('@supabase/supabase-js');
const config = require('../../config');

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

class KeywordProcessor {
  constructor() {
    this.initializeNLP();
  }

  initializeNLP() {
    // Initialize natural language processing tools
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
    this.stopWords = new Set(natural.stopwords);
    
    // AI/ML specific stop words to filter out
    this.aiStopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
      'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old', 'right', 'big', 'high',
      'different', 'small', 'large', 'next', 'early', 'young', 'important', 'few', 'public', 'same',
      'able', 'article', 'paper', 'study', 'research', 'work', 'model', 'method', 'approach', 'system',
      'data', 'dataset', 'training', 'learning', 'neural', 'network', 'deep', 'machine', 'artificial',
      'intelligence', 'ai', 'ml', 'dl', 'nlp', 'cv', 'computer', 'vision', 'natural', 'language',
      'processing', 'algorithm', 'optimization', 'performance', 'accuracy', 'result', 'experiment',
      'evaluation', 'benchmark', 'comparison', 'analysis', 'application', 'implementation', 'code',
      'software', 'framework', 'library', 'tool', 'platform', 'service', 'api', 'interface'
    ]);
  }

  async processArticle(article) {
    try {
      const text = `${article.title} ${article.content}`.toLowerCase();
      
      // Extract different types of keywords
      const entities = this.extractEntities(text);
      const keyphrases = this.extractKeyphrases(text);
      const topics = this.extractTopics(text);
      
      // Combine all keywords
      const allKeywords = [...entities, ...keyphrases, ...topics];
      
      // Filter and normalize keywords
      const filteredKeywords = this.filterKeywords(allKeywords);
      
      // Save keywords to database
      await this.saveKeywords(article.id, filteredKeywords);
      
    } catch (error) {
      console.error('❌ Error processing article keywords:', error);
    }
  }

  extractEntities(text) {
    const entities = [];
    
    try {
      // Use compromise.js for named entity recognition
      const doc = nlp(text);
      
      // Extract organizations
      const orgs = doc.organizations().out('array');
      entities.push(...orgs.map(org => ({ text: org, type: 'organization' })));
      
      // Extract people
      const people = doc.people().out('array');
      entities.push(...people.map(person => ({ text: person, type: 'person' })));
      
      // Extract places
      const places = doc.places().out('array');
      entities.push(...places.map(place => ({ text: place, type: 'place' })));
      
    } catch (error) {
      console.error('❌ Error extracting entities:', error);
    }
    
    return entities;
  }

  extractKeyphrases(text) {
    const keyphrases = [];
    
    try {
      // Tokenize and clean text
      const tokens = this.tokenizer.tokenize(text);
      const cleanTokens = tokens.filter(token => 
        token.length > 2 && 
        !this.stopWords.has(token) && 
        !this.aiStopWords.has(token) &&
        /^[a-zA-Z]+$/.test(token) // Only alphabetic tokens
      );
      
      // Extract bigrams and trigrams
      const bigrams = this.extractNGrams(cleanTokens, 2);
      const trigrams = this.extractNGrams(cleanTokens, 3);
      
      // Filter meaningful n-grams
      const meaningfulBigrams = bigrams.filter(bigram => 
        this.isMeaningfulPhrase(bigram) && bigram.length > 5
      );
      
      const meaningfulTrigrams = trigrams.filter(trigram => 
        this.isMeaningfulPhrase(trigram) && trigram.length > 8
      );
      
      keyphrases.push(
        ...meaningfulBigrams.map(phrase => ({ text: phrase, type: 'keyphrase' })),
        ...meaningfulTrigrams.map(phrase => ({ text: phrase, type: 'keyphrase' }))
      );
      
    } catch (error) {
      console.error('❌ Error extracting keyphrases:', error);
    }
    
    return keyphrases;
  }

  extractTopics(text) {
    const topics = [];
    
    try {
      // AI/ML specific topic patterns
      const topicPatterns = [
        // Model names
        /\b(gpt-\d+|claude|gemini|llama|bert|transformer|resnet|vgg|inception)\b/gi,
        // Technologies
        /\b(transformer|attention|embedding|fine-tuning|prompt|rag|retrieval|augmented|generation)\b/gi,
        // Frameworks
        /\b(pytorch|tensorflow|keras|huggingface|openai|anthropic|nvidia|aws|azure|gcp)\b/gi,
        // Concepts
        /\b(neural network|deep learning|machine learning|artificial intelligence|computer vision|natural language processing|reinforcement learning|generative ai|large language model|foundation model)\b/gi,
        // Applications
        /\b(chatbot|assistant|automation|optimization|prediction|classification|regression|clustering|recommendation|search|translation|summarization)\b/gi
      ];
      
      for (const pattern of topicPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          topics.push(...matches.map(match => ({ 
            text: match.toLowerCase().trim(), 
            type: 'topic' 
          })));
        }
      }
      
    } catch (error) {
      console.error('❌ Error extracting topics:', error);
    }
    
    return topics;
  }

  extractNGrams(tokens, n) {
    const ngrams = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      const ngram = tokens.slice(i, i + n).join(' ');
      ngrams.push(ngram);
    }
    return ngrams;
  }

  isMeaningfulPhrase(phrase) {
    // Check if phrase contains meaningful words
    const words = phrase.split(' ');
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      !this.stopWords.has(word) && 
      !this.aiStopWords.has(word)
    );
    
    return meaningfulWords.length >= words.length * 0.6; // At least 60% meaningful words
  }

  filterKeywords(keywords) {
    const filtered = [];
    const seen = new Set();
    
    for (const keyword of keywords) {
      const normalized = keyword.text.toLowerCase().trim();
      
      // Skip if too short, too long, or already seen
      if (normalized.length < 3 || normalized.length > 50 || seen.has(normalized)) {
        continue;
      }
      
      // Skip if contains only numbers or special characters
      if (!/[a-zA-Z]/.test(normalized)) {
        continue;
      }
      
      // Skip common words
      if (this.aiStopWords.has(normalized)) {
        continue;
      }
      
      seen.add(normalized);
      filtered.push({
        keyword: normalized,
        type: keyword.type,
        confidence: this.calculateConfidence(keyword)
      });
    }
    
    return filtered;
  }

  calculateConfidence(keyword) {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for entities
    if (keyword.type === 'organization' || keyword.type === 'person') {
      confidence += 0.3;
    }
    
    // Higher confidence for longer phrases
    if (keyword.text.length > 10) {
      confidence += 0.2;
    }
    
    // Higher confidence for AI/ML specific terms
    const aiTerms = ['gpt', 'claude', 'transformer', 'neural', 'deep', 'learning', 'ai', 'ml'];
    if (aiTerms.some(term => keyword.text.includes(term))) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  async saveKeywords(articleId, keywords) {
    try {
      const keywordsToInsert = keywords.map(kw => ({
        article_id: articleId,
        keyword: kw.keyword,
        keyword_type: kw.type,
        confidence_score: kw.confidence
      }));

      if (keywordsToInsert.length > 0) {
        const { error } = await supabase
          .from('extracted_keywords')
          .insert(keywordsToInsert);

        if (error) throw error;
      }
    } catch (error) {
      console.error('❌ Error saving keywords:', error);
    }
  }
}

module.exports = KeywordProcessor;
