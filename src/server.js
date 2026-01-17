import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

// Import routes and middleware
import documentRoutes from './routes/documents.js'
import retrievalRoutes from './routes/retrieval.js'
import rerankingRoutes from './routes/reranking.js'
import answerRoutes from './routes/answers.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { gracefulStartup, setupGracefulShutdown } from './utils/startup.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
})
app.use('/api/', limiter)

// Stricter rate limiting for processing endpoints
const processLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit to 10 processing requests per minute
  message: {
    success: false,
    error: 'Processing rate limit exceeded, please try again later'
  }
})
app.use('/api/documents/process', processLimiter)
app.use('/api/documents/batch-process', processLimiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Import here to avoid circular dependencies
    const { testConnection } = await import('./config/database.js')
    const { testOpenAIConnection } = await import('./config/openai.js')
    const { testCohereConnection } = await import('./config/cohere.js')
    
    const dbStatus = await testConnection()
    const openaiStatus = await testOpenAIConnection()
    const cohereStatus = await testCohereConnection()
    
    const criticalServices = dbStatus && openaiStatus
    const status = criticalServices ? 'healthy' : 'unhealthy'
    const statusCode = status === 'healthy' ? 200 : 503
    
    res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        openai: openaiStatus ? 'connected' : 'disconnected',
        cohere: cohereStatus ? 'connected' : 'disconnected'
      },
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

// API routes
app.use('/api/documents', documentRoutes)
app.use('/api/retrieval', retrievalRoutes)
app.use('/api/reranking', rerankingRoutes)
app.use('/api/answers', answerRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'RAG Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      documents: '/api/documents',
      process: '/api/documents/process',
      search: '/api/documents/search',
      retrieval: '/api/retrieval',
      mmr: '/api/retrieval/mmr',
      hybrid: '/api/retrieval/hybrid',
      reranking: '/api/reranking',
      retrieveAndRerank: '/api/reranking/retrieve-and-rerank',
      answers: '/api/answers',
      completeRAG: '/api/answers/complete-rag'
    },
    documentation: 'See README.md for API documentation'
  })
})

// Error handling middleware (must be last)
app.use(notFoundHandler)
app.use(errorHandler)

// Start server
const startServer = async () => {
  try {
    // Setup graceful shutdown handlers
    setupGracefulShutdown()
    
    // Perform graceful startup with all checks
    const startupResult = await gracefulStartup()
    
    if (!startupResult.success) {
      console.error('❌ Startup failed:', startupResult.error)
      process.exit(1)
    }
    
    // Start the HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 RAG Backend server running on port ${PORT}`)
      console.log(`📚 API Documentation: http://localhost:${PORT}`)
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`)
      console.log(`📝 Process Text: POST http://localhost:${PORT}/api/documents/process`)
      console.log(`🔍 Search: POST http://localhost:${PORT}/api/documents/search`)
      console.log(`🎯 MMR Retrieval: POST http://localhost:${PORT}/api/retrieval/mmr`)
      
      if (startupResult.services.cohere) {
        console.log(`🔄 Reranking: POST http://localhost:${PORT}/api/reranking/rerank`)
        console.log(`⚡ Complete Pipeline: POST http://localhost:${PORT}/api/reranking/retrieve-and-rerank`)
      } else {
        console.log(`⚠️  Reranking endpoints unavailable (Cohere not connected)`)
      }
      
      console.log(`🤖 Answer Generation: POST http://localhost:${PORT}/api/answers/generate`)
      console.log(`🎯 Complete RAG: POST http://localhost:${PORT}/api/answers/complete-rag`)
      
      console.log(`\n🎉 Server started successfully in ${startupResult.mode} mode!`)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

// Handle graceful shutdown
// (Handled by startup utility)

startServer()