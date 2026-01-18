/**
 * Hugging Face Embedding Service
 * Free alternative to OpenAI embeddings
 */

class HuggingFaceEmbeddingService {
  constructor() {
    this.apiUrl = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2'
    this.model = 'sentence-transformers/all-MiniLM-L6-v2'
    this.dimensions = 384 // This model produces 384-dimensional embeddings
    this.maxRetries = 3
    this.retryDelay = 2000
  }

  /**
   * Generate embedding for a single text using Hugging Face
   */
  async generateEmbedding(text) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text.trim(),
          options: {
            wait_for_model: true
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const embedding = await response.json()
      
      // Hugging Face returns the embedding directly as an array
      if (Array.isArray(embedding) && embedding.length === this.dimensions) {
        return embedding
      }
      
      throw new Error('Invalid embedding format received')
    } catch (error) {
      console.error('Error generating Hugging Face embedding:', error.message)
      throw new Error(`Failed to generate embedding: ${error.message}`)
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async generateBatchEmbeddings(texts) {
    const results = []
    
    console.log(`Processing ${texts.length} texts with Hugging Face`)

    for (let i = 0; i < texts.length; i++) {
      try {
        console.log(`Processing text ${i + 1}/${texts.length}`)
        const embedding = await this.generateEmbedding(texts[i])
        results.push(embedding)
        
        // Add delay to respect rate limits (free tier)
        if (i < texts.length - 1) {
          await this.delay(1000) // 1 second delay between requests
        }
      } catch (error) {
        console.error(`Error processing text ${i + 1}:`, error.message)
        throw error
      }
    }

    return results
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
   * Test connection to Hugging Face
   */
  async testConnection() {
    try {
      const testEmbedding = await this.generateEmbedding('test connection')
      console.log('✅ Hugging Face connection successful')
      return true
    } catch (error) {
      console.error('❌ Hugging Face connection failed:', error.message)
      return false
    }
  }

  /**
   * Utility methods
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
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
}

export default HuggingFaceEmbeddingService