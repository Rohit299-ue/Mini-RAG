#!/usr/bin/env node

/**
 * Production Environment Setup Script
 * Helps configure environment variables for Render and Netlify deployment
 */

import fs from 'fs'
import path from 'path'
import { createInterface } from 'readline'
import crypto from 'crypto'

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

// Generate secure random API key
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex')
}

// Validate URL format
function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

// Main setup function
async function setupProductionEnvironment() {
  log('🌐 RAG System Production Environment Setup', 'blue')
  log('==========================================', 'blue')
  log('')

  const config = {}

  try {
    // Backend Configuration
    log('🚀 Backend Configuration (Render)', 'cyan')
    log('----------------------------------', 'cyan')

    // Supabase Configuration
    log('\n📊 Supabase Database Configuration:')
    config.SUPABASE_URL = await question('Enter your Supabase URL: ')
    
    if (!isValidUrl(config.SUPABASE_URL)) {
      log('❌ Invalid Supabase URL format', 'red')
      process.exit(1)
    }

    config.SUPABASE_ANON_KEY = await question('Enter your Supabase anon key: ')

    // OpenAI Configuration
    log('\n🤖 OpenAI Configuration:')
    config.OPENAI_API_KEY = await question('Enter your OpenAI API key: ')
    
    if (!config.OPENAI_API_KEY.startsWith('sk-')) {
      log('⚠️  Warning: OpenAI API key should start with "sk-"', 'yellow')
    }

    // Cohere Configuration (Optional)
    log('\n🔄 Cohere Configuration (Optional for reranking):')
    const useCohereResponse = await question('Do you want to use Cohere reranking? (y/N): ')
    
    if (useCohereResponse.toLowerCase() === 'y' || useCohereResponse.toLowerCase() === 'yes') {
      config.COHERE_API_KEY = await question('Enter your Cohere API key: ')
    } else {
      log('ℹ️  Skipping Cohere - reranking features will be disabled', 'yellow')
    }

    // Security Configuration
    log('\n🔒 Security Configuration:')
    const frontendUrl = await question('Enter your Netlify frontend URL (e.g., https://your-app.netlify.app): ')
    
    if (frontendUrl && isValidUrl(frontendUrl)) {
      config.CORS_ORIGIN = frontendUrl
    } else {
      log('⚠️  Invalid frontend URL - you can set this later', 'yellow')
      config.CORS_ORIGIN = 'https://your-app.netlify.app'
    }

    // Generate secure API key
    config.API_KEY = generateApiKey()
    log(`✅ Generated secure API key: ${config.API_KEY.substring(0, 8)}...`, 'green')

    // Frontend Configuration
    log('\n🎨 Frontend Configuration (Netlify)', 'cyan')
    log('-----------------------------------', 'cyan')

    const backendUrl = await question('Enter your Render backend URL (e.g., https://your-rag-backend.onrender.com): ')
    
    if (backendUrl && isValidUrl(backendUrl)) {
      config.REACT_APP_API_BASE = `${backendUrl}/api`
    } else {
      log('⚠️  Invalid backend URL - you can set this later', 'yellow')
      config.REACT_APP_API_BASE = 'https://your-rag-backend.onrender.com/api'
    }

    // Application Branding
    const appTitle = await question('Enter your app title (default: RAG System): ')
    config.REACT_APP_TITLE = appTitle || 'RAG System'

    const appDescription = await question('Enter app description (default: AI-Powered Document Search): ')
    config.REACT_APP_DESCRIPTION = appDescription || 'AI-Powered Document Search with Citations'

    // Generate environment files
    await generateEnvironmentFiles(config)

    // Show deployment instructions
    showDeploymentInstructions(config)

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red')
    process.exit(1)
  } finally {
    rl.close()
  }
}

