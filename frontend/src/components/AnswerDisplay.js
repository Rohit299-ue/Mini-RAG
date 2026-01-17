import React, { useState, useCallback } from 'react';
import CitationList from './CitationList';
import MetricsDisplay from './MetricsDisplay';

function AnswerDisplay({ answer, isLoading, onClear }) {
  const [showMetrics, setShowMetrics] = useState(false);

  // Toggle metrics display
  const toggleMetrics = useCallback(() => {
    setShowMetrics(prev => !prev);
  }, []);

  if (isLoading) {
    return (
      <div className="panel answer-panel">
        <h2>🤖 Answer</h2>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '40px',
          color: '#6c757d'
        }}>
          <span className="spinner" style={{ marginRight: '10px' }}></span>
          Generating answer with citations...
        </div>
      </div>
    );
  }

  if (!answer) {
    return null;
  }

  const hasAnswer = answer.metadata?.hasAnswer !== false;
  const confidence = answer.metadata?.confidence || 0;
  const responseType = answer.metadata?.responseType || 'unknown';

  return (
    <div className="panel answer-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>🤖 Answer</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={toggleMetrics}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {showMetrics ? '📊 Hide Metrics' : '📊 Show Metrics'}
          </button>
          <button
            onClick={onClear}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Query Display */}
      <div style={{ 
        background: '#e9ecef', 
        padding: '10px 15px', 
        borderRadius: '6px', 
        marginBottom: '15px',
        borderLeft: '4px solid #6c757d'
      }}>
        <strong>Question:</strong> {answer.query}
      </div>

      {/* Answer Content */}
      <div className="answer-content">
        {hasAnswer ? (
          <div>
            {/* Format answer with citation links */}
            <AnswerText text={answer.answer} citations={answer.citations} />
            
            {/* Confidence and Type Indicators */}
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              background: 'rgba(52, 152, 219, 0.1)', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#2c3e50'
            }}>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <span>
                  <strong>Confidence:</strong> {(confidence * 100).toFixed(1)}%
                </span>
                <span>
                  <strong>Type:</strong> {responseType.replace('_', ' ')}
                </span>
                <span>
                  <strong>Citations:</strong> {answer.citations?.length || 0}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-answer">
            {answer.answer || "I don't have enough information to answer this question based on the provided documents."}
          </div>
        )}
      </div>

      {/* Citations */}
      {answer.citations && answer.citations.length > 0 && (
        <CitationList citations={answer.citations} sources={answer.sources} />
      )}

      {/* Metrics */}
      {showMetrics && (
        <MetricsDisplay 
          metadata={answer.metadata}
          processingTime={answer.processingTime}
        />
      )}
    </div>
  );
}

// Component to render answer text with clickable citations
function AnswerText({ text, citations }) {
  if (!text) return null;

  // Replace citation numbers with clickable links
  const parts = text.split(/(\[\d+\])/g);
  
  return (
    <div style={{ fontSize: '16px', lineHeight: '1.7' }}>
      {parts.map((part, index) => {
        const citationMatch = part.match(/\[(\d+)\]/);
        
        if (citationMatch) {
          const citationNumber = parseInt(citationMatch[1]);
          const citation = citations?.find(c => c.number === citationNumber);
          
          return (
            <span
              key={index}
              onClick={() => {
                const element = document.getElementById(`citation-${citationNumber}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                  // Briefly highlight the citation
                  element.style.background = '#fff3cd';
                  setTimeout(() => {
                    element.style.background = '';
                  }, 2000);
                }
              }}
              style={{
                color: '#3498db',
                cursor: 'pointer',
                fontWeight: 'bold',
                textDecoration: 'none',
                padding: '1px 3px',
                borderRadius: '3px',
                background: 'rgba(52, 152, 219, 0.1)',
                border: '1px solid rgba(52, 152, 219, 0.3)',
                fontSize: '14px'
              }}
              title={citation ? `${citation.title} - ${citation.source}` : 'Citation'}
            >
              {part}
            </span>
          );
        }
        
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}

export default AnswerDisplay;