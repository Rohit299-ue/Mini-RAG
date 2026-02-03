# Mini RAG - Documentation Index

Complete guide to navigating the Mini RAG project documentation.

## 🚀 Quick Navigation

### I'm New Here
Start with these files in order:
1. [README.md](README.md) - Project overview and main documentation
2. [GETTING_STARTED.md](GETTING_STARTED.md) - User-friendly introduction
3. [QUICKSTART.md](QUICKSTART.md) - Get running in 5 minutes

### I Want to Setup Locally
Follow this path:
1. [QUICKSTART.md](QUICKSTART.md) - Fast setup guide
2. [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) - Detailed step-by-step
3. [Troubleshooting](#troubleshooting) - If you hit issues

### I Want to Deploy to Production
Follow this sequence:
1. [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
2. [Backend Setup](#backend-deployment) - Render configuration
3. [Frontend Setup](#frontend-deployment) - Vercel configuration

### I Want to Understand the Code
Read these in order:
1. [ARCHITECTURE.md](ARCHITECTURE.md) - Technical deep dive
2. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Code organization
3. [SYSTEM_DIAGRAM.txt](SYSTEM_DIAGRAM.txt) - Visual architecture

### I Want to Customize
Check these resources:
1. [Configuration Options](#configuration) - Adjust settings
2. [Code Modules](#backend-modules) - Understand components
3. [Best Practices](#best-practices) - Guidelines

## 📚 Complete Documentation List

### Core Documentation (Start Here)

#### [README.md](README.md)
**Purpose:** Main project documentation  
**Contents:**
- Architecture overview with diagram
- Tech stack details
- RAG pipeline configuration
- Setup instructions (backend + frontend)
- API endpoint documentation
- Deployment guide (Render + Vercel)
- Trade-offs and limitations
- Performance metrics

**When to read:** First thing, to understand the project

---

#### [GETTING_STARTED.md](GETTING_STARTED.md)
**Purpose:** User-friendly introduction  
**Contents:**
- What is Mini RAG (simple explanation)
- How it works (non-technical)
- 5-minute quick start
- Understanding the system
- Common use cases
- Configuration options
- Best practices
- Troubleshooting
- FAQ

**When to read:** After README, before diving into code

---

#### [QUICKSTART.md](QUICKSTART.md)
**Purpose:** Get running fast  
**Contents:**
- Prerequisites checklist
- Database setup (Supabase)
- Backend setup (5 steps)
- Frontend setup (4 steps)
- Test example
- Troubleshooting common issues
- Next steps

**When to read:** When you want to run it NOW

---

### Technical Documentation

#### [ARCHITECTURE.md](ARCHITECTURE.md)
**Purpose:** Technical deep dive  
**Contents:**
- System overview diagram
- Component architecture
- Data flow (upload + query)
- Design decisions explained
- Scalability analysis
- Security features
- Monitoring approach
- Future enhancements

**When to read:** To understand technical decisions

---

#### [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
**Purpose:** Code organization  
**Contents:**
- Complete file tree
- File descriptions (all 40+ files)
- Code organization principles
- Development workflow
- File size summary
- Dependencies list
- Build outputs

**When to read:** To navigate the codebase

---

#### [SYSTEM_DIAGRAM.txt](SYSTEM_DIAGRAM.txt)
**Purpose:** Visual architecture reference  
**Contents:**
- High-level overview diagram
- Upload flow diagram
- Query flow diagram
- Data flow diagram
- Component architecture
- Database schema
- Technology stack layers
- Deployment architecture
- Security architecture
- Performance characteristics

**When to read:** For visual understanding

---

### Setup & Deployment

#### [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)
**Purpose:** Step-by-step setup guide  
**Contents:**
- Pre-setup checklist
- Database setup (detailed)
- Backend setup (detailed)
- Frontend setup (detailed)
- Integration testing
- Troubleshooting section
- Production deployment
- Maintenance tasks
- Success criteria

**When to read:** For detailed setup instructions

---

#### [DEPLOYMENT.md](DEPLOYMENT.md)
**Purpose:** Production deployment guide  
**Contents:**
- Prerequisites
- Database setup (Supabase)
- Backend deployment (Render)
- Frontend deployment (Vercel)
- Post-deployment verification
- Monitoring setup
- Cost optimization
- Troubleshooting
- Updating deployment
- Security checklist
- Scaling considerations
- Backup strategy

**When to read:** When deploying to production

---

### Reference Documentation

#### [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
**Purpose:** Complete project overview  
**Contents:**
- What has been built
- Architecture highlights
- Features implemented
- Project structure
- Deployment readiness
- Performance metrics
- Cost breakdown
- Security features
- Documentation quality
- Success criteria
- Deliverables summary

**When to read:** For complete project understanding

---

#### [FILE_TREE.txt](FILE_TREE.txt)
**Purpose:** Visual file structure  
**Contents:**
- Complete file tree with icons
- File purposes
- Statistics (lines, files)
- Technology stack
- RAG pipeline overview
- Key features list
- Setup requirements
- Quick start commands
- Performance metrics
- Documentation guide

**When to read:** For quick reference

---

#### [INDEX.md](INDEX.md)
**Purpose:** Documentation navigation (this file)  
**Contents:**
- Quick navigation guides
- Complete documentation list
- File descriptions
- When to read each file
- Quick reference sections

**When to read:** To find what you need

---

## 🔍 Quick Reference

### Configuration

#### Chunk Size
**File:** `backend/chunking.py`  
**Default:** 1000 tokens, 150 overlap  
**Change:**
```python
chunker = TextChunker(chunk_size=1000, overlap=150)
```

#### Retrieval Count
**Files:** `backend/retriever.py`, `backend/reranker.py`  
**Default:** Top-10 → Top-5  
**Change:**
```python
retriever = Retriever(top_k=10)
reranker = Reranker(top_n=5)
```

#### LLM Model
**File:** `backend/answering.py`  
**Default:** GPT-4o  
**Change:**
```python
self.model = "gpt-4o"  # or "gpt-3.5-turbo"
```

### API Endpoints

#### POST /upload
**Purpose:** Upload and process documents  
**Request:**
```json
{
  "content": "text",
  "title": "optional",
  "source": "optional"
}
```
**Response:**
```json
{
  "status": "success",
  "chunks_created": 15,
  "processing_time": 2.3
}
```

#### POST /ask
**Purpose:** Ask questions  
**Request:**
```json
{
  "question": "What is X?"
}
```
**Response:**
```json
{
  "answer": "Answer with [1][2] citations",
  "citations": [...],
  "processing_time": 1.8,
  "tokens_used": 450
}
```

### Environment Variables

#### Backend (.env)
```
OPENAI_API_KEY=sk-...
COHERE_API_KEY=...
SUPABASE_DB_URL=postgresql://...
```

#### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

### Common Commands

#### Backend
```bash
# Setup
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Initialize DB
python setup_db.py

# Run
uvicorn main:app --reload
```

#### Frontend
```bash
# Setup
cd frontend
npm install

# Run
npm run dev

# Build
npm run build
```

### Troubleshooting

#### Backend won't start
1. Check Python version: `python --version` (need 3.9+)
2. Verify virtual environment activated
3. Check .env file exists with all keys
4. Test database connection

#### Frontend won't start
1. Check Node version: `node --version` (need 18+)
2. Delete node_modules: `rm -rf node_modules && npm install`
3. Check .env file exists
4. Verify VITE_API_URL correct

#### Can't connect to backend
1. Ensure backend running on port 8000
2. Check CORS settings in main.py
3. Verify API_URL in frontend .env
4. Test: http://localhost:8000/health

#### Database errors
1. Confirm pgvector extension enabled
2. Check connection string format
3. Verify Supabase project active
4. Test connection in Supabase dashboard

## 📖 Reading Paths

### Path 1: Quick Setup (30 minutes)
1. README.md (overview)
2. QUICKSTART.md (setup)
3. Test the app
4. Done!

### Path 2: Full Understanding (2 hours)
1. README.md (overview)
2. GETTING_STARTED.md (introduction)
3. ARCHITECTURE.md (technical details)
4. PROJECT_STRUCTURE.md (code organization)
5. QUICKSTART.md (setup)
6. Test and customize

### Path 3: Production Deployment (3 hours)
1. README.md (overview)
2. SETUP_CHECKLIST.md (local setup)
3. Test locally
4. DEPLOYMENT.md (production)
5. Deploy and verify
6. Setup monitoring

### Path 4: Code Contribution (4 hours)
1. README.md (overview)
2. ARCHITECTURE.md (technical details)
3. PROJECT_STRUCTURE.md (code organization)
4. SYSTEM_DIAGRAM.txt (visual reference)
5. Setup locally
6. Make changes
7. Test thoroughly

## 🎯 By Role

### End User
**Goal:** Use the application  
**Read:**
1. GETTING_STARTED.md
2. FAQ section in GETTING_STARTED.md
3. Best practices section

### Developer
**Goal:** Understand and modify code  
**Read:**
1. README.md
2. ARCHITECTURE.md
3. PROJECT_STRUCTURE.md
4. SYSTEM_DIAGRAM.txt

### DevOps Engineer
**Goal:** Deploy and maintain  
**Read:**
1. README.md
2. DEPLOYMENT.md
3. Monitoring section in DEPLOYMENT.md
4. Security checklist

### Project Manager
**Goal:** Understand scope and capabilities  
**Read:**
1. README.md
2. PROJECT_SUMMARY.md
3. Performance metrics
4. Cost breakdown

## 📊 Documentation Statistics

- **Total Files:** 11 documentation files
- **Total Words:** ~20,000 words
- **Total Pages:** ~80 pages (printed)
- **Coverage:** Complete (setup, usage, deployment, architecture)
- **Diagrams:** 5+ visual diagrams
- **Code Examples:** 50+ code snippets

## 🔗 External Resources

### APIs & Services
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Cohere Rerank Docs](https://docs.cohere.com/docs/reranking)
- [Supabase Vector Guide](https://supabase.com/docs/guides/ai/vector-columns)

### Frameworks
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide)

### Deployment
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)

## 💡 Tips

### For First-Time Users
- Start with GETTING_STARTED.md
- Don't skip the prerequisites
- Test with simple examples first
- Read FAQ before asking questions

### For Developers
- Read ARCHITECTURE.md before coding
- Follow the code organization in PROJECT_STRUCTURE.md
- Use SYSTEM_DIAGRAM.txt as reference
- Check existing code before adding features

### For Deployment
- Test locally first
- Follow DEPLOYMENT.md exactly
- Keep environment variables secure
- Monitor logs after deployment

## 🆘 Getting Help

1. **Check documentation** - Most answers are here
2. **Review troubleshooting sections** - Common issues covered
3. **Check logs** - Backend terminal and browser console
4. **Search GitHub issues** - Someone may have had same problem
5. **Open new issue** - Provide error messages and steps

## 📝 Documentation Maintenance

### Keeping Docs Updated
- Update when code changes
- Add new sections as needed
- Keep examples current
- Test all commands
- Update version numbers

### Contributing to Docs
- Follow existing format
- Be clear and concise
- Add examples
- Update INDEX.md
- Test all links

---

**Need something specific?** Use Ctrl+F to search this index, or check the table of contents in individual files.

**Still can't find it?** Check PROJECT_SUMMARY.md for a complete overview, or open a GitHub issue.

Happy building! 🚀
