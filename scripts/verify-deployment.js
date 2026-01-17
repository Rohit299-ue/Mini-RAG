#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests the complete RAG system deployment
 */

import fetch from 'node-fetch'
import { createInterface } from 'readline'

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

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

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

// Test backend health
async function testBackendHealth(baseUrl) {
  try {
    log(`Testing backend health: ${baseUrl}/health`, 'cyan')
    
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      timeout: 10000
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    log('✅ Backend health check passed', 'green')
    log(`   Status: ${data.status}`, 'cyan')
    log(`   Database: ${data.services.database}`, 'cyan')
    log(`   OpenAI: ${data.services.openai}`, 'cyan')
    log(`   Cohere: ${data.services.cohere}`, 'cyan')
    
    return { success: true, data }
  } catch (error) {
    log(`❌ Backend health check failed: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

// Test document processing
async function testDocumentProcessing(baseUrl) {
  try {
    log('Testing document processing...', 'cyan')
    
    const testDoc = {
      text: 'Machine learning is a subset of artificial intelligence that focuses on algorithms and statistical models. It enables computers to learn and improve from experience without being explicitly programmed.',
      metadata: {
        source: 'deployment_test.txt',
        title: 'Deployment Test Document',
        section: 'Introduction'
      }
    }
    
    const response = await fetch(`${baseUrl}/api/documents/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testDoc),
      timeout: 30000
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Processing failed')
    }
    
    log('✅ Document processing test passed', 'green')
    log(`   Processed ${data.chunks.length} chunks`, 'cyan')
    log(`   Document ID: ${data.documentId}`, 'cyan')
    
    return { success: true, data }
  } catch (error) {
    log(`❌ Document processing test failed: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

// Test complete RAG pipeline
async function testCompleteRAG(baseUrl) {
  try {
    log('Testing complete RAG pipeline...', 'cyan')
    
    const testQuery = {
      query: 'What is machine learning?',
      topK: 10,
      rerankTopN: 3,
      temperature: 0.1
    }
    
    const response = await fetch(`${baseUrl}/api/answers/complete-rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testQuery),
      timeout: 60000
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'RAG pipeline failed')
    }
    
    log('✅ Complete RAG pipeline test passed', 'green')
    log(`   Answer length: ${data.answer.length} characters`, 'cyan')
    log(`   Citations: ${data.citations.length}`, 'cyan')
    log(`   Processing time: ${data.processingTime}ms`, 'cyan')
    
    // Show a snippet of the answer
    const answerSnippet = data.answer.substring(0, 100) + (data.answer.length > 100 ? '...' : '')
    log(`   Answer: "${answerSnippet}"`, 'cyan')
    
    return { success: true, data }
  } catch (error) {
    log(`❌ Complete RAG pipeline test failed: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

// Test frontend accessibility
async function testFrontend(frontendUrl) {
  try {
    log(`Testing frontend accessibility: ${frontendUrl}`, 'cyan')
    
    const response = await fetch(frontendUrl, {
      method: 'GET',
      timeout: 10000
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    
    // Basic checks for React app
    if (html.includes('<div id="root">') || html.includes('React')) {
      log('✅ Frontend accessibility test passed', 'green')
      return { success: true }
    } else {
      throw new Error('Frontend does not appear to be a React application')
    }
  } catch (error) {
    log(`❌ Frontend accessibility test failed: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

// Main verification function
async function verifyDeployment() {
  log('🧪 RAG System Deployment Verification', 'blue')
  log('=====================================', 'blue')
  log('')

  try {
    // Get URLs from user
    const backendUrl = await question('Enter your backend URL (e.g., https://your-rag-backend.onrender.com): ')
    const frontendUrl = await question('Enter your frontend URL (e.g., https://your-app.netlify.app): ')
    
    log('\n🔍 Starting verification tests...', 'yellow')
    
    const results = {
      backendHealth: null,
      documentProcessing: null,
      completeRAG: null,
      frontend: null
    }
    
    // Test backend health
    results.backendHealth = await testBackendHealth(backendUrl.replace(/\/$/, ''))
    
    if (results.backendHealth.success) {
      // Test document processing
      results.documentProcessing = await testDocumentProcessing(backendUrl.replace(/\/$/, ''))
      
      // Test complete RAG pipeline (only if document processing worked)
      if (results.documentProcessing.success) {
        // Wait a moment for indexing
        log('⏳ Waiting for document indexing...', 'yellow')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        results.completeRAG = await testCompleteRAG(backendUrl.replace(/\/$/, ''))
      }
    }
    
    // Test frontend
    if (frontendUrl) {
      results.frontend = await testFrontend(frontendUrl.replace(/\/$/, ''))
    }
    
    // Show summary
    log('\n📊 Verification Summary', 'blue')
    log('======================', 'blue')
    
    const tests = [
      { name: 'Backend Health', result: results.backendHealth },
      { name: 'Document Processing', result: results.documentProcessing },
      { name: 'Complete RAG Pipeline', result: results.completeRAG },
      { name: 'Frontend Accessibility', result: results.frontend }
    ]
    
    let passedTests = 0
    let totalTests = 0
    
    tests.forEach(test => {
      if (test.result !== null) {
        totalTests++
        const status = test.result.success ? '✅ PASS' : '❌ FAIL'
        const color = test.result.success ? 'green' : 'red'
        log(`${status} ${test.name}`, color)
        if (test.result.success) passedTests++
      }
    })
    
    log(`\n📈 Results: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'yellow')
    
    if (passedTests === totalTests && totalTests > 0) {
      log('\n🎉 Deployment verification completed successfully!', 'green')
      log('Your RAG system is ready for production use.', 'green')
    } else {
      log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow')
      log('Common issues:', 'yellow')
      log('• Environment variables not set correctly', 'yellow')
      log('• Services still starting up (try again in a few minutes)', 'yellow')
      log('• Network connectivity issues', 'yellow')
      log('• API keys invalid or expired', 'yellow')
    }
    
  } catch (error) {
    log(`❌ Verification failed: ${error.message}`, 'red')
  } finally {
    rl.close()
  }
}

// Run verification
verifyDeployment().catch(error => {
  log(`❌ Verification error: ${error.message}`, 'red')
  process.exit(1)
})