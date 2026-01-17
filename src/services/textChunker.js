import { encoding_for_model } from 'tiktoken'

class TextChunker {
  constructor(options = {}) {
    this.minChunkSize = options.minChunkSize || 800
    this.maxChunkSize = options.maxChunkSize || 1200
    this.overlapPercentage = options.overlapPercentage || 0.125 // 12.5% default
    this.model = options.model || 'gpt-4'
    
    // Initialize tokenizer
    this.encoding = encoding_for_model(this.model)
  }

  /**
   * Count tokens in text
   */
  countTokens(text) {
    return this.encoding.encode(text).length
  }

  /**
   * Split text into sentences for better chunk boundaries
   */
  splitIntoSentences(text) {
    // Enhanced sentence splitting that handles various punctuation
    const sentences = text
      .replace(/([.!?])\s+/g, '$1|SPLIT|')
      .split('|SPLIT|')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    return sentences
  }

  /**
   * Create overlapping chunks from text
   */
  chunkText(text, metadata = {}) {
    const sentences = this.splitIntoSentences(text)
    const chunks = []
    let currentChunk = ''
    let currentTokens = 0
    let chunkStartIndex = 0
    let position = 0

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      const sentenceTokens = this.countTokens(sentence)
      
      // Check if adding this sentence would exceed max chunk size
      if (currentTokens + sentenceTokens > this.maxChunkSize && currentChunk.length > 0) {
        // Create chunk if it meets minimum size requirement
        if (currentTokens >= this.minChunkSize) {
          chunks.push(this.createChunk(
            currentChunk.trim(),
            metadata,
            position++,
            chunkStartIndex,
            chunkStartIndex + currentChunk.length
          ))

          // Calculate overlap for next chunk
          const overlapTokens = Math.floor(currentTokens * this.overlapPercentage)
          const { overlapText, overlapStart } = this.calculateOverlap(
            currentChunk, 
            overlapTokens
          )
          
          currentChunk = overlapText
          currentTokens = this.countTokens(currentChunk)
          chunkStartIndex = overlapStart
        } else {
          // Current chunk is too small, just continue adding
          currentChunk += ' ' + sentence
          currentTokens += sentenceTokens
          continue
        }
      }
      
      // Add sentence to current chunk
      if (currentChunk.length > 0) {
        currentChunk += ' ' + sentence
      } else {
        currentChunk = sentence
        chunkStartIndex = text.indexOf(sentence, chunkStartIndex)
      }
      currentTokens += sentenceTokens
    }

    // Add final chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push(this.createChunk(
        currentChunk.trim(),
        metadata,
        position,
        chunkStartIndex,
        chunkStartIndex + currentChunk.length
      ))
    }

    return chunks
  }

  /**
   * Calculate overlap text from the end of current chunk
   */
  calculateOverlap(text, targetOverlapTokens) {
    const sentences = this.splitIntoSentences(text)
    let overlapText = ''
    let overlapTokens = 0
    
    // Start from the end and work backwards
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i]
      const sentenceTokens = this.countTokens(sentence)
      
      if (overlapTokens + sentenceTokens <= targetOverlapTokens) {
        overlapText = sentence + (overlapText ? ' ' + overlapText : '')
        overlapTokens += sentenceTokens
      } else {
        break
      }
    }

    // Find the start position of overlap in original text
    const overlapStart = overlapText ? text.lastIndexOf(overlapText.split(' ')[0]) : text.length
    
    return { overlapText, overlapStart }
  }

  /**
   * Create a chunk object with metadata
   */
  createChunk(content, metadata, position, startChar, endChar) {
    return {
      content,
      source: metadata.source || 'unknown',
      title: metadata.title || null,
      section: metadata.section || null,
      position,
      startChar,
      endChar,
      tokenCount: this.countTokens(content),
      metadata: {
        ...metadata,
        chunkLength: content.length,
        wordCount: content.split(/\s+/).length
      }
    }
  }

  /**
   * Process text with automatic section detection
   */
  processTextWithSections(text, metadata = {}) {
    const sections = this.detectSections(text)
    const allChunks = []

    sections.forEach((section, sectionIndex) => {
      const sectionMetadata = {
        ...metadata,
        section: section.title || `Section ${sectionIndex + 1}`
      }
      
      const chunks = this.chunkText(section.content, sectionMetadata)
      allChunks.push(...chunks)
    })

    return allChunks
  }

  /**
   * Simple section detection based on headers
   */
  detectSections(text) {
    // Look for markdown-style headers or numbered sections
    const headerRegex = /^(#{1,6}\s+.+|^\d+\.\s+.+|^[A-Z][^.!?]*:?\s*$)/gm
    const matches = [...text.matchAll(headerRegex)]
    
    if (matches.length === 0) {
      return [{ title: null, content: text }]
    }

    const sections = []
    let lastIndex = 0

    matches.forEach((match, index) => {
      // Add content before this header as a section
      if (match.index > lastIndex) {
        const content = text.slice(lastIndex, match.index).trim()
        if (content) {
          sections.push({
            title: sections.length === 0 ? 'Introduction' : null,
            content
          })
        }
      }

      // Determine section content
      const nextMatch = matches[index + 1]
      const sectionEnd = nextMatch ? nextMatch.index : text.length
      const sectionContent = text.slice(match.index, sectionEnd).trim()
      
      sections.push({
        title: match[0].replace(/^#+\s*|\d+\.\s*|:$/g, '').trim(),
        content: sectionContent
      })

      lastIndex = sectionEnd
    })

    return sections
  }

  /**
   * Get chunking statistics
   */
  getChunkingStats(chunks) {
    const tokenCounts = chunks.map(chunk => chunk.tokenCount)
    const chunkLengths = chunks.map(chunk => chunk.content.length)
    
    return {
      totalChunks: chunks.length,
      avgTokens: Math.round(tokenCounts.reduce((a, b) => a + b, 0) / chunks.length),
      minTokens: Math.min(...tokenCounts),
      maxTokens: Math.max(...tokenCounts),
      avgLength: Math.round(chunkLengths.reduce((a, b) => a + b, 0) / chunks.length),
      totalTokens: tokenCounts.reduce((a, b) => a + b, 0)
    }
  }
}

export default TextChunker