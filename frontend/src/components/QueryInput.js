import React, { useState, useCallback } from 'react';

function QueryInput({ onQuery, isQuerying, hasDocuments }) {
  const [query, setQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState({
    topK: 30,
    finalK: 10,
    rerankTopN: 5,
    lambda: 0.7,
    threshold: 0.3,
    temperature: 0.1,
    maxTokens: 1000
  });

  // Handle query change
  const handleQueryChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  // Handle option change
  const handleOptionChange = useCallback((key, value) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      alert('Please enter a question to search for answers.');
      return;
    }

    onQuery(query, options);
  }, [query, options, onQuery]);

  // Handle example queries
  const handleExampleQuery = useCallback((exampleQuery) => {
    setQuery(exampleQuery);
  }, []);

  // Clear query
  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  const exampleQueries = [
    "What is the main topic discussed in the document?",
    "Can you summarize the key points?",
    "What are the most important findings?",
    "How does this relate to machine learning?",
    "What conclusions can be drawn?"
  ];

  return (
    <div className="panel">
      <h2>❓ Ask a Question</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="query">Your Question</label>
          <textarea
            id="query"
            className="textarea"
            value={query}
            onChange={handleQueryChange}
            placeholder="Ask a question about your documents..."
            disabled={isQuerying}
            rows={4}
          />
        </div>

        {/* Example Queries */}
        {!hasDocuments && (
          <div style={{ marginBottom: '15px', padding: '10px', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
            <small style={{ color: '#856404' }}>
              💡 Upload some documents first to get started with questions!
            </small>
          </div>
        )}

        {hasDocuments && (
          <div style={{ marginBottom: '15px' }}>
            <small style={{ color: '#6c757d', display: 'block', marginBottom: '8px' }}>
              💡 Try these example questions:
            </small>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {exampleQueries.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleExampleQuery(example)}
                  disabled={isQuerying}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    background: '#e9ecef',
                    border: '1px solid #dee2e6',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    color: '#495057'
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Options */}
        <div style={{ marginBottom: '15px' }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: 'none',
              border: 'none',
              color: '#3498db',
              cursor: 'pointer',
              fontSize: '12px',
              textDecoration: 'underline'
            }}
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </button>
        </div>

        {showAdvanced && (
          <div style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '6px', 
            marginBottom: '15px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6c757d' }}>Top K Candidates</label>
                <input
                  type="number"
                  value={options.topK}
                  onChange={(e) => handleOptionChange('topK', parseInt(e.target.value))}
                  min="10"
                  max="100"
                  style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#6c757d' }}>Final K Results</label>
                <input
                  type="number"
                  value={options.finalK}
                  onChange={(e) => handleOptionChange('finalK', parseInt(e.target.value))}
                  min="5"
                  max="20"
                  style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#6c757d' }}>Rerank Top N</label>
                <input
                  type="number"
                  value={options.rerankTopN}
                  onChange={(e) => handleOptionChange('rerankTopN', parseInt(e.target.value))}
                  min="3"
                  max="10"
                  style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#6c757d' }}>Lambda (Diversity)</label>
                <input
                  type="number"
                  value={options.lambda}
                  onChange={(e) => handleOptionChange('lambda', parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                  style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#6c757d' }}>Threshold</label>
                <input
                  type="number"
                  value={options.threshold}
                  onChange={(e) => handleOptionChange('threshold', parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                  style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#6c757d' }}>Temperature</label>
                <input
                  type="number"
                  value={options.temperature}
                  onChange={(e) => handleOptionChange('temperature', parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                  style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="btn-group">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isQuerying || !query.trim() || !hasDocuments}
          >
            {isQuerying ? (
              <>
                <span className="spinner"></span>
                Searching...
              </>
            ) : (
              '🔍 Get Answer'
            )}
          </button>
          
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handleClear}
            disabled={isQuerying}
          >
            🗑️ Clear
          </button>
        </div>
      </form>

      {/* Query Stats */}
      {query && (
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#6c757d' }}>
          📊 {query.length} characters • {query.split(/\s+/).filter(word => word.length > 0).length} words
        </div>
      )}
    </div>
  );
}

export default QueryInput;