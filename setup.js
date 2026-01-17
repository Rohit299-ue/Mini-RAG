#!/usr/bin/env node

/**
 * Setup script for RAG Backend
 * Validates environment and provides setup guidance
 */

import fs from 'fs'
import path from 'path'

console.log('🔧 RAG Backend Setup Script')
console.log('============================\n')

// Check if .env file exists
const envPath = '.env'
const envExamplePath = '.env.example'

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...')
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ .env file created')
    console.log('⚠️  Please edit .env file with your API keys')
  } else {
    console.log('❌ .env.example not found')
  }
} else {
  console.log('✅ .env file already exists')
}

console.log('\n📋 Required Environment Variables:')
console.log('  - SUPABASE_URL')
console.log('  - SUPABASE_ANON_KEY') 
console.log('  - OPENAI_API_KEY')
console.log('  - COHERE_API_KEY (optional, for reranking)')

console.log('\n🚀 Next Steps:')
console.log('  1. Edit .env file with your API keys')
console.log('  2. Run: npm install')
console.log('  3. Setup Supabase schema (see supabase_rag_schema.sql)')
console.log('  4. Run: npm run dev')

console.log('\n📚 Documentation:')
console.log('  - README.md - Complete setup guide')
console.log('  - docs/MMR_EXPLANATION.md - MMR algorithm details')
console.log('  - docs/RERANKING_EXPLANATION.md - Reranking benefits')
console.log('  - examples/ - Usage examples')