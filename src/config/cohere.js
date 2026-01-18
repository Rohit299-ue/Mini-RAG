import { CohereClientV2 } from 'cohere-ai'
import dotenv from 'dotenv'

dotenv.config()

// Make Cohere optional - only initialize if API key is provided
export const cohere = process.env.COHERE_API_KEY ? new CohereClientV2({
  token: process.env.COHERE_API_KEY,
}) : null

export const isCohereEnabled = () => !!process.env.COHERE_API_KEY

// Configuration for reranking
export const RERANK_CONFIG = {
  model: 'rerank-english-v3.0', // Latest Cohere rerank model
  topN: 5, // Default number of results to return after reranking
  maxChunksLength: 4096, // Maximum characters per chunk for reranking
  returnDocuments: true // Return the actual document content
}

// Test Cohere connection
export const testCohereConnection = async () => {
  if (!cohere) {
    console.log('⚠️  Cohere not configured - reranking features disabled')
    return false
  }
  
  try {
    // Test with a simple rerank request
    const response = await cohere.v2.rerank({
      model: RERANK_CONFIG.model,
      query: 'test connection',
      documents: [{ text: 'This is a test document for connection verification.' }],
      topN: 1,
      returnDocuments: false
    })
    
    if (response && response.results) {
      console.log('✅ Cohere connection successful')
      return true
    }
    return false
  } catch (error) {
    console.error('❌ Cohere connection failed:', error.message)
    return false
  }
}