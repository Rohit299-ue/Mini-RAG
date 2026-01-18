import { isCohereEnabled } from '../config/cohere.js'
import CohereAnswerService from './cohereAnswerService.js'

// Dynamically import OpenAI only if needed
async function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null
  
  try {
    const { openai } = await import('../config/openai.js')
    return openai
  } catch (error) {
    console.log('⚠️  OpenAI not available:', error.message)
    return null
  }
}

/**
 * AnswerService - Generates final answers with inline citations using LLM
 * 
 * Features:
 * - Inline citations [1], [2], etc.
 * - Source snippets listed below answer
 * - Graceful handling of no-answer cases
 * - Context-aware response generation
 * - Citation validation and formatting
 */
class AnswerService {
  constructor() {
    // Initialize the appropriate answer service
    if (process.env.OPENAI_API_KEY) {
      this.provider = 'openai'
      this.model = 'gpt-4-turbo-preview'
      console.log('🤖 Using OpenAI for answer generation')
    } else if (isCohereEnabled()) {
      this.provider = 'cohere'
      this.cohereService = new CohereAnswerService()
      this.model = 'command-r'
      console.log('🔮 Using Cohere for answer generation')
    } else {
      this.provider = 'none'
      console.log('⚠️  No LLM service available - answer generation disabled')
    }
    
    this.maxTokens = 1000 // Reasonable length for answers
    this.temperature = 0.1 // Low temperature for factual accuracy
    this.retryAttempts = 3
    this.retryDelay = 1000
  }

  /**
   * Generate answer with inline citations from query and retrieved chunks
   */
  async generateAnswer(query, chunks, options = {}) {
    const {
      model = this.model,
      maxTokens = this.maxTokens,
      temperature = this.temperature,
      includeSourceSnippets = true,
      strictCitations = true,
      conversationHistory = null
    } = options

    try {
      console.log(`Generating answer for query: "${query.substring(0, 50)}..." with ${chunks.length} chunks`)

      // Validate inputs
      this.validateInputs(query, chunks)

      // Prepare context and citations
      const { contextText, citationMap } = this.prepareContext(chunks)
      
      // Check if we have sufficient context
      if (!this.hasSufficientContext(query, chunks)) {
        return this.generateNoAnswerResponse(query, chunks, 'insufficient_context')
      }

      // Build the prompt
      const prompt = this.buildAnswerPrompt(query, contextText, citationMap, {
        strictCitations,
        conversationHistory
      })

      // Generate answer using LLM
      const llmResponse = await this.callLLM(prompt, {
        model,
        maxTokens,
        temperature
      })

      // Process and validate the response
      const processedAnswer = this.processLLMResponse(llmResponse, citationMap, chunks)

      // Build final response
      const finalResponse = {
        query,
        answer: processedAnswer.answer,
        citations: processedAnswer.citations,
        sources: includeSourceSnippets ? this.formatSourceSnippets(chunks, processedAnswer.usedCitations) : [],
        metadata: {
          model,
          chunksProvided: chunks.length,
          chunksUsed: processedAnswer.usedCitations.length,
          hasAnswer: processedAnswer.hasValidAnswer,
          confidence: processedAnswer.confidence,
          responseType: processedAnswer.responseType,
          processingTime: processedAnswer.processingTime
        }
      }

      console.log(`Answer generated successfully. Used ${processedAnswer.usedCitations.length}/${chunks.length} sources`)
      
      return finalResponse

    } catch (error) {
      console.error('Error generating answer:', error.message)
      return this.generateErrorResponse(query, chunks, error)
    }
  }

  /**
   * Generate conversational answer with chat history context
   */
  async generateConversationalAnswer(query, chunks, conversationHistory, options = {}) {
    try {
      // Format conversation history
      const formattedHistory = this.formatConversationHistory(conversationHistory)
      
      return await this.generateAnswer(query, chunks, {
        ...options,
        conversationHistory: formattedHistory
      })

    } catch (error) {
      console.error('Error generating conversational answer:', error.message)
      return this.generateErrorResponse(query, chunks, error)
    }
  }

  /**
   * Generate answer with custom instructions
   */
  async generateCustomAnswer(query, chunks, instructions, options = {}) {
    try {
      const customPrompt = this.buildCustomPrompt(query, chunks, instructions)
      
      const llmResponse = await this.callLLM(customPrompt, {
        model: options.model || this.model,
        maxTokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature
      })

      const { contextText, citationMap } = this.prepareContext(chunks)
      const processedAnswer = this.processLLMResponse(llmResponse, citationMap, chunks)

      return {
        query,
        answer: processedAnswer.answer,
        citations: processedAnswer.citations,
        sources: this.formatSourceSnippets(chunks, processedAnswer.usedCitations),
        metadata: {
          customInstructions: instructions,
          ...processedAnswer
        }
      }

    } catch (error) {
      console.error('Error generating custom answer:', error.message)
      return this.generateErrorResponse(query, chunks, error)
    }
  }

