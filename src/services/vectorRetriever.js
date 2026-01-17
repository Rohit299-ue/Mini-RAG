import { supabase } from '../config/database.js'
import EmbeddingService from './embeddingService.js'
import RerankingService from './rerankingService.js'

class VectorRetriever {
  constructor() {
    this.embeddingService = new EmbeddingService()
    this.rerankingService = new RerankingService()
    this.defaultTopK = 50 // Retrieve more candidates for MMR
    this.defaultFinalK = 10 // Final number of results after MMR
    this.defaultLambda = 0.7 // Balance between relevance and diversity (0.5-0.8 typical)
    this.defaultThreshold = 0.3 // Minimum similarity threshold
  }

  /**
   * Complete retrieval pipeline with MMR and reranking
   */
  async retrieveWithMMRAndRerank(query, options = {}) {
    const {
      topK = this.defaultTopK,
      finalK = this.defaultFinalK,
      rerankTopN = 5, // Final number after reranking
      lambda = this.defaultLambda,
      threshold = this.defaultThreshold,
      source = null,
      section = null,
      includeMetadata = true,
      useReranking = true
    } = options

    try {
      console.log(`Starting complete retrieval pipeline for query: "${query.substring(0, 50)}..."`)
      
      // Step 1: MMR Retrieval (get diverse, relevant candidates)
      const mmrResults = await this.retrieveWithMMR(query, {
        topK,
        finalK,
        lambda,
        threshold,
        source,
        section,
        includeMetadata: false // We'll add metadata after reranking
      })

      if (!useReranking || mmrResults.results.length === 0) {
        return mmrResults
      }

      // Step 2: Reranking (refine relevance with cross-attention)
      console.log(`Reranking ${mmrResults.results.length} MMR results...`)
      const rerankResults = await this.rerankingService.rerankChunks(
        query, 
        mmrResults.results, 
        { 
          topN: Math.min(rerankTopN, mmrResults.results.length),
          includeOriginalRank: true 
        }
      )

      // Step 3: Format final results
      const finalResults = this.formatResults(rerankResults.results, includeMetadata)

      console.log(`Complete pipeline: ${topK} candidates → ${mmrResults.results.length} MMR → ${rerankResults.results.length} reranked`)

      return {
        query,
        results: finalResults,
        metadata: {
          pipeline: 'mmr_rerank',
          mmrMetadata: mmrResults.metadata,
          rerankMetadata: rerankResults.metadata,
          totalCandidates: mmrResults.metadata.candidatesFound,
          mmrResults: mmrResults.results.length,
          finalResults: rerankResults.results.length,
          avgRerankScore: rerankResults.metadata.stats.avgRerankScore,
          reorderingRate: rerankResults.metadata.stats.reorderingRate,
          parameters: { topK, finalK, rerankTopN, lambda, threshold }
        }
      }
      
    } catch (error) {
      console.error('Error in complete retrieval pipeline:', error.message)
      throw new Error(`Complete retrieval failed: ${error.message}`)
    }
  }
  /**
   * Main retrieval method with MMR
   */
  async retrieveWithMMR(query, options = {}) {
    const {
      topK = this.defaultTopK,
      finalK = this.defaultFinalK,
      lambda = this.defaultLambda,
      threshold = this.defaultThreshold,
      source = null,
      section = null,
      includeMetadata = true
    } = options

    try {
      console.log(`Starting MMR retrieval for query: "${query.substring(0, 50)}..."`)
      
      // Step 1: Generate query embedding
      const queryEmbedding = await this.embeddingService.generateEmbedding(query)
      
      // Step 2: Retrieve top-k candidates using similarity search
      const candidates = await this.retrieveTopKCandidates(queryEmbedding, {
        topK,
        threshold,
        source,
        section
      })
      
      if (candidates.length === 0) {
        return {
          query,
          results: [],
          metadata: {
            candidatesFound: 0,
            finalResults: 0,
            mmrApplied: false,
            parameters: { topK, finalK, lambda, threshold }
          }
        }
      }
      
      // Step 3: Apply MMR to diversify results
      const mmrResults = this.applyMMR(
        queryEmbedding,
        candidates,
        finalK,
        lambda
      )
      
      // Step 4: Format results
      const formattedResults = this.formatResults(mmrResults, includeMetadata)
      
      console.log(`MMR retrieval completed: ${candidates.length} candidates → ${mmrResults.length} final results`)
      
      return {
        query,
        results: formattedResults,
        metadata: {
          candidatesFound: candidates.length,
          finalResults: mmrResults.length,
          mmrApplied: true,
          parameters: { topK, finalK, lambda, threshold },
          avgSimilarity: this.calculateAverageSimilarity(mmrResults),
          diversityScore: this.calculateDiversityScore(mmrResults)
        }
      }
      
    } catch (error) {
      console.error('Error in MMR retrieval:', error.message)
      throw new Error(`Vector retrieval failed: ${error.message}`)
    }
  }

