import express from 'express'
import RerankingService from '../services/rerankingService.js'
import VectorRetriever from '../services/vectorRetriever.js'
import { validateRerankRequest } from '../middleware/validation.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const router = express.Router()
const rerankingService = new RerankingService()
const vectorRetriever = new VectorRetriever()

/**
 * POST /api/reranking/rerank
 * Rerank a set of document chunks using Cohere Rerank
 */
router.post('/rerank', validateRerankRequest, asyncHandler(async (req, res) => {
  const {
    query,
    chunks,
    topN = 5,
    model = 'rerank-english-v3.0',
    includeScores = true,
    includeOriginalRank = true
  } = req.body

  console.log(`Reranking ${chunks.length} chunks for query: "${query.substring(0, 50)}..."`)

  const result = await rerankingService.rerankChunks(query, chunks, {
    topN,
    model,
    includeScores,
    includeOriginalRank
  })

  res.json({
    success: true,
    method: 'cohere_rerank',
    ...result
  })
}))

/**
 * POST /api/reranking/advanced
 * Advanced reranking with query expansion and multi-stage processing
 */
router.post('/advanced', validateRerankRequest, asyncHandler(async (req, res) => {
  const {
    query,
    chunks,
    topN = 5,
    expandQuery = false,
    multiStage = false,
    intermediateN = 15
  } = req.body

  console.log(`Advanced reranking: expandQuery=${expandQuery}, multiStage=${multiStage}`)

  const result = await rerankingService.advancedRerank(query, chunks, {
    topN,
    expandQuery,
    multiStage,
    intermediateN
  })

  res.json({
    success: true,
    method: 'advanced_rerank',
    ...result
  })
}))

/**
 * POST /api/reranking/contextual
 * Contextual reranking with additional context
 */
router.post('/contextual', asyncHandler(async (req, res) => {
  const {
    query,
    chunks,
    context = '',
    topN = 5
  } = req.body

  if (!query || !Array.isArray(chunks)) {
    return res.status(400).json({
      success: false,
      error: 'query and chunks are required'
    })
  }

  console.log(`Contextual reranking with context length: ${context.length} chars`)

  const result = await rerankingService.contextualRerank(query, chunks, context, {
    topN
  })

  res.json({
    success: true,
    method: 'contextual_rerank',
    ...result
  })
}))

/**
 * POST /api/reranking/batch
 * Batch reranking for multiple query-chunk pairs
 */
router.post('/batch', asyncHandler(async (req, res) => {
  const { queryChunkPairs, topN = 5 } = req.body

  if (!Array.isArray(queryChunkPairs) || queryChunkPairs.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'queryChunkPairs must be a non-empty array'
    })
  }

  if (queryChunkPairs.length > 10) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 10 query-chunk pairs allowed per batch'
    })
  }

  console.log(`Batch reranking for ${queryChunkPairs.length} pairs`)

  const result = await rerankingService.batchRerank(queryChunkPairs, { topN })

  res.json({
    success: true,
    method: 'batch_rerank',
    ...result
  })
}))

/**
 * POST /api/reranking/retrieve-and-rerank
 * Complete pipeline: retrieve with MMR, then rerank top results
 */
router.post('/retrieve-and-rerank', asyncHandler(async (req, res) => {
  const {
    query,
    topK = 50,
    finalK = 10,
    rerankTopN = 5,
    lambda = 0.7,
    threshold = 0.3,
    source = null,
    section = null,
    useReranking = true
  } = req.body

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'query is required and must be a string'
    })
  }

  console.log(`Complete pipeline: retrieve → MMR → rerank for query: "${query.substring(0, 50)}..."`)

  const result = await vectorRetriever.retrieveWithMMRAndRerank(query, {
    topK,
    finalK,
    rerankTopN,
    lambda,
    threshold,
    source,
    section,
    useReranking
  })

  res.json({
    success: true,
    method: 'mmr_rerank_pipeline',
    ...result
  })
}))

/**
 * POST /api/reranking/hybrid-rerank
 * Hybrid retrieval followed by reranking
 */
