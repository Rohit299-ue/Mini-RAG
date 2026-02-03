import './AnswerDisplay.css'

function AnswerDisplay({ answer }) {
  if (!answer) return null

  return (
    <div className="answer-display">
      <h2>💡 Answer</h2>
      
      <div className="answer-content">
        <p>{answer.answer}</p>
      </div>

      <div className="metadata">
        <span className="meta-item">
          ⏱️ {answer.processing_time}s
        </span>
        <span className="meta-item">
          🎯 {answer.tokens_used} tokens
        </span>
      </div>

      {answer.citations && answer.citations.length > 0 && (
        <div className="citations">
          <h3>📚 Sources</h3>
          {answer.citations.map((citation) => (
            <div key={citation.id} className="citation-card">
              <div className="citation-header">
                <span className="citation-number">[{citation.id}]</span>
                <span className="citation-source">
                  {citation.title || citation.source}
                </span>
              </div>
              <p className="citation-text">{citation.text}</p>
              <div className="citation-scores">
                {citation.similarity && (
                  <span className="score">
                    Similarity: {(citation.similarity * 100).toFixed(1)}%
                  </span>
                )}
                {citation.rerank_score && (
                  <span className="score">
                    Relevance: {(citation.rerank_score * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AnswerDisplay
