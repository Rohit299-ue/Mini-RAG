import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API key. Please set OPENAI_API_KEY environment variable.')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Configuration for embeddings
export const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  encoding_format: 'float'
}

// Test OpenAI connection
export const testOpenAIConnection = async () => {
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