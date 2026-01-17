import express from 'express'
import AnswerService from '../services/answerService.js'
import VectorRetriever from '../services/vectorRetriever.js'
import { validateAnswerRequest } from '../middleware/validation.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const router = express.Router()
const answerService = new AnswerService()
const vectorRetriever = new VectorRetriever()

/**
 * POST /api/answers/generate
 * Generate answer with citations from query and provided chunks
 */
router.post('/generate', validateAnswerRequest, asyncHandler(async (req, res) => {
  const {
    query,
    chunks,
    model = 'gpt-4-turbo-preview',
    maxTokens = 1000,
    temperature = 0.1,
    includeSourceSnippets = true,
    strictCitations = true
  } = req.body

  console.log(`Generating answer for query: "${query.substring(0, 50)}..." with ${chunks.length} chunks`)

  const result = await answerService.generateAnswer(query, chunks, {
    model,
    maxTokens,
    temperature,
    includeSourceSnippets,
    strictCitations
  })

  res.json({
    success: true,
    method: 'llm_answer_generation',
    ...result
  })
}))

/**
 * POST /api/answers/conversational
 * Generate conversational answer with chat history context
 */
router.post('/conversational', asyncHandler(async (req, res) => {
  const {
    query,
    chunks,
    conversationHistory = [],
    model = 'gpt-4-turbo-preview',
    maxTokens = 1000,
    temperature = 0.2
  } = req.body

  if (!query || !Array.isArray(chunks)) {
    return res.status(400).json({
      success: false,
      error: 'query and chunks are required'
    })
  }

  console.log(`Generating conversational answer with ${conversationHistory.length} history items`)

  const result = await answerService.generateConversationalAnswer(
    query, 
    chunks, 
    conversationHistory,
    { model, maxTokens, temperature }
  )

  res.json({
    success: true,
    method: 'conversational_answer',
    ...result
  })
}))

/**
 * POST /api/answers/custom
 * Generate answer with custom instructions
 */
router.post('/custom', asyncHandler(async (req, res) => {
  const {
    query,
    chunks,
    instructions,
    model = 'gpt-4-turbo-preview',
    maxTokens = 1000,
    temperature = 0.1
  } = req.body

  if (!query || !Array.isArray(chunks) || !instructions) {
    return res.status(400).json({
      success: false,
      error: 'query, chunks, and instructions are required'
    })
  }

  console.log(`Generating custom answer with instructions: "${instructions.substring(0, 50)}..."`)

  const result = await answerService.generateCustomAnswer(query, chunks, instructions, {
    model,
    maxTokens,
    temperature
  })

  res.json({
    success: true,
    method: 'custom_answer',
    ...result
  })
}))

/**
 * POST /api/answers/complete-rag
 * Complete RAG pipeline: retrieve → rerank → answer
 */
router.post('/complete-rag', asyncHandler(async (req, res) => {
  const {
    query,
    topK = 50,
    finalK = 10,
    rerankTopN = 5,
    lambda = 0.7,
    threshold = 0.3,
    source = null,
    section = null,
    useReranking = true,
    model = 'gpt-4-turbo-preview',
    maxTokens = 1000,
    temperature = 0.1,
    strictCitations = true
  } = req.body

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'query is required and must be a string'
    })
  }

  console.log(`Complete RAG pipeline for query: "${query.substring(0, 50)}..."`)

  try {
    // Step 1: Retrieve and rerank documents
    const retrievalResult = await vectorRetriever.retrieveWithMMRAndRerank(query, {
      topK,
      finalK,
      rerankTopN,
      lambda,
      threshold,
      source,
      section,
      useReranking
    })

    if (retrievalResult.results.length === 0) {
      return res.json({
        success: true,
        method: 'complete_rag',
        query,
        answer: "I couldn't find any relevant information to answer your question.",
        citations: [],
        sources: [],
        metadata: {
          hasAnswer: false,
          confidence: 0.1,
          responseType: 'no_relevant_documents',
          retrievalMetadata: retrievalResult.metadata
        }
      })
    }

    // Step 2: Generate answer with citations
    const answerResult = await answerService.generateAnswer(query, retrievalResult.results, {
      model,
      maxTokens,
      temperature,
      strictCitations
    })

    // Step 3: Combine results
    const completeResult = {
      ...answerResult,
      metadata: {
        ...answerResult.metadata,
        retrievalMetadata: retrievalResult.metadata,
        pipeline: 'complete_rag'
      }
    }

    res.json({
      success: true,
      method: 'complete_rag',
      ...completeResult
    })

  } catch (error) {
    console.error('Error in complete RAG pipeline:', error.message)
    res.status(500).json({
      success: false,
      error: 'Complete RAG pipeline failed',
      details: error.message
    })
  }
}))