router.post('/hybrid-rerank', asyncHandler(async (req, res) => {
  const {
    query,
    finalK = 10,
    rerankTopN = 5,
    denseWeight = 0.7,
    sparseWeight = 0.3,
    threshold = 0.3,
    source = null,
    section = null,
    useReranking = true
  } = req.body

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'query is required and must be a string'
    })
  }

  console.log(`Hybrid + rerank pipeline for query: "${query.substring(0, 50)}..."`)

  const result = await vectorRetriever.hybridRetrieveWithRerank(query, {
    finalK,
    rerankTopN,
    denseWeight,
    sparseWeight,
    threshold,
    source,
    section,
    useReranking
  })

  res.json({
    success: true,
    method: 'hybrid_rerank_pipeline',
    ...result
  })
}))

/**
 * POST /api/reranking/compare-methods
 * Compare retrieval with and without reranking
 */
router.post('/compare-methods', asyncHandler(async (req, res) => {
  const {
    query,
    topK = 50,
    finalK = 10,
    rerankTopN = 5,
    lambda = 0.7,
    threshold = 0.3
  } = req.body

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'query is required and must be a string'
    })
  }

  console.log(`Comparing methods for query: "${query.substring(0, 50)}..."`)

  // Run both methods in parallel
  const [mmrOnly, mmrWithRerank] = await Promise.all([
    vectorRetriever.retrieveWithMMR(query, {
      topK,
      finalK,
      lambda,
      threshold
    }),
    vectorRetriever.retrieveWithMMRAndRerank(query, {
      topK,
      finalK,
      rerankTopN,
      lambda,
      threshold,
      useReranking: true
    })
  ])

  // Calculate comparison metrics
  const comparison = {
    mmrResultsCount: mmrOnly.results.length,
    rerankResultsCount: mmrWithRerank.results.length,
    overlapCount: calculateOverlap(mmrOnly.results, mmrWithRerank.results),
    avgSimilarityMMR: mmrOnly.metadata.avgSimilarity,
    avgRerankScore: mmrWithRerank.metadata.avgRerankScore,
    reorderingRate: mmrWithRerank.metadata.reorderingRate,
    topResultChanged: mmrOnly.results[0]?.id !== mmrWithRerank.results[0]?.id
  }

  res.json({
    success: true,
    query,
    methods: {
      mmrOnly: {
        results: mmrOnly.results,
        metadata: mmrOnly.metadata
      },
      mmrWithRerank: {
        results: mmrWithRerank.results,
        metadata: mmrWithRerank.metadata
      }
    },
    comparison
  })
}))

/**
 * POST /api/reranking/estimate-cost
 * Estimate reranking cost for given chunks
 */
router.post('/estimate-cost', asyncHandler(async (req, res) => {
  const { chunks, topN = 5 } = req.body

  if (!Array.isArray(chunks)) {
    return res.status(400).json({
      success: false,
      error: 'chunks must be an array'
    })
  }

  const costEstimate = rerankingService.estimateRerankingCost(chunks, topN)

  res.json({
    success: true,
    data: {
      inputChunks: chunks.length,
      topN,
      ...costEstimate,
      formattedCost: `$${costEstimate.estimatedCost.toFixed(6)}`
    }
  })
}))

/**
 * GET /api/reranking/performance
 * Get reranking performance metrics
 */
router.get('/performance', asyncHandler(async (req, res) => {
  // This would typically pull from a metrics store
  // For now, return sample performance data
  const sampleMetrics = {
    totalQueries: 1250,
    avgProcessingTime: 145, // ms
    avgRerankScore: 0.847,
    avgReorderingRate: 0.23,
    successRate: 0.998,
    last24Hours: {
      queries: 89,
      avgProcessingTime: 142,
      errors: 0
    }
  }

  res.json({
    success: true,
    data: sampleMetrics,
    timestamp: new Date().toISOString()
  })
}))

// Helper function for overlap calculation
function calculateOverlap(results1, results2) {
  const ids1 = new Set(results1.map(r => r.id))
  const ids2 = new Set(results2.map(r => r.id))
  const intersection = new Set([...ids1].filter(id => ids2.has(id)))
  return intersection.size
}

export default router