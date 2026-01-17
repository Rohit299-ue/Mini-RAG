#!/usr/bin/env node

/**
 * Comprehensive System Test Script
 * Tests all major components of the RAG system
 */

import fetch from 'node-fetch'
import fs from 'fs'

const API_BASE = process.env.API_BASE || 'http://localhost:3000'
const VERBOSE = process.env.VERBOSE === 'true'

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  retries: 3,
  delay: 1000
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logTest(name) {
  log(`\n🧪 Testing: ${name}`, 'cyan')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

// Utility function for API calls with retry
async function apiCall(endpoint, options = {}, retries = TEST_CONFIG.retries) {
  const url = `${API_BASE}${endpoint}`
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        timeout: TEST_CONFIG.timeout,
        ...options
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`)
      }
      
      return data
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      
      if (VERBOSE) {
        log(`Attempt ${attempt} failed, retrying...`, 'yellow')
      }
      
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delay * attempt))
    }
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  logTest('Health Check')
  
  try {
    const result = await apiCall('/health')
    
    if (result.status === 'healthy') {
      logSuccess('System is healthy')
      
      // Check individual services
      const services = result.services || {}
      Object.entries(services).forEach(([service, status]) => {
        if (status === 'connected') {
          logSuccess(`${service}: connected`)
        } else {
          logWarning(`${service}: ${status}`)
        }
      })
      
      return true
    } else {
      logError(`System status: ${result.status}`)
      return false
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`)
    return false
  }
}

// Test 2: Document Processing
async function testDocumentProcessing() {
  logTest('Document Processing')
  
  const testDocument = {
    text: `
      Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every task.
      
      There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning.
      
      Supervised learning algorithms learn from labeled training data to make predictions on new, unseen data. Examples include linear regression, decision trees, and neural networks.
      
      Deep learning is a subset of machine learning that uses artificial neural networks with multiple layers to automatically learn hierarchical representations of data.
    `,
    metadata: {
      source: 'test_ml_document.txt',
      title: 'Machine Learning Fundamentals',
      section: 'Introduction',
      author: 'Test System'
    }
  }
  
  try {
    const result = await apiCall('/api/documents/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testDocument)
    })
    
    if (result.success && result.processing) {
      logSuccess(`Document processed: ${result.processing.totalChunks} chunks created`)
      logSuccess(`Embeddings generated: ${result.processing.storedChunks} chunks stored`)
      
      if (VERBOSE) {
        log(`Chunking stats: ${JSON.stringify(result.processing.chunkingStats, null, 2)}`)
      }
      
      return result.processing.source
    } else {
      logError('Document processing failed')
      return null
    }
  } catch (error) {
    logError(`Document processing error: ${error.message}`)
    return null
  }
}

// Test 3: Vector Retrieval
async function testVectorRetrieval() {
  logTest('Vector Retrieval (MMR)')
  
  try {
    const result = await apiCall('/api/retrieval/mmr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is machine learning and how does it work?',
        finalK: 5,
        lambda: 0.7,
        threshold: 0.3
      })
    })
    
    if (result.success && result.results) {
      logSuccess(`Retrieved ${result.results.length} relevant chunks`)
      logSuccess(`Average similarity: ${result.metadata.avgSimilarity?.toFixed(3) || 'N/A'}`)
      logSuccess(`Diversity score: ${result.metadata.diversityScore?.toFixed(3) || 'N/A'}`)
      
      return result.results
    } else {
      logError('Vector retrieval failed')
      return null
    }
  } catch (error) {
    logError(`Vector retrieval error: ${error.message}`)
    return null
  }
}

// Test 4: Reranking (if available)
async function testReranking(chunks) {
  logTest('Reranking (Cohere)')
  
  if (!chunks || chunks.length === 0) {
    logWarning('No chunks available for reranking test')
    return chunks
  }
  
  try {
    const result = await apiCall('/api/reranking/rerank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is machine learning and how does it work?',
        chunks: chunks,
        topN: 3
      })
    })
    
    if (result.success && result.results) {
      logSuccess(`Reranked to ${result.results.length} top chunks`)
      logSuccess(`Average rerank score: ${result.metadata.stats.avgRerankScore?.toFixed(3) || 'N/A'}`)
      
      return result.results
    } else {
      logWarning('Reranking failed - continuing with original chunks')
      return chunks
    }
  } catch (error) {
    logWarning(`Reranking error: ${error.message} - continuing without reranking`)
    return chunks
  }
}

// Test 5: Answer Generation
async function testAnswerGeneration(chunks) {
  logTest('Answer Generation')
  
  if (!chunks || chunks.length === 0) {
    logWarning('No chunks available for answer generation test')
    return false
  }
  
  try {
    const result = await apiCall('/api/answers/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is machine learning and what are its main types?',
        chunks: chunks,
        strictCitations: true
      })
    })
    
    if (result.success && result.answer) {
      logSuccess('Answer generated successfully')
      logSuccess(`Citations used: ${result.citations?.length || 0}`)
      logSuccess(`Confidence: ${result.metadata.confidence?.toFixed(2) || 'N/A'}`)
      
      if (VERBOSE) {
        log('\nGenerated Answer:', 'blue')
        log(result.answer)
        
        if (result.sources && result.sources.length > 0) {
          log('\nSources:', 'blue')
          result.sources.forEach(source => {
            log(`${source.citation} ${source.title} (${source.source})`)
          })
        }
      }
      
      return true
    } else {
      logError('Answer generation failed')
      return false
    }
  } catch (error) {
    logError(`Answer generation error: ${error.message}`)
    return false
  }
}

