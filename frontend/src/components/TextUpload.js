import React, { useState, useCallback, useRef } from 'react';

function TextUpload({ onProcess, isProcessing, documents }) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Handle text change
  const handleTextChange = useCallback((e) => {
    setText(e.target.value);
  }, []);

  // Handle title change
  const handleTitleChange = useCallback((e) => {
    setTitle(e.target.value);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      alert('Please enter some text to process.');
      return;
    }

    const metadata = {
      title: title.trim() || 'Untitled Document',
      source: `${title.trim() || 'document'}_${Date.now()}.txt`,
      uploadedAt: new Date().toISOString()
    };

    onProcess(text, metadata);
  }, [text, title, onProcess]);

  // Handle file upload
  const handleFileUpload = useCallback((file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setText(content);
      setTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove file extension
    };
    reader.readAsText(file);
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Clear form
  const handleClear = useCallback(() => {
    setText('');
    setTitle('');
  }, []);

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="panel">
      <h2>📄 Document Upload</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Document Title</label>
          <input
            id="title"
            type="text"
            className="input"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter document title (optional)"
            disabled={isProcessing}
          />
        </div>

        <div className="form-group">
          <label>Text Content</label>
          
          {/* File Upload Area */}
          <div 
            className={`file-upload ${isDragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv"
              onChange={handleFileInputChange}
              disabled={isProcessing}
            />
            <div className="file-upload-text">
              📁 Click to upload or drag & drop a text file<br />
              <small>Supports .txt, .md, .csv files</small>
            </div>
          </div>

          <textarea
            className="textarea"
            value={text}
            onChange={handleTextChange}
            placeholder="Or paste your text content here..."
            disabled={isProcessing}
            rows={8}
          />
        </div>

        <div className="btn-group">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isProcessing || !text.trim()}
          >
            {isProcessing ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              '🚀 Process Document'
            )}
          </button>
          
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handleClear}
            disabled={isProcessing}
          >
            🗑️ Clear
          </button>
        </div>
      </form>

      {/* Document List */}
      {documents.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>📚 Processed Documents ({documents.length})</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '10px' }}>
            {documents.map((doc, index) => (
              <div 
                key={doc.id || index}
                style={{
                  padding: '10px',
                  margin: '5px 0',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}
              >
                <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                  {doc.title}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {doc.chunks} chunks • {new Date(doc.processedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Character/Word Count */}
      {text && (
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#6c757d' }}>
          📊 {text.length} characters • {text.split(/\s+/).filter(word => word.length > 0).length} words
        </div>
      )}
    </div>
  );
}

export default TextUpload;