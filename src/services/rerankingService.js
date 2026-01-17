import { cohere, RERANK_CONFIG } from '../config/cohere.js'

/**
 * RerankingService - Implements Cohere Rerank for improving retrieval quality
 * 
 * Why Reranking Improves Quality:
 * 1. Cross-attention: Unlike embedding similarity, reranking models use cross-attention
 *    between query and document, capturing complex semantic relationships
 * 2. Fine-tuned: Rerank models are specifically trained on query-document relevance
 * 3. Context-aware: Considers full context of both query and document simultaneously
 * 4. Handles nuances: Better at understanding negations, conditions, and subtle meanings
 * 5. Reduces false positives: Filters out documents that are topically similar but not relevant
 */
class RerankingService {
  constructor() {
    this.model = RERANK_CONFIG.model
    this.defaultTopN = RERANK_CONFIG.topN
    this.maxChunkLength = RERANK_CONFIG.maxChunksLength
    this.retryAttempts = 3
    this.retryDelay = 1000
  }

  /**
   * Main reranking method - takes query and chunks, returns top-N reranked results
   * 
   * @param {string} query - The user's search query
   * @param {Array} chunks - Array of retrieved document chunks
   * @param {Object} options - Reranking configuration options
   * @returns {Object} Reranked results with scores and metadata
   */
  async rerankChunks(query, chunks, options = {}) {
    const {
      topN = this.defaultTopN,
      model = this.model,
      includeScores = true,
      includeOriginalRank = true,
      truncateChunks = true
    } = options

    try {
      console.log(`Starting reranking for ${chunks.length} chunks with query: "${query.substring(0, 50)}..."`)
      
      // Validate inputs
      this.validateInputs(query, chunks, topN)
      
      // Prepare documents for reranking
      const documents = this.prepareDocuments(chunks, truncateChunks)
      
      // Call Cohere Rerank API
      const rerankResponse = await this.callCohereRerank(query, documents, {
        model,
        topN: Math.min(topN, chunks.length),
        returnDocuments: true
      })
      
      // Process and format results
      const rerankedResults = this.processRerankResults(
        rerankResponse,
        chunks,
        {
          includeScores,
          includeOriginalRank,
          query
        }
      )
      
      // Calculate reranking statistics
      const stats = this.calculateRerankingStats(chunks, rerankedResults)
      
      console.log(`Reranking completed: ${chunks.length} → ${rerankedResults.length} chunks`)
      console.log(`Average rerank score: ${stats.avgRerankScore.toFixed(3)}`)
      
      return {
        query,
        originalCount: chunks.length,
        rerankedCount: rerankedResults.length,
        results: rerankedResults,
        metadata: {
          model,
          topN,
          stats,
          processingTime: stats.processingTime
        }
      }
      
    } catch (error) {
      console.error('Error in reranking:', error.message)
      throw new Error(`Reranking failed: ${error.message}`)
    }
  }

  /**
   * Advanced reranking with query expansion and multi-stage processing
   */
  async advancedRerank(query, chunks, options = {}) {
    const {
      expandQuery = false,
      multiStage = false,
      topN = this.defaultTopN,
      intermediateN = Math.min(15, chunks.length)
    } = options

    try {
      let processedQuery = query
      let processedChunks = chunks

      // Stage 1: Query expansion (optional)
      if (expandQuery) {
        processedQuery = await this.expandQuery(query, chunks.slice(0, 3))
        console.log(`Expanded query: "${processedQuery.substring(0, 100)}..."`)
      }

      // Stage 2: Multi-stage reranking (optional)
      if (multiStage && chunks.length > intermediateN) {
        console.log(`Multi-stage reranking: ${chunks.length} → ${intermediateN} → ${topN}`)
        
        // First stage: Reduce to intermediate number
        const firstStage = await this.rerankChunks(processedQuery, processedChunks, {
          topN: intermediateN,
          includeOriginalRank: true
        })
        
        // Second stage: Final reranking
        const secondStage = await this.rerankChunks(processedQuery, firstStage.results, {
          topN,
          includeOriginalRank: true
        })
        
        return {
          ...secondStage,
          metadata: {
            ...secondStage.metadata,
            multiStage: true,
            intermediateN,
            stages: [
              { stage: 1, input: chunks.length, output: firstStage.results.length },
              { stage: 2, input: firstStage.results.length, output: secondStage.results.length }
            ]
          }
        }
      }

      // Single-stage reranking
      return await this.rerankChunks(processedQuery, processedChunks, { topN, ...options })
      
    } catch (error) {
      console.error('Error in advanced reranking:', error.message)
      throw new Error(`Advanced reranking failed: ${error.message}`)
    }
  }

