# 🚀 RAG System Quick Start Guide

Get your complete RAG (Retrieval-Augmented Generation) system running in minutes!

## 📋 Prerequisites

- **Node.js 18+** 
- **Supabase account** (free tier works)
- **OpenAI API key** 
- **Cohere API key** (optional, for reranking)

## ⚡ Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
# Run the setup script
npm run setup

# This creates .env file from template
# Edit .env with your API keys:
```

### 3. Configure Your API Keys
Edit `.env` file:
```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=sk-your_openai_key

# Optional (for reranking)
COHERE_API_KEY=your_cohere_key

# Optional
PORT=3000
NODE_ENV=development
```

### 4. Setup Supabase Database
1. Go to your Supabase project → SQL Editor
2. Copy and paste the contents of `supabase_rag_schema.sql`
3. Run the SQL to create tables and functions

### 5. Start the Server
```bash
npm run dev
```

✅ **That's it!** Your RAG system is now running at `http://localhost:3000`

## 🧪 Test Your Setup

### Quick Health Check
```bash
curl http://localhost:3000/health
```

### Process Your First Document
```bash
curl -X POST http://localhost:3000/api/documents/process \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed.",
    "metadata": {
      "source": "test_document.txt",
      "title": "ML Introduction"
    }
  }'
```

### Ask Your First Question
```bash
curl -X POST http://localhost:3000/api/answers/complete-rag \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is machine learning?",
    "rerankTopN": 3
  }'
```

## 🎯 What You Get

Your RAG system includes:

- ✅ **Document Processing**: Smart text chunking with overlap
- ✅ **Vector Search**: Similarity-based retrieval  
- ✅ **MMR Diversification**: Reduces redundant results
- ✅ **Reranking**: Cohere-powered relevance refinement
- ✅ **LLM Answering**: GPT-4 with inline citations
- ✅ **Source Attribution**: Complete source snippets
- ✅ **No-Answer Handling**: Graceful "I don't know" responses

## 📚 Next Steps

1. **Add Your Documents**: Use `/api/documents/process` to add content
2. **Try Examples**: Run `npm run examples:answers` for demos
3. **Read Docs**: Check `docs/` folder for detailed guides
4. **Customize**: Adjust parameters in API calls

## 🔧 Common Issues

### "Database connection failed"
- Check your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Ensure you've run the SQL schema in Supabase

### "OpenAI connection failed"  
- Verify your `OPENAI_API_KEY` is correct
- Check you have API credits available

### "Cohere connection failed"
- This is optional - reranking will be disabled
- Add `COHERE_API_KEY` to enable reranking features

### Port already in use
- Change `PORT=3001` in `.env` file
- Or kill the process using port 3000

## 🆘 Need Help?

- Check the `README.md` for detailed documentation
- Run `npm run examples` to see working examples
- Review `docs/` folder for in-depth guides
- Ensure all environment variables are set correctly

---

**🎉 Congratulations!** You now have a production-ready RAG system with advanced features like MMR, reranking, and citation-backed answers!