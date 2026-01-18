import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

// Make OpenAI completely optional
export const isOpenAIEnabled = () => !!process.env.OPENAI_API_KEY

// Only initialize OpenAI if API key is provided
export const openai = isOpenAIEnabled() ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// Log the status
if (isOpenAIEnabled()) {
  console.log('🤖 OpenAI configured')
} else {
  console.log('⚠️  OpenAI not configured - using alternative services')
}

// Configuration for embeddings
export const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  encoding_format: 'float'
}

// Test OpenAI connection
export const testOpenAIConnection = async () => {
  if (!openai) {
    console.log('⚠️  OpenAI not configured - embedding features disabled')
    return false
  }
  
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_CONFIG.model,
      input: 'test connection',
      dimensions: EMBEDDING_CONFIG.dimensions
    })
    
    if (response.data && response.data[0].embedding) {
      console.log('✅ OpenAI connection successful')
      return true
    }
    return false
  } catch (error) {
    console.error('❌ OpenAI connection failed:', error.message)
    return false
  }
}