  /**
   * Contextual reranking - considers conversation history or document context
   */
  async contextualRerank(query, chunks, context = '', options = {}) {
    try {
      // Combine query with context for better relevance assessment
      const contextualQuery = context.trim() 
        ? `Context: ${context}\n\nQuery: ${query}`
        : query

      console.log(`Contextual reranking with context length: ${context.length} chars`)
      
      return await this.rerankChunks(contextualQuery, chunks, {
        ...options,
        contextProvided: context.length > 0
      })
      
    } catch (error) {
      console.error('Error in contextual reranking:', error.message)
      throw new Error(`Contextual reranking failed: ${error.message}`)
    }
  }

  /**
   * Batch reranking for multiple queries
   */
  async batchRerank(queryChunkPairs, options = {}) {
    const results = []
    const errors = []
    
    console.log(`Starting batch reranking for ${queryChunkPairs.length} query-chunk pairs`)
    
    for (let i = 0; i < queryChunkPairs.length; i++) {
      const { query, chunks, metadata = {} } = queryChunkPairs[i]
      
      try {
        console.log(`Processing batch item ${i + 1}/${queryChunkPairs.length}`)
        
        const result = await this.rerankChunks(query, chunks, options)
        results.push({
          index: i,
          metadata,
          ...result
        })
        
        // Small delay to respect rate limits
        if (i < queryChunkPairs.length - 1) {
          await this.delay(100)
        }
        
      } catch (error) {
        console.error(`Error processing batch item ${i + 1}:`, error.message)
        errors.push({
          index: i,
          query: query.substring(0, 50),
          error: error.message,
          metadata
        })
      }
    }
    
    return {
      successful: results.length,
      failed: errors.length,
      results,
      errors
    }
  }

