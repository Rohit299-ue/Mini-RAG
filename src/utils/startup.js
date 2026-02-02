/**
 * Startup utilities for the RAG backend
 * Handles graceful startup with proper error handling and service validation
 */

import { testConnection } from '../config/database.js'
import { testCohereConnection } from '../config/cohere.js'

/**
 * Test all external service connections
 */
export async function testAllConnections() {
  const results = {
    database: false,
    cohere: false,
    allHealthy: false
  }

  try {
    console.log('🔍 Testing service connections...')
    
    // Test database connection
    try {
      results.database = await testConnection()
    } catch (error) {
      console.error('Database connection test failed:', error.message)
      results.database = false
    }

    // Test Cohere connection (optional service)
    try {
      results.cohere = await testCohereConnection()
    } catch (error) {
      console.warn('Cohere connection test failed:', error.message)
      results.cohere = false
    }

    // Determine overall health - only require database for basic functionality
    results.allHealthy = results.database
    
    // Log service status
    console.log('\n📊 Connection Test Results:')
    console.log(`   Database: ${results.database ? '✅ Connected' : '❌ Failed'}`)
    console.log(`   Cohere: ${results.cohere ? '✅ Connected' : '⚠️  Disabled (reranking features unavailable)'}`)
    
    if (results.allHealthy) {
      console.log('✅ System ready for operation')
    } else {
      console.log('❌ Critical services unavailable - system cannot start')
    }

    return results
    
  } catch (error) {
    console.error('❌ Connection testing failed:', error.message)
    return results
  }
}

/**
 * Validate environment variables
 */
export function validateEnvironment() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ]
  
  const optional = [
    'OPENAI_API_KEY',
    'COHERE_API_KEY',
    'PORT',
    'NODE_ENV',
    'FRONTEND_URL'
  ]

  const missing = []
  const present = []

  // Check required variables
  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    } else {
      present.push(envVar)
    }
  }

  // Check optional variables
  const optionalPresent = []
  const optionalMissing = []
  
  for (const envVar of optional) {
    if (process.env[envVar]) {
      optionalPresent.push(envVar)
    } else {
      optionalMissing.push(envVar)
    }
  }

  // Log results
  console.log('🔧 Environment Variable Check:')
  console.log(`  Required (${present.length}/${required.length}): ${present.join(', ')}`)
  
  if (missing.length > 0) {
    console.error(`  ❌ Missing required: ${missing.join(', ')}`)
  }
  
  if (optionalPresent.length > 0) {
    console.log(`  Optional present: ${optionalPresent.join(', ')}`)
  }
  
  if (optionalMissing.length > 0) {
    console.log(`  Optional missing: ${optionalMissing.join(', ')}`)
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
    optionalPresent,
    optionalMissing
  }
}

/**
 * Graceful startup with comprehensive checks
 */
export async function gracefulStartup() {
  try {
    console.log('🚀 Starting RAG Backend...')
    
    // Step 1: Validate environment
    const envCheck = validateEnvironment()
    if (!envCheck.valid) {
      throw new Error(`Missing required environment variables: ${envCheck.missing.join(', ')}`)
    }

    // Step 2: Test connections
    const connectionResults = await testAllConnections()
    
    // Step 3: Determine startup mode
    let startupMode = 'basic'
    const warnings = []
    const features = []
    
    // Database is required
    if (!connectionResults.database) {
      throw new Error('Database connection failed - cannot start server')
    }
    
    features.push('Hugging Face embeddings (free)')
    
    // Cohere is optional
    if (connectionResults.cohere) {
      features.push('Cohere reranking and answers')
      startupMode = 'full'
    } else {
      warnings.push('Cohere unavailable - reranking and answer generation disabled')
    }

    // Step 4: Log startup summary
    console.log('📋 Startup Summary:')
    console.log(`  Mode: ${startupMode}`)
    console.log(`  Database: ✅ Connected`)
    console.log(`  Cohere: ${connectionResults.cohere ? '✅ Connected' : '⚠️  Unavailable'}`)
    
    if (features.length > 0) {
      console.log('🎯 Available features:')
      features.forEach(feature => console.log(`    - ${feature}`))
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  Warnings:')
      warnings.forEach(warning => console.log(`    - ${warning}`))
    }

    return {
      success: true,
      mode: startupMode,
      services: connectionResults,
      warnings,
      features
    }
    
  } catch (error) {
    console.error('❌ Startup failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Setup graceful shutdown handlers
 */
export function setupGracefulShutdown() {
  const shutdown = (signal) => {
    console.log(`\n📴 Received ${signal}, shutting down gracefully...`)
    
    // Close any open connections, cleanup resources
    // Add cleanup logic here as needed
    
    console.log('✅ Shutdown complete')
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error)
    process.exit(1)
  })
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
    process.exit(1)
  })
}