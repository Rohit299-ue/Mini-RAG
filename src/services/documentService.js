import { supabase } from '../config/database.js'
import TextChunker from './textChunker.js'
import EmbeddingService from './embeddingService.js'
import { v4 as uuidv4 } from 'uuid'

class DocumentService {
  constructor() {
    this.textChunker = new TextChunker({
      minChunkSize: 800,
      maxChunkSize: 1200,
      overlapPercentage: 0.125 // 12.5%
    })
    this.embeddingService = new EmbeddingService()
  }

  /**
   * Process raw text input and store in database
   */
  async processText(textInput, metadata = {}) {
    try {
      console.log('Starting text processing...')
      
      // Validate input
      this.validateTextInput(textInput, metadata)
      
      // Generate unique source ID if not provided
      const source = metadata.source || `text_${uuidv4()}`
      const processedMetadata = {
        source,
        title: metadata.title || 'Untitled Document',
        section: metadata.section || null,
        ...metadata
      }

      // Step 1: Chunk the text
      console.log('Chunking text...')
      const chunks = this.textChunker.chunkText(textInput, processedMetadata)
      console.log(`Created ${chunks.length} chunks`)

      // Step 2: Generate embeddings
      console.log('Generating embeddings...')
      const chunksWithEmbeddings = await this.embeddingService.generateChunkEmbeddings(chunks)
      
      // Step 3: Store in database
      console.log('Storing in database...')
      const storedChunks = await this.storeChunks(chunksWithEmbeddings)
      
      // Step 4: Generate processing summary
      const summary = this.generateProcessingSummary(chunks, chunksWithEmbeddings, storedChunks)
      
      console.log('Text processing completed successfully')
      return summary
      
    } catch (error) {
      console.error('Error processing text:', error.message)
      throw new Error(`Text processing failed: ${error.message}`)
    }
  }

  /**
   * Process text with automatic section detection
   */
  async processTextWithSections(textInput, metadata = {}) {
    try {
      console.log('Starting text processing with section detection...')
      
      this.validateTextInput(textInput, metadata)
      
      const source = metadata.source || `text_${uuidv4()}`
      const processedMetadata = {
        source,
        title: metadata.title || 'Untitled Document',
        ...metadata
      }

      // Process with section detection
      const chunks = this.textChunker.processTextWithSections(textInput, processedMetadata)
      console.log(`Created ${chunks.length} chunks across sections`)

      const chunksWithEmbeddings = await this.embeddingService.generateChunkEmbeddings(chunks)
      const storedChunks = await this.storeChunks(chunksWithEmbeddings)
      
      const summary = this.generateProcessingSummary(chunks, chunksWithEmbeddings, storedChunks)
      
      console.log('Text processing with sections completed successfully')
      return summary
      
    } catch (error) {
      console.error('Error processing text with sections:', error.message)
      throw new Error(`Text processing failed: ${error.message}`)
    }
  }

  /**
   * Store chunks in the database
   */
  async storeChunks(chunks) {
    const storedChunks = []
    
    for (const chunk of chunks) {
      try {
        const { data, error } = await supabase.rpc('upsert_document_by_source_position', {
          p_content: chunk.content,
          p_embedding: chunk.embedding,
          p_source: chunk.source,
          p_title: chunk.title,
          p_section: chunk.section,
          p_position: chunk.position
        })

        if (error) {
          console.error('Error storing chunk:', error.message)
          throw error
        }

        storedChunks.push({
          id: data,
          ...chunk
        })
        
      } catch (error) {
        console.error(`Failed to store chunk at position ${chunk.position}:`, error.message)
        throw error
      }
    }

    return storedChunks
  }

  /**
   * Delete all chunks for a specific source
   */
  async deleteBySource(source) {
    try {
      const { data, error } = await supabase.rpc('delete_documents_by_source', {
        p_source: source
      })

      if (error) throw error
      
      console.log(`Deleted ${data} chunks for source: ${source}`)
      return data
      
    } catch (error) {
      console.error('Error deleting chunks:', error.message)
      throw new Error(`Failed to delete chunks: ${error.message}`)
    }
  }

  /**
   * Get chunks by source
   */
  async getChunksBySource(source) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('source', source)
        .order('position')

      if (error) throw error
      return data
      
    } catch (error) {
      console.error('Error fetching chunks:', error.message)
      throw new Error(`Failed to fetch chunks: ${error.message}`)
    }
  }

  /**
   * Search for similar chunks
   */
  async searchSimilar(queryText, options = {}) {
    try {
      // Generate embedding for query
      const queryEmbedding = await this.embeddingService.generateEmbedding(queryText)
      
      // Search in database
      const { data, error } = await supabase.rpc('search_similar_documents', {
        query_embedding: queryEmbedding,
        match_threshold: options.threshold || 0.7,
        match_count: options.limit || 10,
        filter_source: options.source || null,
        filter_section: options.section || null
      })

      if (error) throw error
      return data
      
    } catch (error) {
      console.error('Error searching similar chunks:', error.message)
      throw new Error(`Search failed: ${error.message}`)
    }
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats() {
    try {
      const { data, error } = await supabase.rpc('get_document_stats')
      if (error) throw error
      return data[0] || {}
    } catch (error) {
      console.error('Error fetching stats:', error.message)
      throw new Error(`Failed to fetch stats: ${error.message}`)
    }
  }

  /**
   * Validate text input
   */
  validateTextInput(text, metadata) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text input is required and must be a string')
    }
    
    if (text.trim().length === 0) {
      throw new Error('Text input cannot be empty')
    }
    
    if (text.length > 1000000) { // 1MB limit
      throw new Error('Text input is too large (max 1MB)')
    }
    
    if (metadata && typeof metadata !== 'object') {
      throw new Error('Metadata must be an object')
    }
  }

  /**
   * Generate processing summary
   */
  generateProcessingSummary(chunks, chunksWithEmbeddings, storedChunks) {
    const chunkingStats = this.textChunker.getChunkingStats(chunks)
    const embeddingStats = this.embeddingService.getEmbeddingStats(
      chunksWithEmbeddings.map(c => c.embedding)
    )
    
    return {
      success: true,
      processing: {
        totalChunks: chunks.length,
        storedChunks: storedChunks.length,
        chunkingStats,
        embeddingStats,
        source: chunks[0]?.source,
        title: chunks[0]?.title,
        sections: [...new Set(chunks.map(c => c.section).filter(Boolean))],
        estimatedCost: this.embeddingService.estimateCost(
          chunks.length, 
          chunkingStats.avgTokens
        )
      },
      chunks: storedChunks.map(chunk => ({
        id: chunk.id,
        position: chunk.position,
        section: chunk.section,
        tokenCount: chunk.tokenCount,
        contentPreview: chunk.content.substring(0, 100) + '...'
      }))
    }
  }

  /**
   * Batch process multiple texts
   */
  async batchProcessTexts(textInputs) {
    const results = []
    const errors = []
    
    for (let i = 0; i < textInputs.length; i++) {
      const { text, metadata } = textInputs[i]
      
      try {
        console.log(`Processing text ${i + 1}/${textInputs.length}`)
        const result = await this.processText(text, metadata)
        results.push(result)
      } catch (error) {
        console.error(`Error processing text ${i + 1}:`, error.message)
        errors.push({
          index: i,
          error: error.message,
          metadata: metadata
        })
      }
    }
    
    return {
      successful: results.length,
      failed: errors.length,
      results,
      errors
    }
  }
}

export default DocumentService