import express from 'express'
import VectorRetriever from '../services/vectorRetriever.js'
import { validateRetrievalRequest } from '../middleware/validation.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const router = express.Router()
const vectorRetriever = new VectorRetriever()

/**
 * POST /api/retrieval/mmr
 * Retrieve documents using MMR (Maximal Marginal Relevance)
 */
router.post('/mmr', validateRetrievalRequest, asyncHandler(async (req, res) => {
  const {
    query,
    topK = 50,
    finalK = 10,
    lambda = 0.7,
    threshold = 0.3,
    source = null,
    section = null,
    includeMetadata = true
  } = req.body

  console.log(`MMR retrieval request - Query: "${query.substring(0, 50)}...", finalK: ${finalK}, lambda: ${lambda}`)

  const result = await vectorRetriever.retrieveWithMMR(query, {
    topK,
    finalK,
    lambda,
    threshold,
    source,
    section,
    includeMetadata
  })

  res.json({
    success: true,
    method: 'mmr',
    ...result
  })
}))

/**
 * POST /api/retrieval/hybrid
 * Hybrid retrieval combining dense vector search and sparse keyword search
 */
router.post('/hybrid', validateRetrievalRequest, asyncHandler(async (req, res) => {
  const {
    query,
    finalK = 10,
    denseWeight = 0.7,
    sparseWeight = 0.3,
    threshold = 0.3,
    source = null,
    section = null
  } = req.body

  console.log(`Hybrid retrieval request - Query: "${query.substring(0, 50)}...", weights: ${denseWeight}/${sparseWeight}`)

  const result = await vectorRetriever.hybridRetrieve(query, {
    finalK,
    denseWeight,
    sparseWeight,
    threshold,
    source,
    section
  })

  res.json({
    success: true,
    method: 'hybrid',
    ...result
  })
}))

/**
 * POST /api/retrieval/contextual
 * Contextual retrieval with query expansion
 */
router.post('/contextual', asyncHandler(async (req, res) => {
  const {
    query,
    context = '',
    finalK = 10,
    lambda = 0.7,
    threshold = 0.3,
    source = null,
    section = null
  } = req.body

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'query is required and must be a string'
    })
  }

  console.log(`Contextual retrieval request - Query: "${query.substring(0, 50)}...", context length: ${context.length}`)

  const result = await vectorRetriever.contextualRetrieve(query, context, {
    finalK,
    lambda,
    threshold,
    source,
    section
  })

  res.json({
    success: true,
    method: 'contextual',
    ...result
  })
}))

/**
 * POST /api/retrieval/multi-step
 * Multi-step retrieval with query decomposition
 */
router.post('/multi-step', validateRetrievalRequest, asyncHandler(async (req, res) => {
  const {
    query,
    steps = 2,
    finalK = 10,
    lambda = 0.7,
    threshold = 0.3,
    source = null,
    section = null
  } = req.body

  if (steps < 1 || steps > 5) {
    return res.status(400).json({
      success: false,
      error: 'steps must be between 1 and 5'
    })
  }

  console.log(`Multi-step retrieval request - Query: "${query.substring(0, 50)}...", steps: ${steps}`)

  const result = await vectorRetriever.multiStepRetrieve(query, {
    steps,
    finalK,
    lambda,
    threshold,
    source,
    section
  })

  res.json({
    success: true,
    method: 'multi-step',
    ...result
  })
}))

/**
 * POST /api/retrieval/compare
 * Compare different retrieval methods side by side
 */
router.post('/compare', validateRetrievalRequest, asyncHandler(async (req, res) => {
  const {
    query,
    finalK = 10,
    threshold = 0.3,
    source = null,
    section = null
  } = req.body

  console.log(`Comparison retrieval request - Query: "${query.substring(0, 50)}..."`)

  // Run multiple retrieval methods in parallel
  const [mmrResult, hybridResult] = await Promise.all([
    vectorRetriever.retrieveWithMMR(query, {
      finalK,
      threshold,
      source,
      section,
      lambda: 0.7
    }),
    vectorRetriever.hybridRetrieve(query, {
      finalK,
      threshold,
      source,
      section,
      denseWeight: 0.7,
      sparseWeight: 0.3
    })
  ])

  res.json({
    success: true,
    query,
    methods: {
      mmr: {
        results: mmrResult.results,
        metadata: mmrResult.metadata
      },
      hybrid: {
        results: hybridResult.results,
        metadata: hybridResult.metadata
      }
    },
    comparison: {
      mmrResultCount: mmrResult.results.length,
      hybridResultCount: hybridResult.results.length,
      overlapCount: this.calculateOverlap(mmrResult.results, hybridResult.results),
      avgSimilarityMMR: mmrResult.metadata.avgSimilarity,
      diversityScoreMMR: mmrResult.metadata.diversityScore
    }
  })
}))

/**
 * GET /api/retrieval/stats
 * Get retrieval statistics and performance metrics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const { timeframe = '24h' } = req.query

  const stats = await vectorRetriever.getRetrievalStats(timeframe)

  res.json({
    success: true,
    timeframe,
    data: stats
  })
}))

/**
 * POST /api/retrieval/benchmark
 * Benchmark different retrieval configurations
 */
router.post('/benchmark', validateRetrievalRequest, asyncHandler(async (req, res) => {
  const { query, configurations = [] } = req.body

  if (!Array.isArray(configurations) || configurations.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'configurations must be a non-empty array'
    })
  }

  if (configurations.length > 5) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 5 configurations allowed per benchmark'
    })
  }

  console.log(`Benchmarking ${configurations.length} configurations for query: "${query.substring(0, 50)}..."`)

  const results = []

  for (let i = 0; i < configurations.length; i++) {
    const config = configurations[i]
    const startTime = Date.now()

    try {
      const result = await vectorRetriever.retrieveWithMMR(query, config)
      const endTime = Date.now()

      results.push({
        configIndex: i,
        config,
        result: {
          results: result.results,
          metadata: result.metadata
        },
        performance: {
          executionTime: endTime - startTime,
          resultsCount: result.results.length,
          avgSimilarity: result.metadata.avgSimilarity,
          diversityScore: result.metadata.diversityScore
        }
      })
    } catch (error) {
      results.push({
        configIndex: i,
        config,
        error: error.message,
        performance: {
          executionTime: Date.now() - startTime,
          failed: true
        }
      })
    }
  }

  res.json({
    success: true,
    query,
    benchmark: {
      configurationsCount: configurations.length,
      results,
      summary: {
        successful: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length,
        avgExecutionTime: results.reduce((sum, r) => sum + r.performance.executionTime, 0) / results.length
      }
    }
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