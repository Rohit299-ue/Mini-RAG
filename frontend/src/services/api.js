// API service for communicating with the RAG backend

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

// Helper function for making API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// Process a document (upload text and create embeddings)
export async function processDocument(text, metadata = {}) {
  const startTime = Date.now();
  
  try {
    const result = await apiRequest('/documents/process', {
      method: 'POST',
      body: JSON.stringify({
        text,
        metadata: {
          source: metadata.source || `document_${Date.now()}.txt`,
          title: metadata.title || 'Untitled Document',
          author: metadata.author || 'Unknown',
          ...metadata
        }
      })
    });
    
    // Add timing information
    result.processingTime = Date.now() - startTime;
    
    return result;
  } catch (error) {
    throw new Error(`Document processing failed: ${error.message}`);
  }
}

// Query the RAG system for an answer
export async function queryRAG(query, options = {}) {
  const startTime = Date.now();
  
  const {
    topK = 30,
    finalK = 10,
    rerankTopN = 5,
    lambda = 0.7,
    threshold = 0.3,
    model = 'gpt-4-turbo-preview',
    maxTokens = 1000,
    temperature = 0.1,
    strictCitations = true,
    source = null,
    section = null
  } = options;

  try {
    const result = await apiRequest('/answers/complete-rag', {
      method: 'POST',
      body: JSON.stringify({
        query,
        topK,
        finalK,
        rerankTopN,
        lambda,
        threshold,
        source,
        section,
        model,
        maxTokens,
        temperature,
        strictCitations
      })
    });
    
    // Add timing information
    result.processingTime = Date.now() - startTime;
    
    return result;
  } catch (error) {
    throw new Error(`Query failed: ${error.message}`);
  }
}

// Get system health status
export async function getHealthStatus() {
  try {
    return await apiRequest('/health');
  } catch (error) {
    throw new Error(`Health check failed: ${error.message}`);
  }
}

// Get document statistics
export async function getDocumentStats() {
  try {
    return await apiRequest('/documents/stats');
  } catch (error) {
    throw new Error(`Failed to get document stats: ${error.message}`);
  }
}

// Estimate processing cost
export async function estimateProcessingCost(text) {
  try {
    return await apiRequest('/documents/estimate-cost', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  } catch (error) {
    throw new Error(`Cost estimation failed: ${error.message}`);
  }
}

// Delete documents by source
export async function deleteDocumentsBySource(source) {
  try {
    return await apiRequest(`/documents/source/${encodeURIComponent(source)}`, {
      method: 'DELETE'
    });
  } catch (error) {
    throw new Error(`Failed to delete documents: ${error.message}`);
  }
}

// Get documents by source
export async function getDocumentsBySource(source) {
  try {
    return await apiRequest(`/documents/source/${encodeURIComponent(source)}`);
  } catch (error) {
    throw new Error(`Failed to get documents: ${error.message}`);
  }
}