// Test 6: Complete RAG Pipeline
async function testCompleteRAG() {
  logTest('Complete RAG Pipeline')
  
  try {
    const result = await apiCall('/api/answers/complete-rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Explain the different types of machine learning',
        topK: 20,
        finalK: 8,
        rerankTopN: 4,
        lambda: 0.7,
        threshold: 0.3,
        strictCitations: true
      })
    })
    
    if (result.success && result.answer) {
      logSuccess('Complete RAG pipeline executed successfully')
      
      const metadata = result.metadata
      if (metadata.retrievalMetadata) {
        logSuccess(`Pipeline: ${metadata.retrievalMetadata.totalCandidates} → ${metadata.retrievalMetadata.mmrResults} → ${metadata.finalResults}`)
      }
      
      logSuccess(`Final answer confidence: ${metadata.confidence?.toFixed(2) || 'N/A'}`)
      
      if (VERBOSE) {
        log('\nComplete RAG Answer:', 'blue')
        log(result.answer)
      }
      
      return true
    } else {
      logError('Complete RAG pipeline failed')
      return false
    }
  } catch (error) {
    logError(`Complete RAG pipeline error: ${error.message}`)
    return false
  }
}

// Test 7: Performance Test
async function testPerformance() {
  logTest('Performance Test')
  
  const queries = [
    'What is supervised learning?',
    'How does deep learning work?',
    'What are neural networks?'
  ]
  
  const startTime = Date.now()
  let successCount = 0
  
  try {
    const promises = queries.map(async (query, index) => {
      try {
        const result = await apiCall('/api/answers/complete-rag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            topK: 10,
            rerankTopN: 3,
            strictCitations: true
          })
        })
        
        if (result.success) {
          successCount++
          return { success: true, query, processingTime: result.metadata.processingTime }
        }
        return { success: false, query, error: 'No success flag' }
      } catch (error) {
        return { success: false, query, error: error.message }
      }
    })
    
    const results = await Promise.all(promises)
    const totalTime = Date.now() - startTime
    
    logSuccess(`Performance test completed: ${successCount}/${queries.length} successful`)
    logSuccess(`Total time: ${totalTime}ms`)
    logSuccess(`Average time per query: ${Math.round(totalTime / queries.length)}ms`)
    
    if (VERBOSE) {
      results.forEach(result => {
        if (result.success) {
          log(`✅ "${result.query}" - ${result.processingTime || 'N/A'}ms`)
        } else {
          log(`❌ "${result.query}" - ${result.error}`)
        }
      })
    }
    
    return successCount === queries.length
  } catch (error) {
    logError(`Performance test error: ${error.message}`)
    return false
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting RAG System Comprehensive Test', 'blue')
  log('==========================================', 'blue')
  
  const results = {
    healthCheck: false,
    documentProcessing: false,
    vectorRetrieval: false,
    reranking: false,
    answerGeneration: false,
    completeRAG: false,
    performance: false
  }
  
  let documentSource = null
  let retrievedChunks = null
  let rerankedChunks = null
  
  // Run tests sequentially
  try {
    // 1. Health Check
    results.healthCheck = await testHealthCheck()
    
    if (!results.healthCheck) {
      logError('Health check failed - aborting remaining tests')
      return results
    }
    
    // 2. Document Processing
    documentSource = await testDocumentProcessing()
    results.documentProcessing = !!documentSource
    
    // 3. Vector Retrieval
    retrievedChunks = await testVectorRetrieval()
    results.vectorRetrieval = !!retrievedChunks
    
    // 4. Reranking (optional)
    rerankedChunks = await testReranking(retrievedChunks)
    results.reranking = !!rerankedChunks
    
    // 5. Answer Generation
    results.answerGeneration = await testAnswerGeneration(rerankedChunks || retrievedChunks)
    
    // 6. Complete RAG Pipeline
    results.completeRAG = await testCompleteRAG()
    
    // 7. Performance Test
    results.performance = await testPerformance()
    
  } catch (error) {
    logError(`Test execution error: ${error.message}`)
  }
  
  // Summary
  log('\n📊 Test Results Summary', 'blue')
  log('======================', 'blue')
  
  const testNames = {
    healthCheck: 'Health Check',
    documentProcessing: 'Document Processing',
    vectorRetrieval: 'Vector Retrieval',
    reranking: 'Reranking',
    answerGeneration: 'Answer Generation',
    completeRAG: 'Complete RAG Pipeline',
    performance: 'Performance Test'
  }
  
  let passedTests = 0
  const totalTests = Object.keys(results).length
  
  Object.entries(results).forEach(([key, passed]) => {
    if (passed) {
      logSuccess(`${testNames[key]}: PASSED`)
      passedTests++
    } else {
      logError(`${testNames[key]}: FAILED`)
    }
  })
  
  log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'red')
  
  if (passedTests === totalTests) {
    log('🎉 All tests passed! Your RAG system is working correctly.', 'green')
  } else {
    log('⚠️  Some tests failed. Please check the logs above for details.', 'yellow')
  }
  
  return results
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(results => {
      const allPassed = Object.values(results).every(Boolean)
      process.exit(allPassed ? 0 : 1)
    })
    .catch(error => {
      logError(`Test runner error: ${error.message}`)
      process.exit(1)
    })
}

export { runAllTests }