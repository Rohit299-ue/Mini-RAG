# 🚀 Quick Deploy Guide - Mini RAG

**Repository**: `https://github.com/Rohit299-ue/Mini-RAG`

## 🔧 Backend (Render)

### 1. Create Service
- Go to [render.com](https://render.com)
- New Web Service → Connect `Rohit299-ue/Mini-RAG`

### 2. Configure
```yaml
Build Command: npm install
Start Command: npm start
Environment: Node
```

### 3. Environment Variables
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

## 🎨 Frontend (Netlify)

### 1. Create Site
- Go to [netlify.com](https://netlify.com)
- New site from Git → `Rohit299-ue/Mini-RAG`

### 2. Configure
```yaml
Base directory: frontend
Build command: npm run build
Publish directory: frontend/build
```

### 3. Environment Variables
```env
REACT_APP_API_BASE=https://your-render-backend.onrender.com/api
REACT_APP_TITLE=Mini RAG System
REACT_APP_ENABLE_METRICS=true
```

## 🧪 Test Deployment

```bash
# Health check
curl https://your-backend.onrender.com/health

# Expected response
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "openai": "connected",
    "cohere": "connected"
  }
}
```

## 🔒 Security Checklist

- [ ] API keys stored in environment variables (not code)
- [ ] CORS_ORIGIN matches your Netlify URL exactly
- [ ] Different API keys for dev/prod
- [ ] Rate limiting enabled
- [ ] HTTPS enabled (automatic on both platforms)

## 💡 Pro Tips

1. **Deploy backend first**, get the URL, then deploy frontend
2. **Update CORS_ORIGIN** after frontend deployment
3. **Test health endpoint** before testing full pipeline
4. **Monitor logs** in both Render and Netlify dashboards
5. **Set up billing alerts** for API usage

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Your Repo**: https://github.com/Rohit299-ue/Mini-RAG

---

🎉 **Ready to deploy!** Your Mini-RAG system is production-ready.