  /**
   * Prepare context text and citation mapping from chunks
   */
  prepareContext(chunks) {
    const citationMap = new Map()
    let contextText = ''

    chunks.forEach((chunk, index) => {
      const citationNumber = index + 1
      const citationKey = `[${citationNumber}]`
      
      citationMap.set(citationNumber, {
        id: chunk.id,
        source: chunk.source,
        title: chunk.title,
        section: chunk.section,
        content: chunk.content,
        similarity: chunk.similarity,
        rerankScore: chunk.rerankScore
      })

      contextText += `${citationKey} ${chunk.content}\n\n`
    })

    return { contextText: contextText.trim(), citationMap }
  }

  /**
   * Build the main answer prompt with citations
   */
  buildAnswerPrompt(query, contextText, citationMap, options = {}) {
    const { strictCitations = true, conversationHistory = null } = options

    let prompt = `You are a helpful AI assistant that provides accurate, well-cited answers based on the given context.

INSTRUCTIONS:
1. Answer the user's question using ONLY the information provided in the context below
2. Include inline citations using the format [1], [2], etc. for each fact or claim
3. Use multiple citations when combining information from different sources
4. If the context doesn't contain enough information to answer the question, say "I don't have enough information to answer this question based on the provided context."
5. Be concise but comprehensive in your response
6. Maintain a helpful and professional tone

${strictCitations ? 'IMPORTANT: You MUST cite every factual claim with the appropriate [number] citation. Do not make claims without citations.' : ''}

CONTEXT:
${contextText}

${conversationHistory ? `CONVERSATION HISTORY:\n${conversationHistory}\n` : ''}

USER QUESTION: ${query}

ANSWER:`

    return prompt
  }

  /**
   * Build custom prompt with specific instructions
   */
  buildCustomPrompt(query, chunks, instructions) {
    const { contextText } = this.prepareContext(chunks)

    return `You are a helpful AI assistant. Follow these specific instructions:

${instructions}

CONTEXT:
${contextText}

USER QUESTION: ${query}

ANSWER:`
  }

