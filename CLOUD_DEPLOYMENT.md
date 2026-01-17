# 🌐 Cloud Deployment Guide: Render + Netlify

Complete guide for deploying your RAG system to production using Render (backend) and Netlify (frontend).

## 📋 Overview

- **Backend**: Deploy to Render (Node.js service)
- **Frontend**: Deploy to Netlify (Static site)
- **Database**: Supabase (already cloud-hosted)
- **AI Services**: OpenAI + Cohere APIs

## 🚀 Backend Deployment on Render

### 1. Prepare Your Repository

Ensure your backend code is in a Git repository (GitHub, GitLab, or Bitbucket).

### 2. Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub/GitLab/Bitbucket
3. Connect your repository

### 3. Create Web Service

1. Click "New +" → "Web Service"
2. Connect your repository
3. Configure the service:

```yaml
# Service Configuration
Name: rag-backend
Environment: Node
Region: Oregon (US West) or closest to your users
Branch: main
Root Directory: . (or backend/ if in subdirectory)
Build Command: npm install
Start Command: npm start
```

### 4. Environment Variables

In Render dashboard, add these environment variables:

```env
# Required - Core Services
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=sk-your_openai_api_key

# Optional - Enhanced Features
COHERE_API_KEY=your_cohere_api_key

# Security
CORS_ORIGIN=https://your-netlify-app.netlify.app
API_KEY_HEADER=X-API-Key
API_KEY=your_secure_random_api_key_here

# Performance
RATE_LIMIT_GENERAL=100
RATE_LIMIT_PROCESSING=10
LOG_LEVEL=info
```

### 5. Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Your backend will be available at: `https://your-service-name.onrender.com`

## 🎨 Frontend Deployment on Netlify

### 1. Prepare Frontend Build

Update your frontend configuration for production:

#### Update `frontend/package.json`:
```json
{
  "scripts": {
    "build": "react-scripts build",
    "start": "react-scripts start"
  },
  "homepage": "."
}
```

#### Create `frontend/public/_redirects`:
```
/*    /index.html   200
```

### 2. Environment Configuration

#### Create `frontend/.env.production`:
```env
# Production API URL (your Render backend)
REACT_APP_API_BASE=https://your-rag-backend.onrender.com/api

# Optional: Branding
REACT_APP_TITLE=RAG System
REACT_APP_DESCRIPTION=AI-Powered Document Search

# Optional: Feature flags
REACT_APP_ENABLE_METRICS=true
REACT_APP_ENABLE_ADVANCED_OPTIONS=true
```

### 3. Deploy to Netlify