  /**
   * Call Cohere Rerank API with retry logic
   */
  async callCohereRerank(query, documents, options = {}, attempt = 1) {
    try {
      const startTime = Date.now()
      
      const response = await cohere.v2.rerank({
        query: query.trim(),
        documents,
        model: options.model || this.model,
        topN: options.topN || this.defaultTopN,
        returnDocuments: options.returnDocuments !== false
      })
      
      const endTime = Date.now()
      
      // Add processing time to response
      response.processingTime = endTime - startTime
      
      return response
      
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.log(`Retrying Cohere rerank (attempt ${attempt + 1}/${this.retryAttempts})`)
        await this.delay(this.retryDelay * attempt)
        return this.callCohereRerank(query, documents, options, attempt + 1)
      }
      
      // Handle specific Cohere API errors
      if (error.message.includes('rate limit')) {
        throw new Error('Cohere API rate limit exceeded. Please try again later.')
      } else if (error.message.includes('invalid')) {
        throw new Error('Invalid request to Cohere API. Check query and documents.')
      } else {
        throw new Error(`Cohere API error: ${error.message}`)
      }
    }
  }

  /**
   * Prepare documents for reranking - format and truncate as needed
   */
  prepareDocuments(chunks, truncateChunks = true) {
    return chunks.map((chunk, index) => {
      let content = chunk.content || chunk.text || ''
      
      // Truncate if necessary to stay within API limits
      if (truncateChunks && content.length > this.maxChunkLength) {
        content = content.substring(0, this.maxChunkLength) + '...'
      }
      
      // Cohere v2 expects documents with 'text' field
      return {
        text: content
      }
    })
  }

  /**
   * Process Cohere rerank results and merge with original chunk data
   */
  processRerankResults(rerankResponse, originalChunks, options = {}) {
    const { includeScores = true, includeOriginalRank = true, query } = options
    
    return rerankResponse.results.map((result, newRank) => {
      // In Cohere v2, the index is directly available
      const originalIndex = result.index
      const originalChunk = originalChunks[originalIndex]
      
      const rerankedChunk = {
        ...originalChunk,
        content: result.document?.text || originalChunk.content,
        rerankScore: result.relevanceScore,
        rerankRank: newRank + 1
      }
      
      // Add original ranking information
      if (includeOriginalRank) {
        rerankedChunk.originalRank = originalIndex + 1
        rerankedChunk.rankImprovement = (originalIndex + 1) - (newRank + 1)
      }
      
      // Add metadata
      rerankedChunk.metadata = {
        ...originalChunk.metadata,
        rerankModel: this.model,
        rerankScore: result.relevanceScore,
        originalSimilarity: originalChunk.similarity,
        scoreImprovement: result.relevanceScore - (originalChunk.similarity || 0),
        retrievalMethod: 'reranked'
      }
      
      return rerankedChunk
    })
  }

  /**
   * Calculate reranking statistics and quality metrics
   */
  calculateRerankingStats(originalChunks, rerankedChunks) {
    const rerankScores = rerankedChunks.map(chunk => chunk.rerankScore)
    const originalSimilarities = originalChunks.map(chunk => chunk.similarity || 0)
    
    // Calculate rank changes
    const rankChanges = rerankedChunks.map(chunk => chunk.rankImprovement || 0)
    const significantChanges = rankChanges.filter(change => Math.abs(change) >= 2).length
    
    // Calculate score improvements
    const scoreImprovements = rerankedChunks.map(chunk => 
      chunk.rerankScore - (chunk.originalSimilarity || 0)
    )
    
    return {
      avgRerankScore: rerankScores.reduce((sum, score) => sum + score, 0) / rerankScores.length,
      maxRerankScore: Math.max(...rerankScores),
      minRerankScore: Math.min(...rerankScores),
      avgOriginalSimilarity: originalSimilarities.reduce((sum, sim) => sum + sim, 0) / originalSimilarities.length,
      avgRankChange: rankChanges.reduce((sum, change) => sum + Math.abs(change), 0) / rankChanges.length,
      significantRankChanges: significantChanges,
      avgScoreImprovement: scoreImprovements.reduce((sum, imp) => sum + imp, 0) / scoreImprovements.length,
      reorderingRate: significantChanges / rerankedChunks.length,
      processingTime: 0 // Will be set by caller
    }
  }

  /**
   * Expand query using top retrieved chunks (simple implementation)
   */
  async expandQuery(originalQuery, topChunks) {
    // Extract key terms from top chunks
    const keyTerms = topChunks
      .map(chunk => chunk.content.split(/\s+/).slice(0, 10).join(' '))
      .join(' ')
      .split(/\s+/)
      .filter(term => term.length > 3)
      .slice(0, 10)
      .join(' ')
    
    return `${originalQuery} ${keyTerms}`.trim()
  }

  /**
   * Validate inputs for reranking
   */
  validateInputs(query, chunks, topN) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Query is required and must be a non-empty string')
    }
    
    if (!Array.isArray(chunks) || chunks.length === 0) {
      throw new Error('Chunks must be a non-empty array')
    }
    
    if (topN < 1 || topN > 100) {
      throw new Error('topN must be between 1 and 100')
    }
    
    // Check if chunks have required content
    const invalidChunks = chunks.filter(chunk => 
      !chunk.content && !chunk.text
    )
    
    if (invalidChunks.length > 0) {
      throw new Error(`${invalidChunks.length} chunks missing content/text field`)
    }
  }

  /**
   * Estimate reranking cost
   */
  estimateRerankingCost(chunks, topN = this.defaultTopN) {
    // Cohere Rerank pricing: approximately $1 per 1000 searches
    // Each search can include multiple documents
    const searchCount = 1 // One search per rerank call
    const costPerSearch = 0.001 // $0.001 per search
    
    return {
      searchCount,
      documentsCount: chunks.length,
      topN,
      estimatedCost: searchCount * costPerSearch,
      costPerDocument: costPerSearch / chunks.length
    }
  }

  /**
   * Utility methods
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get reranking performance metrics
   */
  getPerformanceMetrics(results) {
    return {
      totalQueries: results.length,
      avgProcessingTime: results.reduce((sum, r) => sum + (r.metadata?.processingTime || 0), 0) / results.length,
      avgRerankScore: results.reduce((sum, r) => sum + (r.metadata?.stats?.avgRerankScore || 0), 0) / results.length,
      avgReorderingRate: results.reduce((sum, r) => sum + (r.metadata?.stats?.reorderingRate || 0), 0) / results.length
    }
  }
}

export default RerankingService