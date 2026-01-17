import Joi from 'joi'

// Validation schemas
const processTextSchema = Joi.object({
  text: Joi.string().required().min(1).max(1000000), // 1MB limit
  metadata: Joi.object({
    source: Joi.string().optional(),
    title: Joi.string().optional(),
    section: Joi.string().optional(),
    author: Joi.string().optional(),
    category: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    url: Joi.string().uri().optional(),
    createdAt: Joi.date().optional()
  }).optional()
})

const searchRequestSchema = Joi.object({
  query: Joi.string().required().min(1).max(1000),
  threshold: Joi.number().min(0).max(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  source: Joi.string().optional(),
  section: Joi.string().optional()
})

const retrievalRequestSchema = Joi.object({
  query: Joi.string().required().min(1).max(1000),
  topK: Joi.number().integer().min(1).max(200).optional(),
  finalK: Joi.number().integer().min(1).max(50).optional(),
  lambda: Joi.number().min(0).max(1).optional(),
  threshold: Joi.number().min(0).max(1).optional(),
  source: Joi.string().optional(),
  section: Joi.string().optional(),
  includeMetadata: Joi.boolean().optional(),
  denseWeight: Joi.number().min(0).max(1).optional(),
  sparseWeight: Joi.number().min(0).max(1).optional(),
  steps: Joi.number().integer().min(1).max(5).optional()
})

const rerankRequestSchema = Joi.object({
  query: Joi.string().required().min(1).max(1000),
  chunks: Joi.array().items(Joi.object({
    id: Joi.string().optional(),
    content: Joi.string().required(),
    source: Joi.string().optional(),
    title: Joi.string().optional(),
    section: Joi.string().optional(),
    position: Joi.number().optional(),
    similarity: Joi.number().optional(),
    metadata: Joi.object().optional()
  })).required().min(1).max(100),
  topN: Joi.number().integer().min(1).max(20).optional(),
  model: Joi.string().optional(),
  includeScores: Joi.boolean().optional(),
  includeOriginalRank: Joi.boolean().optional(),
  expandQuery: Joi.boolean().optional(),
  multiStage: Joi.boolean().optional(),
  intermediateN: Joi.number().integer().min(5).max(50).optional()
})

const answerRequestSchema = Joi.object({
  query: Joi.string().required().min(1).max(2000),
  chunks: Joi.array().items(Joi.object({
    id: Joi.string().optional(),
    content: Joi.string().required(),
    source: Joi.string().optional(),
    title: Joi.string().optional(),
    section: Joi.string().optional(),
    position: Joi.number().optional(),
    similarity: Joi.number().optional(),
    rerankScore: Joi.number().optional(),
    metadata: Joi.object().optional()
  })).required().min(0).max(50),
  model: Joi.string().valid('gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo').optional(),
  maxTokens: Joi.number().integer().min(100).max(4000).optional(),
  temperature: Joi.number().min(0).max(2).optional(),
  includeSourceSnippets: Joi.boolean().optional(),
  strictCitations: Joi.boolean().optional(),
  conversationHistory: Joi.array().items(Joi.object({
    query: Joi.string().required(),
    answer: Joi.string().required()
  })).optional(),
  instructions: Joi.string().max(1000).optional()
})

// Validation middleware functions
export const validateProcessTextRequest = (req, res, next) => {
  const { error, value } = processTextSchema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    })
  }
  
  req.body = value
  next()
}

export const validateSearchRequest = (req, res, next) => {
  const { error, value } = searchRequestSchema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    })
  }
  
  req.body = value
  next()
}

export const validateRetrievalRequest = (req, res, next) => {
  const { error, value } = retrievalRequestSchema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    })
  }
  
  req.body = value
  next()
}

export const validateRerankRequest = (req, res, next) => {
  const { error, value } = rerankRequestSchema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    })
  }
  
  req.body = value
  next()
}

export const validateAnswerRequest = (req, res, next) => {
  const { error, value } = answerRequestSchema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    })
  }
  
  req.body = value
  next()
}

// Generic validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      })
    }
    
    req.body = value
    next()
  }
}