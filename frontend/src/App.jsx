import { useState } from 'react'
import UploadPanel from './components/UploadPanel'
import QuestionPanel from './components/QuestionPanel'
import AnswerDisplay from './components/AnswerDisplay'
import './App.css'

function App() {
  const [uploadStatus, setUploadStatus] = useState(null)
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧠 Mini RAG</h1>
        <p>Intelligent Document Question Answering</p>
      </header>

      <div className="app-container">
        <div className="left-panel">
          <UploadPanel 
            setUploadStatus={setUploadStatus}
            setLoading={setLoading}
          />
          
          {uploadStatus && (
            <div className="status-message success">
              ✓ {uploadStatus.chunks_created} chunks created in {uploadStatus.processing_time}s
            </div>
          )}
        </div>

        <div className="right-panel">
          <QuestionPanel 
            setAnswer={setAnswer}
            setLoading={setLoading}
            loading={loading}
          />
          
          {answer && <AnswerDisplay answer={answer} />}
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  )
}

export default App
