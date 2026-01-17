# 🚀 RAG System Deployment Guide

This guide covers deploying your RAG system to production using Render (backend) and Netlify (frontend).

## 📋 Quick Start

1. **Follow the checklist**: See [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) for detailed steps
2. **Setup environment**: Run `node scripts/setup-production-env.js`
3. **Deploy services**: Follow the cloud deployment guide in [`CLOUD_DEPLOYMENT.md`](./CLOUD_DEPLOYMENT.md)
4. **Verify deployment**: Run `npm run verify:deployment`

## 🛠️ Available Scripts

### Setup & Configuration
```bash
# Interactive production environment setup
node scripts/setup-production-env.js

# Test system locally before deployment
npm run test:system
```

### Deployment
```bash
# Deploy to production (Linux/Mac)
npm run deploy

# Deploy using PowerShell (Windows)
npm run deploy:windows

# Simple Windows deployment helper
npm run deploy:windows:simple
```

### Verification
```bash
# Verify production deployment
npm run verify:deployment

# Check environment variables
npm run check-env
```

## 🌐 Deployment Targets

### Backend: Render
- **Service Type**: Web Service
- **Environment**: Node.js
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Port**: 10000 (configured via PORT env var)

### Frontend: Netlify
- **Build Directory**: `frontend`
- **Build Command**: `npm run build`
- **Publish Directory**: `frontend/build`
- **Node Version**: 18

## 🔧 Environment Variables

### Backend (Render)
```env
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=sk-proj-your_openai_key
COHERE_API_KEY=your_cohere_key
CORS_ORIGIN=https://your-netlify-app.netlify.app
API_KEY=your_secure_random_key
RATE_LIMIT_GENERAL=100
RATE_LIMIT_PROCESSING=10
```

### Frontend (Netlify)
```env
REACT_APP_API_BASE=https://your-backend.onrender.com/api
REACT_APP_TITLE=RAG System
REACT_APP_ENABLE_METRICS=true
```

## 🧪 Testing Your Deployment

### Automated Testing
```bash
# Run the verification script
npm run verify:deployment
```

### Manual Testing
1. **Backend Health**: Visit `https://your-backend.onrender.com/health`
2. **Frontend**: Visit `https://your-app.netlify.app`
3. **Complete Pipeline**: Upload a document and ask a question

### API Testing
```bash
# Test document processing
curl -X POST https://your-backend.onrender.com/api/documents/process \
  -H "Content-Type: application/json" \
  -d '{"text": "Test document", "metadata": {"title": "Test"}}'

# Test complete RAG pipeline
curl -X POST https://your-backend.onrender.com/api/answers/complete-rag \
  -H "Content-Type: application/json" \
  -d '{"query": "What is this about?", "topK": 10}'
```

## 🔒 Security Checklist

- [ ] API keys stored as environment variables (not in code)
- [ ] CORS configured with specific origins
- [ ] Rate limiting enabled
- [ ] HTTPS enabled on both services
- [ ] Input validation active
- [ ] Error messages don't expose sensitive information

## 📊 Monitoring & Maintenance

### Health Monitoring
- **Backend**: `https://your-backend.onrender.com/health`
- **Render Dashboard**: Monitor logs, metrics, and deployments
- **Netlify Dashboard**: Monitor builds and deployments

### Log Access
- **Render**: Dashboard → Your Service → Logs
- **Netlify**: Dashboard → Site → Functions (if using) or Deploy logs

### Performance Monitoring
- Monitor API response times
- Track error rates
- Monitor resource usage
- Set up alerts for service downtime

## 🚨 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check logs in Render dashboard
# Common causes:
# - Missing environment variables
# - Invalid API keys
# - Database connection issues
```

#### Frontend Build Fails
```bash
# Check build logs in Netlify
# Common causes:
# - Node.js version mismatch
# - Missing dependencies
# - Environment variable issues
```

#### CORS Errors
```bash
# Update CORS_ORIGIN in Render environment variables
# Must match your Netlify URL exactly
```

#### API Calls Fail
```bash
# Check REACT_APP_API_BASE in Netlify environment variables
# Must match your Render backend URL
```

### Getting Help
1. Check the deployment checklist
2. Run the verification script
3. Review service logs
4. Check environment variables
5. Test locally first

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Cloud Deployment Guide](./CLOUD_DEPLOYMENT.md)

## 🎯 Production Best Practices

### Performance
- Use CDN for static assets (Netlify provides this)
- Enable gzip compression (enabled by default)
- Monitor and optimize API response times
- Consider caching strategies for frequent queries

### Security
- Regularly rotate API keys
- Monitor API usage and costs
- Set up proper logging and alerting
- Use environment-specific configurations

### Reliability
- Set up health check monitoring
- Configure auto-scaling if needed
- Plan for disaster recovery
- Document your deployment process

---

🎉 **Your RAG system is now ready for production!** Follow this guide and use the provided scripts for a smooth deployment experience.