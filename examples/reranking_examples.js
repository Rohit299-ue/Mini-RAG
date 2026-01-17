/**
 * Reranking Examples - Demonstrates Cohere Rerank integration
 * Shows how reranking improves retrieval quality through cross-attention
 */

const API_BASE = 'http://localhost:3000/api'

// Example 1: Basic Reranking
async function basicReranking() {
  console.log('=== Basic Reranking Example ===')
  
  // Sample chunks (in real scenario, these come from vector retrieval)
  const chunks = [
    {
      id: '1',
      content: 'Machine learning is a subset of artificial intelligence that focuses on algorithms.',
      source: 'ml_textbook.pdf',
      similarity: 0.85
    },
    {
      id: '2', 
      content: 'Deep learning uses neural networks with multiple layers to process data.',
      source: 'dl_guide.pdf',
      similarity: 0.82
    },
    {
      id: '3',
      content: 'Artificial intelligence encompasses machine learning, robotics, and expert systems.',
      source: 'ai_overview.pdf', 
      similarity: 0.80
    },
    {
      id: '4',
      content: 'Natural language processing helps computers understand human language.',
      source: 'nlp_basics.pdf',
      similarity: 0.78
    },
    {
      id: '5',
      content: 'Computer vision enables machines to interpret and analyze visual information.',
      source: 'cv_intro.pdf',
      similarity: 0.75
    }
  ]

  const response = await fetch(`${API_BASE}/reranking/rerank`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What is the relationship between AI and machine learning?',
      chunks: chunks,
      topN: 3
    })
  })

  const result = await response.json()
  
  console.log(`Original chunks: ${result.originalCount}`)
  console.log(`Reranked results: ${result.rerankedCount}`)
  console.log(`Average rerank score: ${result.metadata.stats.avgRerankScore.toFixed(3)}`)
  
  console.log('\nReranked Results:')
  result.results.forEach((chunk, i) => {
    console.log(`${i + 1}. [Rerank: ${chunk.rerankScore.toFixed(3)}, Original: ${chunk.similarity.toFixed(3)}]`)
    console.log(`   Rank change: ${chunk.rankImprovement > 0 ? '+' : ''}${chunk.rankImprovement}`)
    console.log(`   ${chunk.content.substring(0, 80)}...`)
    console.log()
  })

  return result
}

// Example 2: Complete Retrieval + Reranking Pipeline
async function completeRetrievalPipeline() {
  console.log('=== Complete Retrieval + Reranking Pipeline ===')
  
  const response = await fetch(`${API_BASE}/reranking/retrieve-and-rerank`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'How do neural networks learn from data?',
      topK: 50,        // Initial candidates
      finalK: 15,      // After MMR
      rerankTopN: 5,   // Final reranked results
      lambda: 0.7,     // MMR balance
      threshold: 0.3   // Similarity threshold
    })
  })

  const result = await response.json()
  
  console.log('Pipeline Results:')
  console.log(`  Initial candidates: ${result.metadata.totalCandidates}`)
  console.log(`  After MMR: ${result.metadata.mmrResults}`)
  console.log(`  Final reranked: ${result.metadata.finalResults}`)
  console.log(`  Avg rerank score: ${result.metadata.avgRerankScore.toFixed(3)}`)
  console.log(`  Reordering rate: ${(result.metadata.reorderingRate * 100).toFixed(1)}%`)
  
  console.log('\nTop Results:')
  result.results.slice(0, 3).forEach((chunk, i) => {
    console.log(`${i + 1}. ${chunk.title || 'Untitled'} (Score: ${chunk.rerankScore.toFixed(3)})`)
    console.log(`   ${chunk.content.substring(0, 100)}...`)
  })

  return result
}

// Example 3: Advanced Reranking with Query Expansion
async function advancedReranking() {
  console.log('=== Advanced Reranking with Query Expansion ===')
  
  const chunks = [
    {
      id: '1',
      content: 'Transformers revolutionized natural language processing with attention mechanisms.',
      source: 'transformer_paper.pdf',
      similarity: 0.88
    },
    {
      id: '2',
      content: 'BERT uses bidirectional training to understand context in both directions.',
      source: 'bert_explained.pdf', 
      similarity: 0.85
    },
    {
      id: '3',
      content: 'GPT models generate text using autoregressive language modeling.',
      source: 'gpt_architecture.pdf',
      similarity: 0.83
    },
    {
      id: '4',
      content: 'Attention mechanisms allow models to focus on relevant parts of input.',
      source: 'attention_tutorial.pdf',
      similarity: 0.80
    }
  ]

  const response = await fetch(`${API_BASE}/reranking/advanced`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Explain transformer architecture',
      chunks: chunks,
      topN: 3,
      expandQuery: true,    // Expand query with context from top chunks
      multiStage: false     // Single-stage for this example
    })
  })

  const result = await response.json()
  
  console.log(`Query expansion applied: ${result.metadata.expandQuery || false}`)
  console.log(`Multi-stage processing: ${result.metadata.multiStage || false}`)
  
  result.results.forEach((chunk, i) => {
    console.log(`${i + 1}. Score: ${chunk.rerankScore.toFixed(3)} | ${chunk.content.substring(0, 70)}...`)
  })

  return result
}

