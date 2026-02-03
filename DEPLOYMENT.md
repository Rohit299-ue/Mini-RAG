# Deployment Guide

Complete guide for deploying Mini RAG to production.

## Prerequisites

- Supabase account (free tier works)
- OpenAI API key
- Cohere API key
- Render account (for backend)
- Vercel account (for frontend)

## Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database to initialize

### 1.2 Enable pgvector

1. Go to SQL Editor in Supabase dashboard
2. Run the SQL from `backend/schema.sql`
3. Verify extension: `SELECT * FROM pg_extension WHERE extname = 'vector';`

### 1.3 Get Connection String

1. Go to Project Settings → Database
2. Copy the connection string (URI format)
3. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

## Step 2: Backend Deployment (Render)

### 2.1 Prepare Repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2.2 Deploy to Render

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: mini-rag-backend
   - **Region**: Choose closest to you
   - **Branch**: main
   - **Root Directory**: backend
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 2.3 Set Environment Variables

In Render dashboard, add:

```
OPENAI_API_KEY=sk-...
COHERE_API_KEY=...
SUPABASE_DB_URL=postgresql://...
```

### 2.4 Deploy

1. Click "Create Web Service"
2. Wait for deployment (3-5 minutes)
3. Note your backend URL: `https://mini-rag-backend.onrender.com`

### 2.5 Initialize Database

After first deployment:

```bash
# SSH into Render or run locally with production DB URL
python setup_db.py
```

## Step 3: Frontend Deployment (Vercel)

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Deploy Frontend

```bash
cd frontend
vercel
```

Follow prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N**
- Project name? **mini-rag-frontend**
- Directory? **./frontend**
- Override settings? **N**

### 3.3 Set Environment Variable

```bash
vercel env add VITE_API_URL
```

Enter your Render backend URL: `https://mini-rag-backend.onrender.com`

### 3.4 Deploy to Production

```bash
vercel --prod
```

Your app is now live! 🎉

## Step 4: Verify Deployment

### 4.1 Test Backend

```bash
curl https://mini-rag-backend.onrender.com/health
```

Expected: `{"status":"healthy"}`

### 4.2 Test Frontend

Visit your Vercel URL and:
1. Upload a test document
2. Ask a question
3. Verify answer with citations

## Step 5: Post-Deployment

### 5.1 Monitor Logs

**Render:**
- Go to your service → Logs tab
- Monitor for errors

**Vercel:**
- Go to your project → Deployments
- Click on deployment → View Function Logs

### 5.2 Set Up Alerts (Optional)

**Render:**
- Enable email notifications for deployment failures

**Supabase:**
- Monitor database usage in dashboard
- Set up alerts for connection limits

### 5.3 Cost Optimization

**Free Tier Limits:**
- Render: 750 hours/month (enough for 1 service)
- Vercel: 100GB bandwidth/month
- Supabase: 500MB database, 2GB bandwidth
- OpenAI: Pay per use (~$0.01-0.02 per query)
- Cohere: 1000 free API calls/month

**Tips:**
- Use Render's auto-sleep for low traffic
- Cache common queries (future enhancement)
- Monitor API usage in OpenAI/Cohere dashboards

## Troubleshooting

### Backend won't start

**Check:**
1. Environment variables set correctly
2. Python version (3.9+)
3. Dependencies installed
4. Database connection string valid

**Fix:**
```bash
# View logs in Render dashboard
# Common issues:
# - Missing env vars
# - Database connection timeout
# - Port binding (use $PORT)
```

### Frontend can't connect to backend

**Check:**
1. VITE_API_URL set correctly
2. CORS enabled in backend
3. Backend is running

**Fix:**
```bash
# Verify env var
vercel env ls

# Update if needed
vercel env rm VITE_API_URL
vercel env add VITE_API_URL
vercel --prod
```

### Database connection errors

**Check:**
1. Supabase project is active
2. Connection string includes password
3. IP allowlist (Supabase allows all by default)

**Fix:**
- Regenerate database password in Supabase
- Update SUPABASE_DB_URL in Render
- Restart Render service

### Slow performance

**Optimize:**
1. Enable connection pooling
2. Increase Render instance size
3. Add database indexes
4. Reduce chunk size or top-k

## Updating Deployment

### Backend Updates

```bash
git add .
git commit -m "Update backend"
git push
```

Render auto-deploys on push.

### Frontend Updates

```bash
cd frontend
git add .
git commit -m "Update frontend"
git push
vercel --prod
```

## Security Checklist

- [ ] Environment variables not in code
- [ ] API keys rotated regularly
- [ ] HTTPS enabled (automatic on Render/Vercel)
- [ ] Database password strong
- [ ] CORS configured properly
- [ ] Rate limiting (future enhancement)
- [ ] Input validation enabled
- [ ] Error messages don't leak secrets

## Scaling Considerations

**When to scale:**
- Response time > 5 seconds
- Database connections maxed
- API rate limits hit
- Memory/CPU usage high

**How to scale:**
1. Upgrade Render plan (more CPU/RAM)
2. Upgrade Supabase plan (more connections)
3. Add Redis caching layer
4. Implement request queuing
5. Use batch processing for uploads

## Backup Strategy

**Database:**
```bash
# Supabase auto-backups (paid plans)
# Or manual backup:
pg_dump $SUPABASE_DB_URL > backup.sql
```

**Code:**
- Git repository is your backup
- Tag releases: `git tag v1.0.0`

## Monitoring

**Key Metrics:**
- Request latency (target: < 3s)
- Error rate (target: < 1%)
- Database query time
- API costs
- Token usage

**Tools:**
- Render metrics dashboard
- Vercel analytics
- Supabase dashboard
- OpenAI usage page
- Cohere dashboard

---

Need help? Check logs first, then review this guide. Most issues are environment variables or connection strings.
