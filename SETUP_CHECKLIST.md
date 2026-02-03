# Setup Checklist

Complete checklist for setting up Mini RAG from scratch.

## Pre-Setup

### 1. Prerequisites Check

- [ ] Python 3.9+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] Code editor (VS Code recommended)
- [ ] Terminal/command line access

### 2. API Keys & Accounts

- [ ] OpenAI account created
- [ ] OpenAI API key obtained (https://platform.openai.com/api-keys)
- [ ] Cohere account created
- [ ] Cohere API key obtained (https://dashboard.cohere.com/api-keys)
- [ ] Supabase account created (https://supabase.com)
- [ ] Supabase project created

## Database Setup

### 3. Supabase Configuration

- [ ] Logged into Supabase dashboard
- [ ] Created new project
- [ ] Waited for project initialization (2-3 minutes)
- [ ] Navigated to SQL Editor
- [ ] Copied contents of `backend/schema.sql`
- [ ] Executed SQL in Supabase SQL Editor
- [ ] Verified pgvector extension enabled
- [ ] Verified documents table created
- [ ] Navigated to Settings → Database
- [ ] Copied connection string (URI format)
- [ ] Saved connection string securely

## Backend Setup

### 4. Backend Environment

- [ ] Opened terminal
- [ ] Navigated to project root
- [ ] Changed to backend directory (`cd backend`)
- [ ] Created virtual environment (`python -m venv venv`)
- [ ] Activated virtual environment
  - Windows: `venv\Scripts\activate`
  - Mac/Linux: `source venv/bin/activate`
- [ ] Verified activation (prompt shows `(venv)`)

### 5. Backend Dependencies

- [ ] Installed requirements (`pip install -r requirements.txt`)
- [ ] Verified installation (no errors)
- [ ] Checked installed packages (`pip list`)

### 6. Backend Configuration

- [ ] Copied `.env.example` to `.env`
- [ ] Opened `.env` in editor
- [ ] Added OpenAI API key
- [ ] Added Cohere API key
- [ ] Added Supabase connection string
- [ ] Saved `.env` file
- [ ] Verified no spaces around `=` signs

### 7. Database Initialization

- [ ] Ran setup script (`python setup_db.py`)
- [ ] Verified success message
- [ ] Checked Supabase dashboard for tables
- [ ] Verified vector index created

### 8. Backend Testing

- [ ] Started server (`uvicorn main:app --reload`)
- [ ] Verified server started (no errors)
- [ ] Opened http://localhost:8000 in browser
- [ ] Saw welcome message
- [ ] Opened http://localhost:8000/docs
- [ ] Saw API documentation
- [ ] Tested health endpoint: http://localhost:8000/health
- [ ] Received `{"status":"healthy"}`

## Frontend Setup

### 9. Frontend Environment

- [ ] Opened new terminal (keep backend running)
- [ ] Navigated to project root
- [ ] Changed to frontend directory (`cd frontend`)

### 10. Frontend Dependencies

- [ ] Installed packages (`npm install`)
- [ ] Verified installation (no errors)
- [ ] Checked node_modules created

### 11. Frontend Configuration

- [ ] Copied `.env.example` to `.env`
- [ ] Opened `.env` in editor
- [ ] Set `VITE_API_URL=http://localhost:8000`
- [ ] Saved `.env` file

### 12. Frontend Testing

- [ ] Started dev server (`npm run dev`)
- [ ] Verified server started
- [ ] Opened http://localhost:3000 in browser
- [ ] Saw Mini RAG interface
- [ ] Verified two panels visible
- [ ] Checked browser console (F12) for errors

## Integration Testing

### 13. End-to-End Test

- [ ] Prepared test document (see below)
- [ ] Pasted test document in upload panel
- [ ] Added title: "Test Document"
- [ ] Clicked "Upload & Process"
- [ ] Saw success message with chunk count
- [ ] Waited for processing to complete
- [ ] Entered test question (see below)
- [ ] Clicked "Ask Question"
- [ ] Saw loading spinner
- [ ] Received answer with citations
- [ ] Verified citations displayed
- [ ] Checked processing time shown
- [ ] Verified token count shown

**Test Document:**
```
Artificial Intelligence (AI) is transforming modern technology. Machine learning, 
a subset of AI, enables computers to learn from data without explicit programming. 
Deep learning uses neural networks with multiple layers to process complex patterns. 
Natural Language Processing (NLP) allows computers to understand human language. 
Computer vision enables machines to interpret visual information from the world.
```

**Test Question:**
```
What is machine learning?
```

**Expected Result:**
- Answer mentions "subset of AI" and "learn from data"
- Citations reference the uploaded text
- Processing time < 5 seconds
- No errors

### 14. Error Testing

- [ ] Tried uploading empty text (should show error)
- [ ] Tried asking question without upload (should return "no information")
- [ ] Tried very short question (should show error)
- [ ] Verified all errors handled gracefully

## Troubleshooting

### 15. Common Issues Check

**Backend won't start:**
- [ ] Checked Python version (3.9+)
- [ ] Verified virtual environment activated
- [ ] Confirmed all dependencies installed
- [ ] Verified .env file exists
- [ ] Checked API keys are valid
- [ ] Confirmed database connection string correct
- [ ] Checked port 8000 not in use

**Frontend won't start:**
- [ ] Checked Node version (18+)
- [ ] Verified npm install completed
- [ ] Confirmed .env file exists
- [ ] Checked VITE_API_URL correct
- [ ] Verified port 3000 not in use
- [ ] Cleared browser cache

**Can't connect to backend:**
- [ ] Confirmed backend is running
- [ ] Checked backend URL in frontend .env
- [ ] Verified CORS enabled in main.py
- [ ] Checked browser console for errors
- [ ] Tested backend directly: http://localhost:8000/health

**Database errors:**
- [ ] Verified Supabase project active
- [ ] Confirmed pgvector extension enabled
- [ ] Checked connection string format
- [ ] Tested connection in Supabase dashboard
- [ ] Verified tables exist

**API errors:**
- [ ] Confirmed API keys valid
- [ ] Checked API key format (no extra spaces)
- [ ] Verified API quotas not exceeded
- [ ] Checked OpenAI account has credits
- [ ] Confirmed Cohere free tier available

## Production Deployment

### 16. Pre-Deployment

- [ ] All local tests passing
- [ ] Code committed to Git
- [ ] Repository pushed to GitHub
- [ ] .env files not committed (in .gitignore)
- [ ] README.md reviewed
- [ ] Documentation complete

### 17. Backend Deployment (Render)

- [ ] Render account created
- [ ] New Web Service created
- [ ] Repository connected
- [ ] Build command set
- [ ] Start command set
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Backend URL noted
- [ ] Health endpoint tested

### 18. Frontend Deployment (Vercel)

- [ ] Vercel account created
- [ ] Vercel CLI installed
- [ ] Deployed from frontend directory
- [ ] Environment variable set (VITE_API_URL)
- [ ] Production deployment successful
- [ ] Frontend URL noted
- [ ] Tested in browser

### 19. Post-Deployment

- [ ] Tested upload on production
- [ ] Tested question on production
- [ ] Verified citations work
- [ ] Checked response times acceptable
- [ ] Monitored logs for errors
- [ ] Set up monitoring/alerts
- [ ] Documented production URLs

## Maintenance

### 20. Ongoing Tasks

- [ ] Monitor API usage (OpenAI, Cohere)
- [ ] Check database storage (Supabase)
- [ ] Review application logs
- [ ] Update dependencies monthly
- [ ] Rotate API keys quarterly
- [ ] Backup database regularly
- [ ] Monitor costs
- [ ] Collect user feedback

## Success Criteria

### 21. Final Verification

- [ ] Local development working
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Production deployment successful
- [ ] Monitoring in place
- [ ] Team trained (if applicable)
- [ ] Backup strategy defined
- [ ] Scaling plan documented

## Resources

### 22. Reference Links

- [ ] Bookmarked OpenAI docs: https://platform.openai.com/docs
- [ ] Bookmarked Cohere docs: https://docs.cohere.com
- [ ] Bookmarked Supabase docs: https://supabase.com/docs
- [ ] Bookmarked FastAPI docs: https://fastapi.tiangolo.com
- [ ] Bookmarked React docs: https://react.dev
- [ ] Saved project README
- [ ] Saved QUICKSTART guide
- [ ] Saved DEPLOYMENT guide

## Notes

**Estimated Setup Time:**
- Prerequisites: 30 minutes
- Database setup: 15 minutes
- Backend setup: 20 minutes
- Frontend setup: 15 minutes
- Testing: 20 minutes
- **Total: ~2 hours**

**Common Pitfalls:**
1. Forgetting to activate virtual environment
2. Wrong Python/Node version
3. Missing .env file
4. Incorrect connection string format
5. API keys with extra spaces
6. Port conflicts (8000, 3000)
7. CORS issues (check allow_origins)

**Pro Tips:**
1. Keep terminals organized (one for backend, one for frontend)
2. Use VS Code integrated terminal
3. Check logs immediately if something fails
4. Test each step before moving to next
5. Save API keys in password manager
6. Document any custom changes
7. Keep dependencies updated

---

✅ **Setup Complete!** You now have a fully functional RAG system.

Next steps:
- Read ARCHITECTURE.md for technical details
- Customize chunk size/overlap for your use case
- Add authentication for production
- Implement caching for better performance
- Explore advanced features

Need help? Check troubleshooting section or review documentation.
