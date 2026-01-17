import React, { useState, useCallback } from 'react';

function CitationList({ citations, sources }) {
  const [expandedCitations, setExpandedCitations] = useState(new Set());

  // Toggle citation expansion
  const toggleCitation = useCallback((citationNumber) => {
    setExpandedCitations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(citationNumber)) {
        newSet.delete(citationNumber);
      } else {
        newSet.add(citationNumber);
      }
      return newSet;
    });
  }, []);

  // Expand all citations
  const expandAll = useCallback(() => {
    const allNumbers = citations.map(c => c.number);
    setExpandedCitations(new Set(allNumbers));
  }, [citations]);

  // Collapse all citations
  const collapseAll = useCallback(() => {
    setExpandedCitations(new Set());
  }, []);

  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className="citations">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3>📚 Sources & Citations ({citations.length})</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={expandAll}
            style={{
              background: 'none',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              color: '#6c757d'
            }}
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            style={{
              background: 'none',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              color: '#6c757d'
            }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {citations.map((citation) => {
        const isExpanded = expandedCitations.has(citation.number);
        const source = sources?.find(s => s.citation === `[${citation.number}]`);
        
        return (
          <div 
            key={citation.number} 
            className="citation-item"
            id={`citation-${citation.number}`}
          >
            <div 
              className="citation-header"
              onClick={() => toggleCitation(citation.number)}
            >
              <div className="citation-info">
                <div>
                  <span className="citation-number">[{citation.number}]</span>
                  <span className="citation-title">
                    {citation.title || source?.title || 'Untitled'}
                  </span>
                </div>
                <div className="citation-source">
                  {citation.source || source?.source || 'Unknown source'}
                  {citation.section && ` • ${citation.section}`}
                </div>
              </div>
              <div className="citation-toggle">
                {isExpanded ? '▼ Hide' : '▶ Show'}
              </div>
            </div>

            {isExpanded && (
              <div className="citation-content">
                {/* Main content */}
                <div>
                  {source?.snippet || citation.content || 'No content available'}
                </div>

                {/* Metadata */}
                <div className="citation-meta">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                    {citation.similarity && (
                      <div>
                        <strong>Similarity:</strong> {(citation.similarity * 100).toFixed(1)}%
                      </div>
                    )}
                    {(citation.rerankScore || source?.rerankScore) && (
                      <div>
                        <strong>Rerank Score:</strong> {((citation.rerankScore || source.rerankScore) * 100).toFixed(1)}%
                      </div>
                    )}
                    {citation.position !== undefined && (
                      <div>
                        <strong>Position:</strong> {citation.position}
                      </div>
                    )}
                    {citation.section && (
                      <div>
                        <strong>Section:</strong> {citation.section}
                      </div>
                    )}
                  </div>

                  {/* Additional metadata if available */}
                  {citation.metadata && (
                    <div style={{ marginTop: '10px', fontSize: '11px' }}>
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#6c757d' }}>
                          Technical Details
                        </summary>
                        <pre style={{ 
                          marginTop: '5px', 
                          padding: '8px', 
                          background: '#f8f9fa', 
                          borderRadius: '3px',
                          fontSize: '10px',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(citation.metadata, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Citation Summary */}
      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        background: '#f8f9fa', 
        borderRadius: '6px',
        fontSize: '12px',
        color: '#6c757d'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span>
            📊 <strong>{citations.length}</strong> sources cited
          </span>
          <span>
            🎯 Avg similarity: <strong>
              {citations.length > 0 
                ? (citations.reduce((sum, c) => sum + (c.similarity || 0), 0) / citations.length * 100).toFixed(1)
                : 0}%
            </strong>
          </span>
          <span>
            📚 Unique sources: <strong>
              {new Set(citations.map(c => c.source)).size}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export default CitationList;