  /**
   * Call LLM with retry logic
   */
  async callLLM(prompt, options = {}, attempt = 1) {
    try {
      const startTime = Date.now()

      const response = await openai.chat.completions.create({
        model: options.model || this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      })

      const endTime = Date.now()
      const processingTime = endTime - startTime

      return {
        content: response.choices[0].message.content,
        usage: response.usage,
        processingTime
      }

    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.log(`Retrying LLM call (attempt ${attempt + 1}/${this.retryAttempts})`)
        await this.delay(this.retryDelay * attempt)
        return this.callLLM(prompt, options, attempt + 1)
      }

      // Handle specific OpenAI errors
      if (error.message.includes('rate limit')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.')
      } else if (error.message.includes('context length')) {
        throw new Error('Context too long. Please try with fewer or shorter documents.')
      } else {
        throw new Error(`LLM API error: ${error.message}`)
      }
    }
  }

  /**
   * Process LLM response and extract citations
   */
  processLLMResponse(llmResponse, citationMap, chunks) {
    const answer = llmResponse.content.trim()
    
    // Extract citations from the answer
    const citationRegex = /\[(\d+)\]/g
    const foundCitations = []
    let match

    while ((match = citationRegex.exec(answer)) !== null) {
      const citationNumber = parseInt(match[1])
      if (citationMap.has(citationNumber)) {
        foundCitations.push(citationNumber)
      }
    }

    // Remove duplicates and sort
    const uniqueCitations = [...new Set(foundCitations)].sort((a, b) => a - b)

    // Build citation details
    const citations = uniqueCitations.map(num => ({
      number: num,
      ...citationMap.get(num)
    }))

    // Determine response type and confidence
    const responseAnalysis = this.analyzeResponse(answer, citations, chunks)

    return {
      answer,
      citations,
      usedCitations: uniqueCitations,
      hasValidAnswer: responseAnalysis.hasValidAnswer,
      confidence: responseAnalysis.confidence,
      responseType: responseAnalysis.responseType,
      processingTime: llmResponse.processingTime
    }
  }

  /**
   * Analyze response quality and type
   */
  analyzeResponse(answer, citations, chunks) {
    const lowerAnswer = answer.toLowerCase()
    
    // Check for no-answer indicators
    const noAnswerPhrases = [
      "i don't have enough information",
      "i cannot answer",
      "insufficient information",
      "not enough context",
      "unable to determine",
      "cannot be determined"
    ]

    const hasNoAnswerPhrase = noAnswerPhrases.some(phrase => 
      lowerAnswer.includes(phrase)
    )

    // Determine response type
    let responseType = 'answer'
    if (hasNoAnswerPhrase) {
      responseType = 'no_answer'
    } else if (citations.length === 0) {
      responseType = 'uncited_answer'
    } else if (answer.length < 50) {
      responseType = 'short_answer'
    }

    // Calculate confidence based on citations and content
    let confidence = 0.5 // Base confidence

    if (citations.length > 0) {
      confidence += 0.3 // Has citations
      confidence += Math.min(citations.length * 0.1, 0.2) // More citations = higher confidence
    }

    if (answer.length > 100) {
      confidence += 0.1 // Detailed answer
    }

    if (responseType === 'no_answer') {
      confidence = 0.1 // Low confidence for no-answer
    }

    confidence = Math.min(confidence, 1.0)

    return {
      hasValidAnswer: responseType === 'answer' && citations.length > 0,
      confidence,
      responseType
    }
  }

  /**
   * Format source snippets for display
   */
  formatSourceSnippets(chunks, usedCitationNumbers) {
    return usedCitationNumbers.map(citationNumber => {
      const chunk = chunks[citationNumber - 1] // Convert to 0-based index
      
      return {
        citation: `[${citationNumber}]`,
        title: chunk.title || 'Untitled',
        source: chunk.source,
        section: chunk.section,
        snippet: this.truncateSnippet(chunk.content, 200),
        similarity: chunk.similarity,
        rerankScore: chunk.rerankScore
      }
    })
  }

  /**
   * Truncate snippet to specified length
   */
  truncateSnippet(text, maxLength = 200) {
    if (text.length <= maxLength) {
      return text
    }
    
    // Try to break at sentence boundary
    const truncated = text.substring(0, maxLength)
    const lastSentence = truncated.lastIndexOf('.')
    
    if (lastSentence > maxLength * 0.7) {
      return truncated.substring(0, lastSentence + 1)
    }
    
    // Break at word boundary
    const lastSpace = truncated.lastIndexOf(' ')
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...'
    }
    
    return truncated + '...'
  }

  /**
   * Check if we have sufficient context to answer the query
   */
  hasSufficientContext(query, chunks) {
    if (chunks.length === 0) {
      return false
    }

    // Check if any chunk has reasonable similarity/rerank score
    const hasRelevantChunk = chunks.some(chunk => 
      (chunk.similarity && chunk.similarity > 0.3) ||
      (chunk.rerankScore && chunk.rerankScore > 0.3)
    )

    return hasRelevantChunk
  }

  /**
   * Generate no-answer response
   */
  generateNoAnswerResponse(query, chunks, reason) {
    const reasonMessages = {
      insufficient_context: "I don't have enough relevant information in the provided context to answer your question accurately.",
      no_chunks: "No relevant documents were found for your query.",
      low_relevance: "The available information doesn't seem directly relevant to your question."
    }

    return {
      query,
      answer: reasonMessages[reason] || reasonMessages.insufficient_context,
      citations: [],
      sources: [],
      metadata: {
        hasAnswer: false,
        confidence: 0.1,
        responseType: 'no_answer',
        reason,
        chunksProvided: chunks.length
      }
    }
  }

  /**
   * Generate error response
   */
  generateErrorResponse(query, chunks, error) {
    return {
      query,
      answer: "I apologize, but I encountered an error while processing your question. Please try again.",
      citations: [],
      sources: [],
      metadata: {
        hasAnswer: false,
        confidence: 0.0,
        responseType: 'error',
        error: error.message,
        chunksProvided: chunks.length
      }
    }
  }

  /**
   * Format conversation history for context
   */
  formatConversationHistory(history) {
    if (!Array.isArray(history) || history.length === 0) {
      return null
    }

    return history
      .slice(-5) // Keep last 5 exchanges
      .map(exchange => `Human: ${exchange.query}\nAssistant: ${exchange.answer}`)
      .join('\n\n')
  }

  /**
   * Validate inputs
   */
  validateInputs(query, chunks) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Query is required and must be a non-empty string')
    }

    if (!Array.isArray(chunks)) {
      throw new Error('Chunks must be an array')
    }

    // Check if chunks have required content
    const invalidChunks = chunks.filter(chunk => 
      !chunk.content && !chunk.text
    )

    if (invalidChunks.length > 0) {
      throw new Error(`${invalidChunks.length} chunks missing content field`)
    }
  }

  /**
   * Utility methods
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get answer statistics
   */
  getAnswerStats(responses) {
    if (!Array.isArray(responses) || responses.length === 0) {
      return null
    }

    const totalResponses = responses.length
    const answeredQueries = responses.filter(r => r.metadata.hasAnswer).length
    const avgConfidence = responses.reduce((sum, r) => sum + (r.metadata.confidence || 0), 0) / totalResponses
    const avgCitations = responses.reduce((sum, r) => sum + (r.citations?.length || 0), 0) / totalResponses
    const avgProcessingTime = responses.reduce((sum, r) => sum + (r.metadata.processingTime || 0), 0) / totalResponses

    const responseTypes = {}
    responses.forEach(r => {
      const type = r.metadata.responseType || 'unknown'
      responseTypes[type] = (responseTypes[type] || 0) + 1
    })

    return {
      totalResponses,
      answeredQueries,
      answerRate: answeredQueries / totalResponses,
      avgConfidence,
      avgCitations,
      avgProcessingTime,
      responseTypes
    }
  }
}

export default AnswerService