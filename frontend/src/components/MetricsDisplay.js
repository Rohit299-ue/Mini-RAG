import React from 'react';

function MetricsDisplay({ metadata, processingTime }) {
  if (!metadata) return null;

  // Extract metrics from metadata
  const {
    chunksProvided = 0,
    chunksUsed = 0,
    confidence = 0,
    responseType = 'unknown',
    retrievalMetadata = {},
    rerankMetadata = {},
    hasAnswer = false
  } = metadata;

  // Calculate derived metrics
  const chunkUtilization = chunksProvided > 0 ? (chunksUsed / chunksProvided) * 100 : 0;
  const avgSimilarity = retrievalMetadata.avgSimilarity || 0;
  const diversityScore = retrievalMetadata.diversityScore || 0;
  const avgRerankScore = rerankMetadata?.stats?.avgRerankScore || 0;
  const reorderingRate = rerankMetadata?.stats?.reorderingRate || 0;

  // Estimate token usage (rough approximation)
  const estimatedTokens = Math.round((chunksUsed * 200) + (processingTime / 10));
  const estimatedCost = (estimatedTokens / 1000) * 0.002; // Rough GPT-4 pricing

  const metrics = [
    {
      label: 'Processing Time',
      value: processingTime ? `${processingTime}ms` : 'N/A',
      description: 'Total time to process query'
    },
    {
      label: 'Confidence',
      value: `${(confidence * 100).toFixed(1)}%`,
      description: 'System confidence in answer quality'
    },
    {
      label: 'Chunks Used',
      value: `${chunksUsed}/${chunksProvided}`,
      description: 'Document chunks used for answer'
    },
    {
      label: 'Utilization',
      value: `${chunkUtilization.toFixed(1)}%`,
      description: 'Percentage of retrieved chunks used'
    },
    {
      label: 'Avg Similarity',
      value: avgSimilarity ? `${(avgSimilarity * 100).toFixed(1)}%` : 'N/A',
      description: 'Average similarity score of retrieved chunks'
    },
    {
      label: 'Diversity Score',
      value: diversityScore ? `${(diversityScore * 100).toFixed(1)}%` : 'N/A',
      description: 'Diversity of retrieved content (MMR)'
    },
    {
      label: 'Rerank Score',
      value: avgRerankScore ? `${(avgRerankScore * 100).toFixed(1)}%` : 'N/A',
      description: 'Average reranking relevance score'
    },
    {
      label: 'Reordering Rate',
      value: reorderingRate ? `${(reorderingRate * 100).toFixed(1)}%` : 'N/A',
      description: 'How much reranking changed order'
    },
    {
      label: 'Est. Tokens',
      value: estimatedTokens.toLocaleString(),
      description: 'Estimated token usage'
    },
    {
      label: 'Est. Cost',
      value: `$${estimatedCost.toFixed(4)}`,
      description: 'Estimated API cost'
    }
  ];

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>📊 Performance Metrics</h3>
      
      {/* Status Overview */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          background: hasAnswer ? '#d4edda' : '#f8d7da',
          color: hasAnswer ? '#155724' : '#721c24',
          border: `1px solid ${hasAnswer ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {hasAnswer ? '✅ Answer Generated' : '❌ No Answer'}
        </div>
        
        <div style={{
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          background: '#e2e3e5',
          color: '#383d41',
          border: '1px solid #d6d8db'
        }}>
          Type: {responseType.replace('_', ' ')}
        </div>
        
        {confidence > 0.8 && (
          <div style={{
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            background: '#d1ecf1',
            color: '#0c5460',
            border: '1px solid #bee5eb'
          }}>
            🎯 High Confidence
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="metrics">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-item" title={metric.description}>
            <span className="metric-value">{metric.value}</span>
            <span className="metric-label">{metric.label}</span>
          </div>
        ))}
      </div>

      {/* Pipeline Breakdown */}
      {retrievalMetadata.totalCandidates && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#f8f9fa', 
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ marginBottom: '10px', color: '#495057', fontSize: '14px' }}>
            🔄 Pipeline Breakdown
          </h4>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            fontSize: '12px',
            color: '#6c757d'
          }}>
            <div style={{ 
              padding: '4px 8px', 
              background: '#e9ecef', 
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              {retrievalMetadata.totalCandidates} Initial
            </div>
            
            <span>→</span>
            
            <div style={{ 
              padding: '4px 8px', 
              background: '#d1ecf1', 
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              {retrievalMetadata.mmrResults || retrievalMetadata.finalResults} MMR
            </div>
            
            {rerankMetadata?.finalResults && (
              <>
                <span>→</span>
                <div style={{ 
                  padding: '4px 8px', 
                  background: '#d4edda', 
                  borderRadius: '4px',
                  fontWeight: '600'
                }}>
                  {rerankMetadata.finalResults} Reranked
                </div>
              </>
            )}
            
            <span>→</span>
            
            <div style={{ 
              padding: '4px 8px', 
              background: '#fff3cd', 
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              {chunksUsed} Used
            </div>
          </div>
        </div>
      )}

      {/* Technical Details */}
      <details style={{ marginTop: '15px' }}>
        <summary style={{ 
          cursor: 'pointer', 
          fontSize: '12px', 
          color: '#6c757d',
          fontWeight: '600'
        }}>
          🔧 Technical Details
        </summary>
        <pre style={{ 
          marginTop: '10px', 
          padding: '10px', 
          background: '#f8f9fa', 
          borderRadius: '4px',
          fontSize: '10px',
          overflow: 'auto',
          border: '1px solid #e9ecef'
        }}>
          {JSON.stringify({
            metadata,
            processingTime,
            timestamp: new Date().toISOString()
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default MetricsDisplay;