// Example 4: Contextual Reranking
async function contextualReranking() {
  console.log('=== Contextual Reranking ===')
  
  const context = `
    We are discussing machine learning in the context of healthcare applications.
    The focus is on diagnostic systems, medical imaging, and patient care automation.
    We want to understand how AI can improve medical outcomes.
  `

  const chunks = [
    {
      id: '1',
      content: 'Machine learning algorithms can analyze medical images to detect diseases.',
      source: 'medical_ai.pdf',
      similarity: 0.82
    },
    {
      id: '2',
      content: 'Supervised learning requires labeled training data to make predictions.',
      source: 'ml_basics.pdf',
      similarity: 0.85
    },
    {
      id: '3',
      content: 'AI-powered diagnostic tools help doctors make more accurate diagnoses.',
      source: 'healthcare_ai.pdf',
      similarity: 0.79
    },
    {
      id: '4',
      content: 'Neural networks can process complex patterns in medical data.',
      source: 'medical_ml.pdf',
      similarity: 0.81
    }
  ]

  const response = await fetch(`${API_BASE}/reranking/contextual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'How can machine learning improve healthcare?',
      chunks: chunks,
      context: context.trim(),
      topN: 3
    })
  })

  const result = await response.json()
  
  console.log(`Context provided: ${result.metadata.contextProvided}`)
  console.log('Contextually reranked results:')
  
  result.results.forEach((chunk, i) => {
    console.log(`${i + 1}. [${chunk.rerankScore.toFixed(3)}] ${chunk.content}`)
  })

  return result
}

// Example 5: Method Comparison - With vs Without Reranking
async function compareWithAndWithoutReranking() {
  console.log('=== Comparison: With vs Without Reranking ===')
  
  const response = await fetch(`${API_BASE}/reranking/compare-methods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What are the benefits of renewable energy sources?',
      topK: 30,
      finalK: 8,
      rerankTopN: 5,
      lambda: 0.7
    })
  })

  const result = await response.json()
  
  console.log('Comparison Results:')
  console.log(`MMR only: ${result.comparison.mmrResultsCount} results`)
  console.log(`MMR + Rerank: ${result.comparison.rerankResultsCount} results`)
  console.log(`Overlap: ${result.comparison.overlapCount} documents`)
  console.log(`Top result changed: ${result.comparison.topResultChanged}`)
  console.log(`Avg similarity (MMR): ${result.comparison.avgSimilarityMMR?.toFixed(3)}`)
  console.log(`Avg rerank score: ${result.comparison.avgRerankScore?.toFixed(3)}`)
  console.log(`Reordering rate: ${(result.comparison.reorderingRate * 100).toFixed(1)}%`)

  console.log('\nTop 3 MMR Results:')
  result.methods.mmrOnly.results.slice(0, 3).forEach((chunk, i) => {
    console.log(`  ${i + 1}. [${chunk.similarity.toFixed(3)}] ${chunk.content.substring(0, 60)}...`)
  })

  console.log('\nTop 3 Reranked Results:')
  result.methods.mmrWithRerank.results.slice(0, 3).forEach((chunk, i) => {
    console.log(`  ${i + 1}. [${chunk.rerankScore.toFixed(3)}] ${chunk.content.substring(0, 60)}...`)
  })

  return result
}

