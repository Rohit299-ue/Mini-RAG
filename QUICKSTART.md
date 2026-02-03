# Quick Start Guide

Get Mini RAG running locally in 5 minutes.

## Prerequisites

- Python 3.9+
- Node.js 18+
- Supabase account (free)
- OpenAI API key
- Cohere API key

## Step 1: Clone & Setup

```bash
# Clone repository
git clone <your-repo>
cd mini-rag
```

## Step 2: Database Setup

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Copy and run `backend/schema.sql`
4. Get connection string from Settings → Database

## Step 3: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux

# Edit .env and add your keys:
# OPENAI_API_KEY=sk-...
# COHERE_API_KEY=...
# SUPABASE_DB_URL=postgresql://...

# Initialize database
python setup_db.py

# Start server
uvicorn main:app --reload
```

Backend running at http://localhost:8000

## Step 4: Frontend Setup

Open new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux

# Edit .env:
# VITE_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

Frontend running at http://localhost:3000

## Step 5: Test It Out

1. Open http://localhost:3000
2. Paste some text in the upload panel
3. Click "Upload & Process"
4. Ask a question about the text
5. Get answer with citations!

## Example Test

**Upload this text:**
```
Python is a high-level programming language known for its simplicity and readability. 
It was created by Guido van Rossum and first released in 1991. Python supports 
multiple programming paradigms including procedural, object-oriented, and functional 
programming. It has a comprehensive standard library and a large ecosystem of 
third-party packages available through PyPI.
```

**Ask:** "Who created Python and when?"

**Expected:** Answer with citations pointing to the relevant text chunks.

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.9+)
- Verify .env file exists and has all keys
- Test database connection in Supabase dashboard

### Frontend won't start
- Check Node version: `node --version` (need 18+)
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Verify VITE_API_URL in .env

### Can't connect to backend
- Ensure backend is running on port 8000
- Check CORS settings in main.py
- Verify API_URL in frontend .env

### Database errors
- Confirm pgvector extension enabled: Run `SELECT * FROM pg_extension WHERE extname = 'vector';`
- Check connection string format
- Verify Supabase project is active

## Next Steps

- Read [README.md](README.md) for architecture details
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Run evaluation: `cd evaluation && python run_eval.py`
- Customize chunk size in `backend/chunking.py`
- Adjust retrieval parameters in `backend/retriever.py`

## API Documentation

Once backend is running, visit:
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Development Tips

**Backend hot reload:**
```bash
uvicorn main:app --reload --port 8000
```

**Frontend hot reload:**
```bash
npm run dev
```

**View logs:**
- Backend: Terminal output
- Frontend: Browser console (F12)

**Test API directly:**
```bash
# Upload
curl -X POST http://localhost:8000/upload \
  -H "Content-Type: application/json" \
  -d '{"content":"Test document","title":"Test"}'

# Ask
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is this about?"}'
```

## Common Issues

**"Module not found" errors:**
```bash
pip install -r requirements.txt --force-reinstall
```

**Port already in use:**
```bash
# Change port in uvicorn command
uvicorn main:app --reload --port 8001
```

**CORS errors:**
- Check allow_origins in main.py
- Verify frontend URL matches

**Slow responses:**
- First query is slower (cold start)
- Check API rate limits
- Monitor token usage

---

Happy building! 🚀