// Generate environment configuration files
async function generateEnvironmentFiles(config) {
  log('\n📁 Generating Environment Files...', 'cyan')

  // Backend environment for Render
  const backendEnv = `# RAG Backend Production Environment
# Copy these values to your Render service environment variables

NODE_ENV=production
PORT=10000

# Database
SUPABASE_URL=${config.SUPABASE_URL}
SUPABASE_ANON_KEY=${config.SUPABASE_ANON_KEY}

# AI Services
OPENAI_API_KEY=${config.OPENAI_API_KEY}
${config.COHERE_API_KEY ? `COHERE_API_KEY=${config.COHERE_API_KEY}` : '# COHERE_API_KEY=your_cohere_key_here'}

# Security
CORS_ORIGIN=${config.CORS_ORIGIN}
API_KEY_HEADER=X-API-Key
API_KEY=${config.API_KEY}

# Performance
RATE_LIMIT_GENERAL=100
RATE_LIMIT_PROCESSING=10
LOG_LEVEL=info

# Health Check
HEALTH_CHECK_INTERVAL=30000
`

  // Frontend environment for Netlify
  const frontendEnv = `# RAG Frontend Production Environment
# Copy these values to your Netlify site environment variables

REACT_APP_API_BASE=${config.REACT_APP_API_BASE}
REACT_APP_TITLE=${config.REACT_APP_TITLE}
REACT_APP_DESCRIPTION=${config.REACT_APP_DESCRIPTION}
REACT_APP_ENABLE_METRICS=true
REACT_APP_ENABLE_ADVANCED_OPTIONS=true
REACT_APP_ENABLE_FILE_UPLOAD=true
`

  // Write files
  fs.writeFileSync('.env.production', backendEnv)
  fs.writeFileSync('frontend/.env.production', frontendEnv)

  log('✅ Generated .env.production (backend)', 'green')
  log('✅ Generated frontend/.env.production (frontend)', 'green')
}

// Show deployment instructions
function showDeploymentInstructions(config) {
  log('\n🚀 Deployment Instructions', 'blue')
  log('==========================', 'blue')

  log('\n📋 Backend Deployment (Render):', 'cyan')
  log('1. Go to https://render.com and create a new Web Service')
  log('2. Connect your GitHub repository')
  log('3. Configure the service:')
  log('   - Build Command: npm install')
  log('   - Start Command: npm start')
  log('   - Environment: Node')
  log('4. Add these environment variables in Render dashboard:')
  
  const backendVars = [
    'NODE_ENV=production',
    'PORT=10000',
    `SUPABASE_URL=${config.SUPABASE_URL}`,
    `SUPABASE_ANON_KEY=${config.SUPABASE_ANON_KEY}`,
    `OPENAI_API_KEY=${config.OPENAI_API_KEY}`,
    `CORS_ORIGIN=${config.CORS_ORIGIN}`,
    `API_KEY=${config.API_KEY}`,
    'RATE_LIMIT_GENERAL=100',
    'RATE_LIMIT_PROCESSING=10'
  ]

  if (config.COHERE_API_KEY) {
    backendVars.push(`COHERE_API_KEY=${config.COHERE_API_KEY}`)
  }

  backendVars.forEach(envVar => {
    log(`   ${envVar}`, 'yellow')
  })

  log('\n📋 Frontend Deployment (Netlify):', 'cyan')
  log('1. Go to https://netlify.com and create a new site')
  log('2. Connect your GitHub repository')
  log('3. Configure build settings:')
  log('   - Base directory: frontend')
  log('   - Build command: npm run build')
  log('   - Publish directory: frontend/build')
  log('4. Add these environment variables in Netlify dashboard:')
  
  const frontendVars = [
    `REACT_APP_API_BASE=${config.REACT_APP_API_BASE}`,
    `REACT_APP_TITLE=${config.REACT_APP_TITLE}`,
    `REACT_APP_DESCRIPTION=${config.REACT_APP_DESCRIPTION}`,
    'REACT_APP_ENABLE_METRICS=true'
  ]

  frontendVars.forEach(envVar => {
    log(`   ${envVar}`, 'yellow')
  })

  log('\n🔒 Security Reminders:', 'cyan')
  log('• Never commit API keys to version control')
  log('• Use different API keys for development and production')
  log('• Rotate API keys regularly')
  log('• Monitor API usage and costs')
  log('• Set up proper CORS origins')

  log('\n🧪 Testing:', 'cyan')
  log('• Test backend health: curl https://your-backend.onrender.com/health')
  log('• Test complete pipeline through the frontend interface')
  log('• Monitor logs in Render and Netlify dashboards')

  log('\n✅ Setup Complete!', 'green')
  log('Your environment files are ready for production deployment.', 'green')
}

// Run the setup
setupProductionEnvironment().catch(error => {
  log(`❌ Setup failed: ${error.message}`, 'red')
  process.exit(1)
})