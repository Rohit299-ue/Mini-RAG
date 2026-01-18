import { openai, EMBEDDING_CONFIG, isOpenAIEnabled } from '../config/openai.js'
import { createMockEmbedding } from './mockEmbeddingService.js'

class EmbeddingService {
  constructor() {
    this.model = EMBEDDING_CONFIG.model
    this.dimensions = EMBEDDING_CONFIG.dimensions
    this.batchSize = 100 // Process embeddings in batches
    this.retryAttempts = 3
    this.retryDelay = 1000 // 1 second
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text) {
    // Use mock embedding if OpenAI is not available
    if (!isOpenAIEnabled()) {
      console.log('⚠️  Using mock embedding for:', text.substring(0, 50) + '...')
      const mockResponse = await createMockEmbedding(text)
      return mockResponse.data[0].embedding
    }

    try {
      const response = await openai.embeddings.create({
        model: this.model,
        input: text.trim(),
        dimensions: this.dimensions,
        encoding_format: 'float'
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('Error generating embedding:', error.message)
      throw new Error(`Failed to generate embedding: ${error.message}`)
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  async generateBatchEmbeddings(texts) {
    const results = []
    const batches = this.createBatches(texts, this.batchSize)
    
    console.log(`Processing ${texts.length} texts in ${batches.length} batches`)

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} items)`)
      
      try {
        const batchEmbeddings = await this.processBatch(batch)
        results.push(...batchEmbeddings)
        
        // Add small delay between batches to respect rate limits
        if (i < batches.length - 1) {
          await this.delay(200)
        }
      } catch (error) {
        console.error(`Error processing batch ${i + 1}:`, error.message)
        throw error
      }
    }

    return results
  }

  /**
   * Process a single batch of texts
   */
  async processBatch(texts, attempt = 1) {
    try {
      const cleanTexts = texts.map(text => text.trim()).filter(text => text.length > 0)
      
      if (cleanTexts.length === 0) {
        return []
      }

      const response = await openai.embeddings.create({
        model: this.model,
        input: cleanTexts,
        dimensions: this.dimensions,
        encoding_format: 'float'
      })

      return response.data.map(item => item.embedding)
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.log(`Retrying batch (attempt ${attempt + 1}/${this.retryAttempts})`)
        await this.delay(this.retryDelay * attempt)
        return this.processBatch(texts, attempt + 1)
      }
      throw error
    }
  }

  /**
   * Generate embeddings for chunks with metadata
   */
  async generateChunkEmbeddings(chunks) {
    const texts = chunks.map(chunk => chunk.content)
    const embeddings = await this.generateBatchEmbeddings(texts)
    
    // Combine chunks with their embeddings
    return chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index]
    }))
  }

  /**
   * Generate embedding with retry logic
   */
  async generateEmbeddingWithRetry(text, attempt = 1) {
    try {
      return await this.generateEmbedding(text)
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.log(`Retrying embedding generation (attempt ${attempt + 1}/${this.retryAttempts})`)
        await this.delay(this.retryDelay * attempt)
        return this.generateEmbeddingWithRetry(text, attempt + 1)
      }
      throw error
    }
  }

  /**
   * Validate embedding dimensions
   */
  validateEmbedding(embedding) {
    if (!Array.isArray(embedding)) {
      throw new Error('Embedding must be an array')
    }
    
    if (embedding.length !== this.dimensions) {
      throw new Error(`Embedding dimension mismatch. Expected ${this.dimensions}, got ${embedding.length}`)
    }
    
    if (!embedding.every(val => typeof val === 'number' && !isNaN(val))) {
      throw new Error('Embedding contains invalid values')
    }
    
    return true
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embedding1, embedding2) {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions')
    }

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * Get embedding statistics
   */
  getEmbeddingStats(embeddings) {
    if (embeddings.length === 0) return null

    const dimensions = embeddings[0].length
    const stats = {
      count: embeddings.length,
      dimensions,
      avgMagnitude: 0,
      minMagnitude: Infinity,
      maxMagnitude: -Infinity
    }

    embeddings.forEach(embedding => {
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
      stats.avgMagnitude += magnitude
      stats.minMagnitude = Math.min(stats.minMagnitude, magnitude)
      stats.maxMagnitude = Math.max(stats.maxMagnitude, magnitude)
    })

    stats.avgMagnitude /= embeddings.length

    return stats
  }

  /**
   * Utility methods
   */
  createBatches(array, batchSize) {
    const batches = []
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize))
    }
    return batches
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Estimate cost for embedding generation
   */
  estimateCost(textCount, avgTokensPerText = 100) {
    // OpenAI text-embedding-3-small pricing: $0.00002 per 1K tokens
    const totalTokens = textCount * avgTokensPerText
    const costPer1KTokens = 0.00002
    return (totalTokens / 1000) * costPer1KTokens
  }
}

export default EmbeddingService