/**
 * Mock Embedding Service
 * Provides dummy embeddings when OpenAI is not available
 * This allows the system to function for testing without OpenAI
 */

/**
 * Generate a mock embedding vector (1536 dimensions)
 * This creates a deterministic but meaningless embedding for testing
 */
export function generateMockEmbedding(text) {
  // Create a simple hash-based mock embedding
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Generate 1536 dimensional vector based on the hash
  const embedding = []
  for (let i = 0; i < 1536; i++) {
    // Use hash and index to generate pseudo-random values between -1 and 1
    const seed = hash + i
    const value = (Math.sin(seed) * 10000) % 2 - 1
    embedding.push(value)
  }
  
  return embedding
}

/**
 * Mock embedding service that mimics OpenAI's API
 */
export async function createMockEmbedding(text) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return {
    data: [{
      embedding: generateMockEmbedding(text),
      index: 0
    }],
    model: 'mock-embedding-model',
    usage: {
      prompt_tokens: text.split(' ').length,
      total_tokens: text.split(' ').length
    }
  }
}

console.log('⚠️  Using mock embedding service - search results will not be meaningful')