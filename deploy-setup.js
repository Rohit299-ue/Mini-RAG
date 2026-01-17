#!/usr/bin/env node

/**
 * Simple deployment setup for Mini-RAG
 * Repository: https://github.com/Rohit299-ue/Mini-RAG
 */

console.log('🚀 Mini-RAG Deployment Setup')
console.log('============================')
console.log('')

console.log('📋 Your repository is ready at:')
console.log('   https://github.com/Rohit299-ue/Mini-RAG')
console.log('')

console.log('🔧 Backend Deployment (Render):')
console.log('1. Go to https://render.com')
console.log('2. Sign up with GitHub')
console.log('3. Create Web Service from: https://github.com/Rohit299-ue/Mini-RAG')
console.log('4. Settings:')
console.log('   - Build Command: npm install')
console.log('   - Start Command: npm start')
console.log('   - Environment: Node')
console.log('')

console.log('🔒 Required Environment Variables for Render:')
console.log('NODE_ENV=production')
console.log('PORT=10000')
console.log('SUPABASE_URL=https://your-project.supabase.co')
console.log('SUPABASE_ANON_KEY=your_supabase_anon_key')
console.log('OPENAI_API_KEY=sk-proj-your_openai_key')
console.log('COHERE_API_KEY=your_cohere_key')
console.log('CORS_ORIGIN=https://your-netlify-app.netlify.app')
console.log('API_KEY=your_secure_random_key')
console.log('RATE_LIMIT_GENERAL=100')
console.log('RATE_LIMIT_PROCESSING=10')
console.log('')

console.log('🎨 Frontend Deployment (Netlify):')
console.log('1. Go to https://netlify.com')
console.log('2. Sign up with GitHub')
console.log('3. New site from Git: https://github.com/Rohit299-ue/Mini-RAG')
console.log('4. Settings:')
console.log('   - Base directory: frontend')
console.log('   - Build command: npm run build')
console.log('   - Publish directory: frontend/build')
console.log('')

console.log('🔒 Required Environment Variables for Netlify:')
console.log('REACT_APP_API_BASE=https://your-render-backend.onrender.com/api')
console.log('REACT_APP_TITLE=Mini RAG System')
console.log('REACT_APP_ENABLE_METRICS=true')
console.log('')

console.log('📚 Documentation:')
console.log('- Deployment Guide: DEPLOYMENT.md')
console.log('- Deployment Checklist: DEPLOYMENT_CHECKLIST.md')
console.log('- Cloud Deployment: CLOUD_DEPLOYMENT.md')
console.log('')

console.log('🧪 After deployment, test with:')
console.log('curl https://your-backend.onrender.com/health')
console.log('')

console.log('✅ Your Mini-RAG system is ready for deployment!')