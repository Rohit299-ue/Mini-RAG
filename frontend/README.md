# RAG Frontend

React frontend for the RAG (Retrieval-Augmented Generation) system.

## Features

- 📄 **Text Upload**: Paste text or upload files (.txt, .md, .csv)
- ❓ **Query Interface**: Ask questions with advanced options
- 🤖 **Answer Display**: LLM-generated answers with inline citations
- 📚 **Expandable Citations**: Click to view source content
- 📊 **Performance Metrics**: Request timing and token estimates
- 📱 **Responsive Design**: Works on desktop and mobile

## Quick Start

### Prerequisites
- Node.js 16+
- RAG Backend running on `http://localhost:3000`

### Installation
```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3001`

## Usage

### 1. Upload Documents
- Paste text directly into the text area
- Or drag & drop text files (.txt, .md, .csv)
- Add an optional title
- Click "Process Document"

### 2. Ask Questions
- Enter your question in the query box
- Try example questions for inspiration
- Adjust advanced options if needed
- Click "Get Answer"

### 3. View Results
- Read the generated answer with inline citations
- Click citation numbers [1], [2] to jump to sources
- Expand citations to see full source text
- View performance metrics and timing

## Components

### TextUpload
- File drag & drop support
- Text paste area
- Document title input
- Processing status
- Document list with chunk counts

### QueryInput
- Question input with examples
- Advanced parameter controls
- Processing status
- Character/word count

### AnswerDisplay
- Formatted answer text
- Clickable inline citations
- Confidence and type indicators
- Clear/metrics toggle

### CitationList
- Expandable source citations
- Source metadata display
- Similarity and rerank scores
- Expand/collapse all controls

### MetricsDisplay
- Processing time and performance
- Token usage estimates
- Cost calculations
- Pipeline breakdown
- Technical details

## Configuration

### API Base URL
Set the backend URL in `.env`:
```env
REACT_APP_API_BASE=http://localhost:3000/api
```

### Advanced Query Options
- **Top K**: Number of initial candidates (10-100)
- **Final K**: Results after MMR (5-20)
- **Rerank Top N**: Final reranked results (3-10)
- **Lambda**: MMR diversity balance (0-1)
- **Threshold**: Similarity threshold (0-1)
- **Temperature**: LLM creativity (0-1)

## Styling

Uses minimal CSS with:
- Clean, modern design
- Responsive grid layout
- Accessible color scheme
- Smooth animations
- Mobile-friendly interface

## API Integration

Communicates with RAG backend via:
- `POST /api/documents/process` - Upload documents
- `POST /api/answers/complete-rag` - Get answers
- `GET /api/health` - Health check

## Development

### File Structure
```
src/
├── components/          # React components
│   ├── TextUpload.js   # Document upload
│   ├── QueryInput.js   # Question interface
│   ├── AnswerDisplay.js # Answer with citations
│   ├── CitationList.js # Expandable sources
│   ├── MetricsDisplay.js # Performance metrics
│   └── StatusMessage.js # Status notifications
├── services/
│   └── api.js          # Backend API calls
├── App.js              # Main application
├── index.js            # React entry point
└── index.css           # Minimal styling
```

### Available Scripts
- `npm start` - Development server
- `npm build` - Production build
- `npm test` - Run tests

### Customization
- Modify `src/index.css` for styling
- Update `src/services/api.js` for API changes
- Add new components in `src/components/`

## Production Build

```bash
npm run build
```

Builds optimized production files in `build/` directory.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Backend Connection Issues
- Ensure RAG backend is running on port 3000
- Check CORS configuration
- Verify API endpoints are accessible

### File Upload Problems
- Check file size limits
- Ensure supported file types (.txt, .md, .csv)
- Verify file encoding (UTF-8 recommended)

### Performance Issues
- Reduce document size for faster processing
- Lower Top K values for quicker queries
- Use shorter questions for better results