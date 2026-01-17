import express from 'express'
import DocumentService from '../services/documentService.js'
import { validateProcessTextRequest, validateSearchRequest } from '../middleware/validation.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const router = express.Router()
const documentService = new DocumentService()

/**
 * POST /api/documents/process
 * Process raw text input and store chunks with embeddings
 */
router.post('/process', validateProcessTextRequest, asyncHandler(async (req, res) => {
  const { text, metadata = {} } = req.body
  
  console.log(`Processing text request - Length: ${text.length} chars`)
  
  const result = await documentService.processText(text, metadata)
  
  res.status(201).json({
    success: true,
    message: 'Text processed successfully',
    data: result
  })
}))

/**
 * POST /api/documents/process-sections
 * Process text with automatic section detection
 */
router.post('/process-sections', validateProcessTextRequest, asyncHandler(async (req, res) => {
  const { text, metadata = {} } = req.body
  
  console.log(`Processing text with sections - Length: ${text.length} chars`)
  
  const result = await documentService.processTextWithSections(text, metadata)
  
  res.status(201).json({
    success: true,
    message: 'Text processed with sections successfully',
    data: result
  })
}))

/**
 * POST /api/documents/batch-process
 * Process multiple texts in batch
 */
router.post('/batch-process', asyncHandler(async (req, res) => {
  const { texts } = req.body
  
  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'texts must be a non-empty array'
    })
  }
  
  if (texts.length > 10) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 10 texts allowed per batch'
    })
  }
  
  console.log(`Processing batch of ${texts.length} texts`)
  
  const result = await documentService.batchProcessTexts(texts)
  
  res.status(201).json({
    success: true,
    message: 'Batch processing completed',
    data: result
  })
}))

/**
 * POST /api/documents/search
 * Search for similar document chunks
 */
router.post('/search', validateSearchRequest, asyncHandler(async (req, res) => {
  const { 
    query, 
    threshold = 0.7, 
    limit = 10, 
    source = null, 
    section = null 
  } = req.body
  
  console.log(`Searching for: "${query}" (threshold: ${threshold}, limit: ${limit})`)
  
  const results = await documentService.searchSimilar(query, {
    threshold,
    limit,
    source,
    section
  })
  
  res.json({
    success: true,
    query,
    resultsCount: results.length,
    data: results
  })
}))

/**
 * GET /api/documents/source/:source
 * Get all chunks for a specific source
 */
router.get('/source/:source', asyncHandler(async (req, res) => {
  const { source } = req.params
  
  const chunks = await documentService.getChunksBySource(source)
  
  res.json({
    success: true,
    source,
    chunksCount: chunks.length,
    data: chunks
  })
}))

/**
 * DELETE /api/documents/source/:source
 * Delete all chunks for a specific source
 */
router.delete('/source/:source', asyncHandler(async (req, res) => {
  const { source } = req.params
  
  const deletedCount = await documentService.deleteBySource(source)
  
  res.json({
    success: true,
    message: `Deleted ${deletedCount} chunks`,
    source,
    deletedCount
  })
}))

/**
 * GET /api/documents/stats
 * Get processing and database statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await documentService.getProcessingStats()
  
  res.json({
    success: true,
    data: stats
  })
}))

/**
 * POST /api/documents/estimate-cost
 * Estimate processing cost for given text
 */
router.post('/estimate-cost', asyncHandler(async (req, res) => {
  const { text } = req.body
  
  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'text is required and must be a string'
    })
  }
  
  const textChunker = documentService.textChunker
  const embeddingService = documentService.embeddingService
  
  // Create temporary chunks to estimate
  const chunks = textChunker.chunkText(text, {})
  const stats = textChunker.getChunkingStats(chunks)
  const estimatedCost = embeddingService.estimateCost(chunks.length, stats.avgTokens)
  
  res.json({
    success: true,
    data: {
      textLength: text.length,
      estimatedChunks: chunks.length,
      chunkingStats: stats,
      estimatedCost: {
        usd: estimatedCost,
        formatted: `$${estimatedCost.toFixed(6)}`
      }
    }
  })
}))

export default router