  /**
   * Retrieve top-k candidates from Supabase using vector similarity
   */
  async retrieveTopKCandidates(queryEmbedding, options = {}) {
    const {
      topK = this.defaultTopK,
      threshold = this.defaultThreshold,
      source = null,
      section = null
    } = options

    try {
      const { data, error } = await supabase.rpc('search_similar_documents', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: topK,
        filter_source: source,
        filter_section: section
      })

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      // Add embeddings to candidates for MMR calculation
      const candidatesWithEmbeddings = data.map(candidate => ({
        ...candidate,
        embedding: candidate.embedding || null,
        queryEmbedding: queryEmbedding
      }))

      return candidatesWithEmbeddings
      
    } catch (error) {
      console.error('Error retrieving candidates:', error.message)
      throw error
    }
  }

  /**
   * Apply Maximal Marginal Relevance (MMR) algorithm
   * MMR = λ * Sim(q, d) - (1-λ) * max(Sim(d, d_i)) for d_i in selected
   */
  applyMMR(queryEmbedding, candidates, finalK, lambda = 0.7) {
    if (candidates.length <= finalK) {
      return candidates
    }

    const selected = []
    const remaining = [...candidates]

    // Always select the most relevant document first
    const mostRelevant = remaining.reduce((best, current) => 
      current.similarity > best.similarity ? current : best
    )
    
    selected.push(mostRelevant)
    remaining.splice(remaining.indexOf(mostRelevant), 1)

    // Select remaining documents using MMR
    while (selected.length < finalK && remaining.length > 0) {
      let bestCandidate = null
      let bestScore = -Infinity

      for (const candidate of remaining) {
        // Calculate relevance score (similarity to query)
        const relevanceScore = candidate.similarity

        // Calculate maximum similarity to already selected documents
        let maxSimilarityToSelected = 0
        for (const selectedDoc of selected) {
          if (candidate.embedding && selectedDoc.embedding) {
            const similarity = this.embeddingService.cosineSimilarity(
              candidate.embedding,
              selectedDoc.embedding
            )
            maxSimilarityToSelected = Math.max(maxSimilarityToSelected, similarity)
          }
        }

        // Calculate MMR score
        const mmrScore = lambda * relevanceScore - (1 - lambda) * maxSimilarityToSelected

        if (mmrScore > bestScore) {
          bestScore = mmrScore
          bestCandidate = candidate
        }
      }

      if (bestCandidate) {
        selected.push({
          ...bestCandidate,
          mmrScore: bestScore
        })
        remaining.splice(remaining.indexOf(bestCandidate), 1)
      } else {
        break // No more candidates
      }
    }

    return selected
  }

  /**
   * Hybrid retrieval with reranking
   */
  async hybridRetrieveWithRerank(query, options = {}) {
    const {
      denseWeight = 0.7,
      sparseWeight = 0.3,
      rerankTopN = 5,
      useReranking = true,
      ...retrievalOptions
    } = options

    try {
      // Get hybrid results
      const hybridResults = await this.hybridRetrieve(query, {
        denseWeight,
        sparseWeight,
        ...retrievalOptions
      })

      if (!useReranking || hybridResults.results.length === 0) {
        return hybridResults
      }

      // Apply reranking to hybrid results
      const rerankResults = await this.rerankingService.rerankChunks(
        query,
        hybridResults.results,
        { topN: Math.min(rerankTopN, hybridResults.results.length) }
      )

      return {
        query,
        results: rerankResults.results,
        metadata: {
          pipeline: 'hybrid_rerank',
          hybridMetadata: hybridResults.metadata,
          rerankMetadata: rerankResults.metadata,
          finalResults: rerankResults.results.length
        }
      }

    } catch (error) {
      console.error('Error in hybrid retrieval with reranking:', error.message)
      throw new Error(`Hybrid retrieval with reranking failed: ${error.message}`)
    }
  }
  /**
   * Hybrid retrieval combining dense and sparse search
   */
  async hybridRetrieve(query, options = {}) {
    const {
      denseWeight = 0.7,
      sparseWeight = 0.3,
      ...retrievalOptions
    } = options

    try {
      // Dense vector retrieval
      const denseResults = await this.retrieveWithMMR(query, {
        ...retrievalOptions,
        finalK: Math.ceil(retrievalOptions.finalK * 1.5) // Get more for fusion
      })

      // Sparse keyword search (using PostgreSQL full-text search)
      const sparseResults = await this.keywordSearch(query, {
        limit: Math.ceil(retrievalOptions.finalK * 1.5)
      })

      // Fusion of results using Reciprocal Rank Fusion (RRF)
      const fusedResults = this.reciprocalRankFusion(
        denseResults.results,
        sparseResults,
        denseWeight,
        sparseWeight
      )

      return {
        query,
        results: fusedResults.slice(0, retrievalOptions.finalK || this.defaultFinalK),
        metadata: {
          denseResultsCount: denseResults.results.length,
          sparseResultsCount: sparseResults.length,
          fusionApplied: true,
          weights: { dense: denseWeight, sparse: sparseWeight }
        }
      }

    } catch (error) {
      console.error('Error in hybrid retrieval:', error.message)
      throw new Error(`Hybrid retrieval failed: ${error.message}`)
    }
  }

  /**
   * Keyword-based search using PostgreSQL full-text search
   */
  async keywordSearch(query, options = {}) {
    const { limit = 20, source = null, section = null } = options

    try {
      let queryBuilder = supabase
        .from('documents')
        .select('*')
        .textSearch('content', query, { type: 'websearch' })
        .limit(limit)

      if (source) {
        queryBuilder = queryBuilder.eq('source', source)
      }

      if (section) {
        queryBuilder = queryBuilder.eq('section', section)
      }

      const { data, error } = await queryBuilder

      if (error) throw error

      return data.map((doc, index) => ({
        ...doc,
        keywordScore: 1 / (index + 1), // Simple ranking score
        retrievalMethod: 'keyword'
      }))

    } catch (error) {
      console.error('Error in keyword search:', error.message)
      return [] // Return empty array if keyword search fails
    }
  }

  /**
   * Reciprocal Rank Fusion for combining dense and sparse results
   */
  reciprocalRankFusion(denseResults, sparseResults, denseWeight = 0.7, sparseWeight = 0.3, k = 60) {
    const scoreMap = new Map()

    // Score dense results
    denseResults.forEach((result, index) => {
      const rrf = denseWeight / (k + index + 1)
      scoreMap.set(result.id, {
        ...result,
        rrfScore: rrf,
        denseRank: index + 1,
        sparseRank: null
      })
    })

    // Add sparse results
    sparseResults.forEach((result, index) => {
      const rrf = sparseWeight / (k + index + 1)
      const existing = scoreMap.get(result.id)
      
      if (existing) {
        existing.rrfScore += rrf
        existing.sparseRank = index + 1
      } else {
        scoreMap.set(result.id, {
          ...result,
          rrfScore: rrf,
          denseRank: null,
          sparseRank: index + 1
        })
      }
    })

    // Sort by RRF score and return
    return Array.from(scoreMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
  }

  /**
   * Contextual retrieval with query expansion
   */
  async contextualRetrieve(query, context = '', options = {}) {
    try {
      // Expand query with context
      const expandedQuery = context 
        ? `${context}\n\nQuery: ${query}`
        : query

      // Use expanded query for retrieval
      return await this.retrieveWithMMR(expandedQuery, options)

    } catch (error) {
      console.error('Error in contextual retrieval:', error.message)
      throw new Error(`Contextual retrieval failed: ${error.message}`)
    }
  }

  /**
   * Multi-step retrieval with query decomposition
   */
  async multiStepRetrieve(query, options = {}) {
    const { steps = 2, finalK = this.defaultFinalK } = options

    try {
      let allResults = []
      let currentQuery = query

      for (let step = 0; step < steps; step++) {
        console.log(`Retrieval step ${step + 1}: "${currentQuery.substring(0, 50)}..."`)
        
        const stepResults = await this.retrieveWithMMR(currentQuery, {
          ...options,
          finalK: Math.ceil(finalK / steps)
        })

        allResults.push(...stepResults.results)

        // Generate follow-up query based on results (simplified)
        if (step < steps - 1 && stepResults.results.length > 0) {
          const topResult = stepResults.results[0]
          currentQuery = `${query} ${topResult.content.substring(0, 100)}`
        }
      }

      // Remove duplicates and re-rank
      const uniqueResults = this.removeDuplicates(allResults)
      const rerankedResults = uniqueResults
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .slice(0, finalK)

      return {
        query,
        results: rerankedResults,
        metadata: {
          steps,
          totalCandidates: allResults.length,
          uniqueResults: uniqueResults.length,
          finalResults: rerankedResults.length
        }
      }

    } catch (error) {
      console.error('Error in multi-step retrieval:', error.message)
      throw new Error(`Multi-step retrieval failed: ${error.message}`)
    }
  }

  /**
   * Utility methods
   */
  formatResults(results, includeMetadata = true) {
    return results.map((result, index) => {
      const formatted = {
        id: result.id,
        content: result.content,
        source: result.source,
        title: result.title,
        section: result.section,
        position: result.position,
        similarity: result.similarity,
        rank: index + 1
      }

      if (includeMetadata) {
        formatted.metadata = {
          mmrScore: result.mmrScore,
          tokenCount: result.content ? result.content.split(/\s+/).length : 0,
          contentLength: result.content ? result.content.length : 0,
          retrievalMethod: result.retrievalMethod || 'vector_mmr'
        }
      }

      return formatted
    })
  }

  calculateAverageSimilarity(results) {
    if (results.length === 0) return 0
    const sum = results.reduce((acc, result) => acc + (result.similarity || 0), 0)
    return sum / results.length
  }

  calculateDiversityScore(results) {
    if (results.length <= 1) return 1

    let totalSimilarity = 0
    let comparisons = 0

    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        if (results[i].embedding && results[j].embedding) {
          const similarity = this.embeddingService.cosineSimilarity(
            results[i].embedding,
            results[j].embedding
          )
          totalSimilarity += similarity
          comparisons++
        }
      }
    }

    // Diversity is inverse of average pairwise similarity
    const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0
    return 1 - avgSimilarity
  }

  removeDuplicates(results) {
    const seen = new Set()
    return results.filter(result => {
      if (seen.has(result.id)) {
        return false
      }
      seen.add(result.id)
      return true
    })
  }

  /**
   * Get retrieval statistics
   */
  async getRetrievalStats(timeframe = '24h') {
    try {
      // This would typically be implemented with proper logging/analytics
      // For now, return basic database stats
      const { data, error } = await supabase.rpc('get_document_stats')
      
      if (error) throw error
      
      return {
        timeframe,
        totalDocuments: data[0]?.total_documents || 0,
        uniqueSources: data[0]?.unique_sources || 0,
        avgContentLength: data[0]?.avg_content_length || 0,
        lastUpdate: data[0]?.latest_update
      }
      
    } catch (error) {
      console.error('Error getting retrieval stats:', error.message)
      throw new Error(`Failed to get stats: ${error.message}`)
    }
  }
}

export default VectorRetriever