#### Option A: Git Integration (Recommended)
1. Go to [netlify.com](https://netlify.com)
2. Sign up and connect your Git provider
3. Click "New site from Git"
4. Select your repository
5. Configure build settings:

```yaml
# Build Settings
Base directory: frontend
Build command: npm run build
Publish directory: frontend/build
```

#### Option B: Manual Deploy
```bash
cd frontend
npm run build
# Drag and drop the 'build' folder to Netlify
```

### 4. Environment Variables in Netlify

1. Go to Site Settings → Environment Variables
2. Add production environment variables:

```env
REACT_APP_API_BASE=https://your-rag-backend.onrender.com/api
REACT_APP_TITLE=RAG System
REACT_APP_ENABLE_METRICS=true
```

### 5. Custom Domain (Optional)

1. Go to Domain Settings
2. Add your custom domain
3. Configure DNS records
4. Enable HTTPS (automatic)

## 🔒 Security Best Practices

### 1. API Key Management

#### ✅ DO:
```env
# Use environment variables
OPENAI_API_KEY=sk-proj-abc123...
COHERE_API_KEY=co-abc123...

# Use secure random strings for internal keys
API_KEY=crypto.randomBytes(32).toString('hex')

# Rotate keys regularly
# Use different keys for different environments
```

#### ❌ DON'T:
```javascript
// Never hardcode in source code
const apiKey = "sk-proj-abc123..."; // ❌ NEVER DO THIS

// Never commit .env files
git add .env // ❌ NEVER DO THIS

// Never expose backend keys in frontend
REACT_APP_OPENAI_KEY=sk-... // ❌ EXPOSED TO USERS
```

### 2. CORS Configuration

#### Backend CORS Setup:
```javascript
// In your backend
app.use(cors({
  origin: [
    'http://localhost:3001', // Development
    'https://your-app.netlify.app', // Production
    'https://your-custom-domain.com' // Custom domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
```

### 3. Rate Limiting

```javascript
// Protect your API endpoints
const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests, please try again later'
});

const processingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // processing requests per minute
  message: 'Processing rate limit exceeded'
});
```

### 4. Input Validation

```javascript
// Validate all inputs
const { body, validationResult } = require('express-validator');

app.post('/api/documents/process', [
  body('text').isLength({ min: 1, max: 1000000 }),
  body('metadata.title').optional().isLength({ max: 200 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request...
});
```

## 📁 Complete Environment Files

### Backend `.env.example`:
```env
# ==============================================
# RAG Backend Environment Configuration
# ==============================================

# Server Configuration
NODE_ENV=production
PORT=10000

# Database Configuration (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Service APIs
OPENAI_API_KEY=sk-proj-your_openai_api_key_here
COHERE_API_KEY=your_cohere_api_key_here

# Security Configuration
CORS_ORIGIN=https://your-netlify-app.netlify.app
API_KEY_HEADER=X-API-Key
API_KEY=your_secure_random_api_key_32_chars_min

# Rate Limiting (requests per time window)
RATE_LIMIT_GENERAL=100
RATE_LIMIT_PROCESSING=10

# Performance Tuning
CHUNK_MIN_SIZE=800
CHUNK_MAX_SIZE=1200
CHUNK_OVERLAP_PERCENTAGE=0.125

# Logging
LOG_LEVEL=info
LOG_FILE=/tmp/rag-system.log

# Health Check
HEALTH_CHECK_INTERVAL=30000

# Optional: Redis for caching (if using Redis addon)
# REDIS_URL=redis://localhost:6379
# CACHE_TTL=3600

# Optional: Custom model settings
# DEFAULT_MODEL=gpt-4-turbo-preview
# DEFAULT_TEMPERATURE=0.1
# DEFAULT_MAX_TOKENS=1000
```

### Frontend `.env.example`:
```env
# ==============================================
# RAG Frontend Environment Configuration
# ==============================================

# Backend API Configuration
REACT_APP_API_BASE=https://your-rag-backend.onrender.com/api

# Application Branding
REACT_APP_TITLE=RAG System
REACT_APP_DESCRIPTION=AI-Powered Document Search with Citations

# Feature Flags
REACT_APP_ENABLE_METRICS=true
REACT_APP_ENABLE_ADVANCED_OPTIONS=true
REACT_APP_ENABLE_FILE_UPLOAD=true
REACT_APP_ENABLE_EXAMPLES=true

# Default Query Parameters
REACT_APP_DEFAULT_TOP_K=30
REACT_APP_DEFAULT_FINAL_K=10
REACT_APP_DEFAULT_RERANK_TOP_N=5
REACT_APP_DEFAULT_LAMBDA=0.7
REACT_APP_DEFAULT_THRESHOLD=0.3
REACT_APP_DEFAULT_TEMPERATURE=0.1

# UI Configuration
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_SUPPORTED_FILE_TYPES=.txt,.md,.csv
REACT_APP_MAX_QUERY_LENGTH=2000
REACT_APP_MAX_DOCUMENT_LENGTH=1000000

# Optional: Analytics (if using)
# REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX
# REACT_APP_HOTJAR_ID=1234567

# Optional: Error tracking (if using Sentry)
# REACT_APP_SENTRY_DSN=https://your-sentry-dsn
```

## 🔧 Deployment Scripts

### Create `deploy.sh`:
```bash
#!/bin/bash

echo "🚀 Deploying RAG System to Production..."

# Backend deployment (Render auto-deploys on git push)
echo "📦 Pushing backend changes..."
git add .
git commit -m "Deploy: $(date)"
git push origin main

# Frontend deployment
echo "🎨 Building and deploying frontend..."
cd frontend
npm run build

# Deploy to Netlify (if using Netlify CLI)
if command -v netlify &> /dev/null; then
    netlify deploy --prod --dir=build
else
    echo "📁 Manual deploy: Upload 'frontend/build' folder to Netlify"
fi

echo "✅ Deployment complete!"
echo "🌐 Backend: https://your-rag-backend.onrender.com"
echo "🎨 Frontend: https://your-app.netlify.app"
```

### Create `frontend/netlify.toml`:
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## 🧪 Testing Production Deployment

### 1. Health Check
```bash
# Test backend health
curl https://your-rag-backend.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "openai": "connected",
    "cohere": "connected"
  }
}
```

### 2. End-to-End Test
```bash
# Test document processing
curl -X POST https://your-rag-backend.onrender.com/api/documents/process \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Machine learning is a subset of artificial intelligence.",
    "metadata": {"title": "Test Document"}
  }'

# Test complete RAG pipeline
curl -X POST https://your-rag-backend.onrender.com/api/answers/complete-rag \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is machine learning?",
    "topK": 10,
    "rerankTopN": 3
  }'
```

### 3. Frontend Test
1. Visit your Netlify URL
2. Upload a test document
3. Ask a question
4. Verify citations and sources work

## 🚨 Troubleshooting

### Common Issues

#### Backend Issues:
```bash
# Check Render logs
# Go to Render Dashboard → Your Service → Logs

# Common fixes:
# 1. Verify environment variables are set
# 2. Check build logs for npm install errors
# 3. Ensure start command is correct: "npm start"
# 4. Verify Node.js version compatibility
```

#### Frontend Issues:
```bash
# Check Netlify deploy logs
# Go to Netlify Dashboard → Site → Deploys

# Common fixes:
# 1. Verify build command: "npm run build"
# 2. Check publish directory: "build"
# 3. Ensure _redirects file exists
# 4. Verify environment variables
```

#### CORS Issues:
```javascript
// Update backend CORS configuration
app.use(cors({
  origin: [
    'https://your-actual-netlify-url.netlify.app',
    'https://your-custom-domain.com'
  ]
}));
```

## 💰 Cost Estimation

### Render (Backend):
- **Free Tier**: $0/month (with limitations)
- **Starter**: $7/month (recommended)
- **Standard**: $25/month (high traffic)

### Netlify (Frontend):
- **Free Tier**: $0/month (100GB bandwidth)
- **Pro**: $19/month (1TB bandwidth)

### API Costs:
- **OpenAI**: ~$0.002 per 1K tokens
- **Cohere**: ~$0.001 per search
- **Supabase**: Free tier available

**Total estimated cost**: $7-50/month depending on usage

## 🔄 Continuous Deployment

### Auto-Deploy Setup:
1. **Render**: Auto-deploys on git push to main branch
2. **Netlify**: Auto-deploys on git push to main branch
3. **Environment Variables**: Managed in respective dashboards
4. **Monitoring**: Set up health check alerts

Your RAG system is now production-ready with proper security, monitoring, and scalability! 🚀

## 📋 Quick Start

1. **Use the deployment checklist**: See `DEPLOYMENT_CHECKLIST.md` for a step-by-step guide
2. **Run the setup script**: `node scripts/setup-production-env.js`
3. **Verify your deployment**: `npm run verify:deployment`

## 🔧 Troubleshooting

If you encounter issues, check the deployment checklist and run the verification script to identify problems.