/**
 * POST /api/answers/batch
 * Generate answers for multiple queries
 */
router.post('/batch', asyncHandler(async (req, res) => {
  const { queries, globalChunks = [], options = {} } = req.body

  if (!Array.isArray(queries) || queries.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'queries must be a non-empty array'
    })
  }

  if (queries.length > 10) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 10 queries allowed per batch'
    })
  }

  console.log(`Batch answer generation for ${queries.length} queries`)

  const results = []
  const errors = []

  for (let i = 0; i < queries.length; i++) {
    const queryItem = queries[i]
    const { query, chunks = globalChunks } = queryItem

    try {
      console.log(`Processing batch query ${i + 1}/${queries.length}`)

      const result = await answerService.generateAnswer(query, chunks, options)
      results.push({
        index: i,
        query,
        ...result
      })

      // Small delay to respect rate limits
      if (i < queries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

    } catch (error) {
      console.error(`Error processing batch query ${i + 1}:`, error.message)
      errors.push({
        index: i,
        query,
        error: error.message
      })
    }
  }

  res.json({
    success: true,
    method: 'batch_answer',
    successful: results.length,
    failed: errors.length,
    results,
    errors
  })
}))

/**
 * POST /api/answers/evaluate
 * Evaluate answer quality and citations
 */
router.post('/evaluate', asyncHandler(async (req, res) => {
  const { query, answer, chunks, expectedAnswer = null } = req.body

  if (!query || !answer || !Array.isArray(chunks)) {
    return res.status(400).json({
      success: false,
      error: 'query, answer, and chunks are required'
    })
  }

  // Extract citations from answer
  const citationRegex = /\[(\d+)\]/g
  const citations = []
  let match

  while ((match = citationRegex.exec(answer)) !== null) {
    citations.push(parseInt(match[1]))
  }

  // Evaluate citation coverage
  const validCitations = citations.filter(num => num >= 1 && num <= chunks.length)
  const citationCoverage = validCitations.length / Math.max(citations.length, 1)

  // Evaluate answer completeness
  const answerLength = answer.length
  const hasNoAnswerPhrase = answer.toLowerCase().includes("don't have enough information")

  // Calculate quality metrics
  const evaluation = {
    query,
    answer,
    metrics: {
      citationCount: citations.length,
      validCitations: validCitations.length,
      citationCoverage,
      answerLength,
      hasNoAnswerPhrase,
      chunksUsed: validCitations.length,
      chunksProvided: chunks.length,
      chunkUtilization: validCitations.length / chunks.length
    },
    citations: validCitations.map(num => ({
      number: num,
      chunk: chunks[num - 1] ? {
        source: chunks[num - 1].source,
        title: chunks[num - 1].title,
        snippet: chunks[num - 1].content.substring(0, 100) + '...'
      } : null
    })),
    quality: {
      hasCitations: citations.length > 0,
      allCitationsValid: citationCoverage === 1.0,
      reasonableLength: answerLength >= 50 && answerLength <= 2000,
      usesMultipleSources: validCitations.length > 1
    }
  }

  res.json({
    success: true,
    method: 'answer_evaluation',
    ...evaluation
  })
}))

/**
 * GET /api/answers/stats
 * Get answer generation statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  // This would typically pull from a metrics store
  // For now, return sample statistics
  const sampleStats = {
    totalAnswers: 2847,
    answerRate: 0.89,
    avgConfidence: 0.76,
    avgCitations: 2.3,
    avgProcessingTime: 1250, // ms
    responseTypes: {
      answer: 2534,
      no_answer: 198,
      short_answer: 89,
      uncited_answer: 26
    },
    last24Hours: {
      answers: 156,
      avgConfidence: 0.78,
      avgProcessingTime: 1180
    }
  }

  res.json({
    success: true,
    data: sampleStats,
    timestamp: new Date().toISOString()
  })
}))

export default router