// Example 6: Batch Reranking
async function batchReranking() {
  console.log('=== Batch Reranking ===')
  
  const queryChunkPairs = [
    {
      query: 'What is photosynthesis?',
      chunks: [
        { id: '1', content: 'Photosynthesis converts sunlight into chemical energy in plants.' },
        { id: '2', content: 'Chlorophyll absorbs light energy for photosynthesis.' },
        { id: '3', content: 'Plants produce oxygen as a byproduct of photosynthesis.' }
      ],
      metadata: { topic: 'biology' }
    },
    {
      query: 'How do computers work?',
      chunks: [
        { id: '4', content: 'Computers process information using binary code.' },
        { id: '5', content: 'The CPU executes instructions stored in memory.' },
        { id: '6', content: 'Input devices allow users to interact with computers.' }
      ],
      metadata: { topic: 'computer_science' }
    }
  ]

  const response = await fetch(`${API_BASE}/reranking/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queryChunkPairs: queryChunkPairs,
      topN: 2
    })
  })

  const result = await response.json()
  
  console.log(`Batch processing: ${result.successful} successful, ${result.failed} failed`)
  
  result.results.forEach((batchResult, i) => {
    console.log(`\nQuery ${i + 1}: "${batchResult.query}"`)
    console.log(`Topic: ${batchResult.metadata.topic}`)
    batchResult.results.forEach((chunk, j) => {
      console.log(`  ${j + 1}. [${chunk.rerankScore.toFixed(3)}] ${chunk.content}`)
    })
  })

  return result
}

// Example 7: Hybrid Retrieval + Reranking
async function hybridRetrievalWithReranking() {
  console.log('=== Hybrid Retrieval + Reranking ===')
  
  const response = await fetch(`${API_BASE}/reranking/hybrid-rerank`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'climate change effects on agriculture',
      finalK: 12,
      rerankTopN: 5,
      denseWeight: 0.6,   // Slightly favor keyword matching
      sparseWeight: 0.4,
      threshold: 0.25
    })
  })

  const result = await response.json()
  
  console.log('Hybrid + Rerank Pipeline:')
  console.log(`Dense weight: ${result.metadata.hybridMetadata?.weights?.dense}`)
  console.log(`Sparse weight: ${result.metadata.hybridMetadata?.weights?.sparse}`)
  console.log(`Final results: ${result.metadata.finalResults}`)
  
  result.results.forEach((chunk, i) => {
    console.log(`${i + 1}. [Rerank: ${chunk.rerankScore.toFixed(3)}] ${chunk.content.substring(0, 80)}...`)
  })

  return result
}

// Example 8: Cost Estimation
async function estimateRerankingCost() {
  console.log('=== Reranking Cost Estimation ===')
  
  const chunks = Array.from({ length: 25 }, (_, i) => ({
    id: `chunk_${i}`,
    content: `This is sample content for chunk ${i + 1}. It contains relevant information about the topic.`
  }))

  const response = await fetch(`${API_BASE}/reranking/estimate-cost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chunks: chunks,
      topN: 5
    })
  })

  const result = await response.json()
  
  console.log('Cost Estimation:')
  console.log(`Input chunks: ${result.data.inputChunks}`)
  console.log(`Top N: ${result.data.topN}`)
  console.log(`Search count: ${result.data.searchCount}`)
  console.log(`Estimated cost: ${result.data.formattedCost}`)
  console.log(`Cost per document: $${result.data.costPerDocument.toFixed(6)}`)

  return result
}

// Demonstration of why reranking improves quality
async function demonstrateRerankingBenefits() {
  console.log('=== Why Reranking Improves Quality ===')
  
  // Example showing how embedding similarity can be misleading
  const misleadingChunks = [
    {
      id: '1',
      content: 'The cat sat on the mat in the sunny garden.',
      similarity: 0.85 // High similarity but not relevant
    },
    {
      id: '2', 
      content: 'Machine learning models require large datasets for training.',
      similarity: 0.75 // Lower similarity but more relevant
    },
    {
      id: '3',
      content: 'Cats are popular pets that enjoy sitting in warm places.',
      similarity: 0.82 // High similarity, topically related but not relevant
    }
  ]

  const response = await fetch(`${API_BASE}/reranking/rerank`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'How do machine learning models learn from data?',
      chunks: misleadingChunks,
      topN: 3
    })
  })

  const result = await response.json()
  
  console.log('Original ranking (by embedding similarity):')
  misleadingChunks
    .sort((a, b) => b.similarity - a.similarity)
    .forEach((chunk, i) => {
      console.log(`${i + 1}. [${chunk.similarity.toFixed(3)}] ${chunk.content}`)
    })

  console.log('\nReranked results (by cross-attention relevance):')
  result.results.forEach((chunk, i) => {
    console.log(`${i + 1}. [${chunk.rerankScore.toFixed(3)}] ${chunk.content}`)
    console.log(`   Rank improvement: ${chunk.rankImprovement}`)
  })

  console.log('\n🎯 Key Benefits of Reranking:')
  console.log('1. Cross-attention: Considers query-document interaction, not just similarity')
  console.log('2. Context-aware: Understands semantic relationships beyond keyword matching')
  console.log('3. Fine-tuned: Trained specifically for relevance ranking tasks')
  console.log('4. Reduces false positives: Filters topically similar but irrelevant content')
  console.log('5. Handles nuances: Better at negations, conditions, and subtle meanings')

  return result
}

// Run all examples
async function runAllRerankingExamples() {
  try {
    await basicReranking()
    await completeRetrievalPipeline()
    await advancedReranking()
    await contextualReranking()
    await compareWithAndWithoutReranking()
    await batchReranking()
    await hybridRetrievalWithReranking()
    await estimateRerankingCost()
    await demonstrateRerankingBenefits()
    
    console.log('\n🎉 All reranking examples completed successfully!')
  } catch (error) {
    console.error('Error running reranking examples:', error.message)
  }
}

// Export for use in other files
export {
  basicReranking,
  completeRetrievalPipeline,
  advancedReranking,
  contextualReranking,
  compareWithAndWithoutReranking,
  batchReranking,
  hybridRetrievalWithReranking,
  estimateRerankingCost,
  demonstrateRerankingBenefits,
  runAllRerankingExamples
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllRerankingExamples()
}