import { useState } from 'react'
import axios from 'axios'
import './QuestionPanel.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function QuestionPanel({ setAnswer, setLoading, loading }) {
  const [question, setQuestion] = useState('')
  const [error, setError] = useState(null)

  const handleAsk = async () => {
    if (!question.trim()) {
      setError('Please enter a question')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/ask`, {
        question: question.trim()
      })

      setAnswer(response.data)
      setQuestion('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get answer')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div className="question-panel">
      <h2>❓ Ask a Question</h2>
      
      <div className="form-group">
        <label>Your Question</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="What would you like to know about the uploaded documents?"
          className="textarea-field"
          rows={4}
          disabled={loading}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button 
        onClick={handleAsk} 
        className="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Ask Question'}
      </button>

      <div className="tips">
        <p><strong>Tips:</strong></p>
        <ul>
          <li>Be specific in your questions</li>
          <li>Upload documents first before asking</li>
          <li>Press Enter to submit (Shift+Enter for new line)</li>
        </ul>
      </div>
    </div>
  )
}

export default QuestionPanel
