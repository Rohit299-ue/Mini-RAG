import { useState } from 'react'
import axios from 'axios'
import './UploadPanel.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function UploadPanel({ setUploadStatus, setLoading }) {
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState(null)

  const handleUpload = async () => {
    if (!content.trim()) {
      setError('Please enter some content')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/upload`, {
        content: content.trim(),
        title: title.trim() || 'Untitled Document',
        source: source.trim() || 'Manual Input'
      })

      setUploadStatus(response.data)
      setContent('')
      setTitle('')
      setSource('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upload-panel">
      <h2>📄 Upload Document</h2>
      
      <div className="form-group">
        <label>Document Title (optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Product Documentation"
          className="input-field"
        />
      </div>

      <div className="form-group">
        <label>Source (optional)</label>
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g., manual.pdf"
          className="input-field"
        />
      </div>

      <div className="form-group">
        <label>Document Content *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your document text here..."
          className="textarea-field"
          rows={12}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button onClick={handleUpload} className="btn btn-primary">
        Upload & Process
      </button>
    </div>
  )
}

export default UploadPanel
