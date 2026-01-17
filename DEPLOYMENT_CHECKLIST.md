# 🚀 RAG System Deployment Checklist

## Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Supabase project created and configured
- [ ] OpenAI API key obtained
- [ ] Cohere API key obtained (optional)
- [ ] GitHub repository set up
- [ ] All environment variables documented

### ✅ Backend Preparation
- [ ] `.env.production` file created from `.env.production.example`
- [ ] All required environment variables set
- [ ] Database schema deployed to Supabase
- [ ] Health check endpoint working locally
- [ ] All dependencies installed (`npm install`)

### ✅ Frontend Preparation
- [ ] `frontend/.env.production` file created
- [ ] Backend API URL configured
- [ ] Build process tested (`npm run build`)
- [ ] Static files generated successfully

## Render Backend Deployment

### ✅ Service Configuration
- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Web service created with settings:
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Environment**: Node
  - **Region**: Closest to users

### ✅ Environment Variables (Render Dashboard)
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `SUPABASE_URL=https://your-project.supabase.co`
- [ ] `SUPABASE_ANON_KEY=your_supabase_anon_key`
- [ ] `OPENAI_API_KEY=sk-proj-your_openai_key`
- [ ] `COHERE_API_KEY=your_cohere_key` (optional)
- [ ] `CORS_ORIGIN=https://your-netlify-app.netlify.app`
- [ ] `API_KEY=your_secure_random_key`
- [ ] `RATE_LIMIT_GENERAL=100`
- [ ] `RATE_LIMIT_PROCESSING=10`

### ✅ Deployment Verification
- [ ] Service builds successfully
- [ ] Service starts without errors
- [ ] Health check returns 200: `https://your-backend.onrender.com/health`
- [ ] API endpoints accessible

## Netlify Frontend Deployment

### ✅ Site Configuration
- [ ] Netlify account created
- [ ] GitHub repository connected
- [ ] Build settings configured:
  - **Base directory**: `frontend`
  - **Build command**: `npm run build`
  - **Publish directory**: `frontend/build`

### ✅ Environment Variables (Netlify Dashboard)
- [ ] `REACT_APP_API_BASE=https://your-backend.onrender.com/api`
- [ ] `REACT_APP_TITLE=RAG System`
- [ ] `REACT_APP_ENABLE_METRICS=true`

### ✅ Deployment Verification
- [ ] Site builds successfully
- [ ] Site deploys without errors
- [ ] Frontend loads correctly: `https://your-app.netlify.app`
- [ ] API calls work from frontend

## Post-Deployment Testing

### ✅ System Integration Tests
- [ ] Run verification script: `npm run verify:deployment`
- [ ] Upload test document through frontend
- [ ] Submit test query and verify response
- [ ] Check citations and sources display correctly
- [ ] Verify error handling works

### ✅ Performance Testing
- [ ] Test with larger documents (>10KB)
- [ ] Test concurrent requests
- [ ] Monitor response times
- [ ] Check rate limiting works

### ✅ Security Verification
- [ ] CORS configured correctly
- [ ] API keys not exposed in frontend
- [ ] Rate limiting active
- [ ] HTTPS enabled on both services

## Production Monitoring

### ✅ Setup Monitoring
- [ ] Render service monitoring enabled
- [ ] Netlify deploy notifications configured
- [ ] Health check alerts set up
- [ ] Error tracking configured (optional)

### ✅ Documentation
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide created

## Common Issues & Solutions

### Backend Issues
- **Service won't start**: Check environment variables and logs
- **Health check fails**: Verify database connection and API keys
- **CORS errors**: Update `CORS_ORIGIN` to match frontend URL
- **Rate limiting**: Adjust limits in environment variables

### Frontend Issues
- **Build fails**: Check Node.js version and dependencies
- **API calls fail**: Verify `REACT_APP_API_BASE` URL
- **Blank page**: Check browser console for errors
- **Routing issues**: Verify `_redirects` file exists

### Integration Issues
- **No search results**: Ensure documents are processed and indexed
- **Citations missing**: Check reranking service configuration
- **Slow responses**: Monitor API usage and optimize queries

## Quick Commands

```bash
# Test local setup
npm run test:system

# Verify deployment
npm run verify:deployment

# Check backend health
curl https://your-backend.onrender.com/health

# Deploy to production
npm run deploy

# View logs (Render)
# Go to Render Dashboard → Your Service → Logs

# View deploy logs (Netlify)
# Go to Netlify Dashboard → Site → Deploys
```

## Support Resources

- **Render Documentation**: https://render.com/docs
- **Netlify Documentation**: https://docs.netlify.com
- **Supabase Documentation**: https://supabase.com/docs
- **OpenAI API Documentation**: https://platform.openai.com/docs
- **Cohere API Documentation**: https://docs.cohere.com

---

✅ **Deployment Complete!** Your RAG system is now live and ready for production use.