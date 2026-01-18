/**
 * Cohere Answer Generation Service
 * Alternative to OpenAI for generating answers
 */

import { cohere, isCohereEnabled } from '../config/cohere.js'

class CohereAnswerService {
  constructor() {
    this.model = 'command-r' // Cohere's latest model
    this.maxTokens = 1000
    this.temperature = 0.1
  }

  /**
   * Generate answer using Cohere
   */
  async generateAnswer(query, context, options = {}) {
    if (!isCohereEnabled()) {
      throw new Error('Cohere is not configured')
    }

    try {
      const prompt = this.buildPrompt(query, context)
      
      const response = await cohere.v2.chat({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        stop_sequences: ['</answer>']
      })

      const answer = response.message.content[0].text
      const citations = this.extractCitations(answer, context)

      return {
        answer: this.cleanAnswer(answer),
        citations,
        model: this.model,
        usage: {
          prompt_tokens: prompt.length / 4, // Rough estimate
          completion_tokens: answer.length / 4,
          total_tokens: (prompt.length + answer.length) / 4
        }
      }
    } catch (error) {
      console.error('Error generating Cohere answer:', error.message)
      throw new Error(`Failed to generate answer: ${error.message}`)
    }
  }

  /**
   * Build prompt for Cohere
   */
  buildPrompt(query, context) {
    const contextText = context.map((chunk, index) => 
      `[${index + 1}] ${chunk.content}`
    ).join('\n\n')

    return `You are a helpful AI assistant. Answer the user's question based on the provided context. Use inline citations like [1], [2] to reference the source material.

Context:
${contextText}

Question: ${query}

Instructions:
- Answer based only on the provided context
- Use inline citations [1], [2], etc. to reference sources
- If the context doesn't contain enough information, say "I don't have enough information to answer this question."
- Be concise and accurate
- Format your response clearly

<answer>
`
  }

  /**
   * Extract citations from the answer
   */
  extractCitations(answer, context) {
    const citations = []
    const citationRegex = /\[(\d+)\]/g
    let match

    while ((match = citationRegex.exec(answer)) !== null) {
      const citationNumber = parseInt(match[1])
      const contextIndex = citationNumber - 1

      if (contextIndex >= 0 && contextIndex < context.length) {
        const chunk = context[contextIndex]
        citations.push({
          number: citationNumber,
          content: chunk.content.substring(0, 200) + '...',
          source: chunk.source || 'Unknown',
          title: chunk.title || 'Untitled',
          section: chunk.section || null
        })
      }
    }

    return citations
  }

  /**
   * Clean the answer text
   */
  cleanAnswer(answer) {
    return answer
      .replace(/<answer>/g, '')
      .replace(/<\/answer>/g, '')
      .trim()
  }

  /**
   * Test Cohere connection for answer generation
   */
  async testConnection() {
    try {
      const testAnswer = await this.generateAnswer(
        'What is AI?',
        [{ content: 'Artificial Intelligence (AI) is a branch of computer science.' }]
      )
      console.log('✅ Cohere answer generation successful')
      return true
    } catch (error) {
      console.error('❌ Cohere answer generation failed:', error.message)
      return false
    }
  }
}

export default CohereAnswerService