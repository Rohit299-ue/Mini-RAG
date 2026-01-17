import React, { useState, useCallback } from 'react';
import TextUpload from './components/TextUpload';
import QueryInput from './components/QueryInput';
import AnswerDisplay from './components/AnswerDisplay';
import StatusMessage from './components/StatusMessage';
import { processDocument, queryRAG } from './services/api';

function App() {
  const [documents, setDocuments] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Handle document upload/processing
  const handleDocumentProcess = useCallback(async (text, metadata) => {
    setIsProcessing(true);
    setStatusMessage(null);
    
    try {
      const result = await processDocument(text, metadata);
      
      if (result.success) {
        const newDoc = {
          id: result.processing.source,
          title: metadata.title || 'Untitled Document',
          source: result.processing.source,
          chunks: result.processing.totalChunks,
          processedAt: new Date().toISOString()
        };
        
        setDocuments(prev => [...prev, newDoc]);
        setStatusMessage({
          type: 'success',
          message: `Document processed successfully! Created ${result.processing.totalChunks} chunks.`
        });
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Document processing error:', error);
      setStatusMessage({
        type: 'error',
        message: `Failed to process document: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Handle query submission
  const handleQuery = useCallback(async (query, options = {}) => {
    if (!query.trim()) {
      setStatusMessage({
        type: 'warning',
        message: 'Please enter a question to search for answers.'
      });
      return;
    }

    setIsQuerying(true);
    setStatusMessage(null);
    setCurrentAnswer(null);
    
    try {
      const result = await queryRAG(query, options);
      
      if (result.success) {
        setCurrentAnswer(result);
        
        if (!result.metadata.hasAnswer) {
          setStatusMessage({
            type: 'warning',
            message: 'No relevant information found to answer your question.'
          });
        }
      } else {
        throw new Error(result.error || 'Query failed');
      }
    } catch (error) {
      console.error('Query error:', error);
      setStatusMessage({
        type: 'error',
        message: `Failed to process query: ${error.message}`
      });
    } finally {
      setIsQuerying(false);
    }
  }, []);

  // Clear current answer
  const handleClearAnswer = useCallback(() => {
    setCurrentAnswer(null);
    setStatusMessage(null);
  }, []);

  return (
    <div className="container">
      <header className="header">
        <h1>RAG System</h1>
        <p>Retrieval-Augmented Generation with Citations</p>
      </header>

      {statusMessage && (
        <StatusMessage 
          type={statusMessage.type} 
          message={statusMessage.message}
          onClose={() => setStatusMessage(null)}
        />
      )}

      <div className="main-layout">
        <TextUpload 
          onProcess={handleDocumentProcess}
          isProcessing={isProcessing}
          documents={documents}
        />
        
        <QueryInput 
          onQuery={handleQuery}
          isQuerying={isQuerying}
          hasDocuments={documents.length > 0}
        />
      </div>

      {(currentAnswer || isQuerying) && (
        <AnswerDisplay 
          answer={currentAnswer}
          isLoading={isQuerying}
          onClear={handleClearAnswer}
        />
      )}
    </div>
  );
}

export default App;