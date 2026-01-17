/**
 * Vector Retrieval Examples
 * Demonstrates different retrieval methods and their use cases
 */

const API_BASE = 'http://localhost:3000/api'

// Example 1: Basic MMR Retrieval
async function basicMMRRetrieval() {
  console.log('=== Basic MMR Retrieval ===')
  
  const response = await fetch(`${API_BASE}/retrieval/mmr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What is machine learning and how does it work?',
      finalK: 10,
      lambda: 0.7, // Balance between relevance (0.7) and diversity (0.3)
      threshold: 0.3
    })
  })
  
  const result = await response.json()
  
  console.log(`Found ${result.results.length} results`)
  console.log(`Average similarity: ${result.metadata.avgSimilarity.toFixed(3)}`)
  console.log(`Diversity score: ${result.metadata.diversityScore.toFixed(3)}`)
  
  result.results.slice(0, 3).forEach((doc, i) => {
    console.log(`\n${i + 1}. ${doc.title || 'Untitled'} (${doc.similarity.toFixed(3)})`)
    console.log(`   ${doc.content.substring(0, 100)}...`)
    console.log(`   MMR Score: ${doc.metadata.mmrScore?.toFixed(3)}`)
  })
  
  return result
}

// Example 2: Hybrid Retrieval (Dense + Sparse)
async function hybridRetrieval() {
  console.log('\n=== Hybrid Retrieval ===')
  
  const response = await fetch(`${API_BASE}/retrieval/hybrid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'neural networks deep learning algorithms',
      finalK: 8,
      denseWeight: 0.7,  // Vector similarity weight
      sparseWeight: 0.3, // Keyword matching weight
      threshold: 0.2
    })
  })
  
  const result = await response.json()
  
  console.log(`Dense results: ${result.metadata.denseResultsCount}`)
  console.log(`Sparse results: ${result.metadata.sparseResultsCount}`)
  console.log(`Final fused results: ${result.results.length}`)
  
  result.results.slice(0, 3).forEach((doc, i) => {
    console.log(`\n${i + 1}. ${doc.title || 'Untitled'}`)
    console.log(`   Dense rank: ${doc.metadata.denseRank || 'N/A'}`)
    console.log(`   Sparse rank: ${doc.metadata.sparseRank || 'N/A'}`)
    console.log(`   RRF Score: ${doc.metadata.rrfScore?.toFixed(4)}`)
  })
  
  return result
}

// Example 3: Contextual Retrieval
async function contextualRetrieval() {
  console.log('\n=== Contextual Retrieval ===')
  
  const context = `
    We are discussing artificial intelligence in the context of healthcare applications.
    The focus is on diagnostic systems and patient care automation.
  `
  
  const response = await fetch(`${API_BASE}/retrieval/contextual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'How can AI improve medical diagnosis?',
      context: context.trim(),
      finalK: 6,
      threshold: 0.4
    })
  })
  
  const result = await response.json()
  
  console.log(`Contextual results: ${result.results.length}`)
  
  result.results.slice(0, 2).forEach((doc, i) => {
    console.log(`\n${i + 1}. ${doc.title || 'Untitled'} (${doc.similarity.toFixed(3)})`)
    console.log(`   ${doc.content.substring(0, 120)}...`)
  })
  
  return result
}

// Example 4: Multi-step Retrieval
async function multiStepRetrieval() {
  console.log('\n=== Multi-step Retrieval ===')
  
  const response = await fetch(`${API_BASE}/retrieval/multi-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Explain the transformer architecture in deep learning',
      steps: 2,
      finalK: 8,
      lambda: 0.6
    })
  })
  
  const result = await response.json()
  
  console.log(`Steps: ${result.metadata.steps}`)
  console.log(`Total candidates: ${result.metadata.totalCandidates}`)
  console.log(`Unique results: ${result.metadata.uniqueResults}`)
  console.log(`Final results: ${result.metadata.finalResults}`)
  
  return result
}

// Example 5: Method Comparison
async function compareRetrievalMethods() {
  console.log('\n=== Method Comparison ===')
  
  const response = await fetch(`${API_BASE}/retrieval/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What are the benefits of renewable energy?',
      finalK: 5,
      threshold: 0.3
    })
  })
  
  const result = await response.json()
  
  console.log('MMR Results:')
  console.log(`  Count: ${result.comparison.mmrResultCount}`)
  console.log(`  Avg Similarity: ${result.comparison.avgSimilarityMMR?.toFixed(3)}`)
  console.log(`  Diversity: ${result.comparison.diversityScoreMMR?.toFixed(3)}`)
  
  console.log('\nHybrid Results:')
  console.log(`  Count: ${result.comparison.hybridResultCount}`)
  console.log(`  Overlap with MMR: ${result.comparison.overlapCount}`)
  
  return result
}

// Example 6: Benchmark Different Configurations
async function benchmarkConfigurations() {
  console.log('\n=== Configuration Benchmark ===')
  
  const configurations = [
    { finalK: 5, lambda: 0.5, threshold: 0.3 }, // Balanced
    { finalK: 5, lambda: 0.8, threshold: 0.3 }, // Relevance-focused
    { finalK: 5, lambda: 0.3, threshold: 0.3 }, // Diversity-focused
    { finalK: 10, lambda: 0.7, threshold: 0.2 } // More results, lower threshold
  ]
  
  const response = await fetch(`${API_BASE}/retrieval/benchmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'How does photosynthesis work in plants?',
      configurations
    })
  })
  
  const result = await response.json()
  
  console.log(`Benchmarked ${result.benchmark.configurationsCount} configurations`)
  console.log(`Successful: ${result.benchmark.summary.successful}`)
  console.log(`Failed: ${result.benchmark.summary.failed}`)
  console.log(`Avg execution time: ${result.benchmark.summary.avgExecutionTime}ms`)
  
  result.benchmark.results.forEach((config, i) => {
    if (!config.error) {
      console.log(`\nConfig ${i + 1}: λ=${config.config.lambda}, k=${config.config.finalK}`)
      console.log(`  Time: ${config.performance.executionTime}ms`)
      console.log(`  Results: ${config.performance.resultsCount}`)
      console.log(`  Avg Similarity: ${config.performance.avgSimilarity?.toFixed(3)}`)
      console.log(`  Diversity: ${config.performance.diversityScore?.toFixed(3)}`)
    }
  })
  
  return result
}

// Example 7: Source-specific Retrieval
async function sourceSpecificRetrieval() {
  console.log('\n=== Source-specific Retrieval ===')
  
  const response = await fetch(`${API_BASE}/retrieval/mmr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'climate change effects on agriculture',
      finalK: 6,
      lambda: 0.7,
      source: 'climate_report_2024.pdf', // Only search in specific document
      threshold: 0.4
    })
  })
  
  const result = await response.json()
  
  console.log(`Results from source: ${result.results[0]?.source || 'N/A'}`)
  console.log(`Found ${result.results.length} relevant chunks`)
  
  return result
}

// Example 8: Advanced MMR with Custom Parameters
async function advancedMMRRetrieval() {
  console.log('\n=== Advanced MMR Configuration ===')
  
  const response = await fetch(`${API_BASE}/retrieval/mmr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'quantum computing applications in cryptography',
      topK: 100,        // Retrieve many candidates
      finalK: 12,       // Return more final results
      lambda: 0.6,      // Favor diversity slightly more
      threshold: 0.25,  // Lower threshold for broader search
      includeMetadata: true
    })
  })
  
  const result = await response.json()
  
  console.log(`Candidates retrieved: ${result.metadata.candidatesFound}`)
  console.log(`Final results: ${result.metadata.finalResults}`)
  console.log(`MMR applied: ${result.metadata.mmrApplied}`)
  console.log(`Parameters used: λ=${result.metadata.parameters.lambda}, k=${result.metadata.parameters.finalK}`)
  
  // Show diversity in results
  const sections = [...new Set(result.results.map(r => r.section).filter(Boolean))]
  console.log(`Sections covered: ${sections.join(', ')}`)
  
  return result
}

// Run all examples
async function runAllExamples() {
  try {
    await basicMMRRetrieval()
    await hybridRetrieval()
    await contextualRetrieval()
    await multiStepRetrieval()
    await compareRetrievalMethods()
    await benchmarkConfigurations()
    await sourceSpecificRetrieval()
    await advancedMMRRetrieval()
    
    console.log('\n=== All examples completed successfully! ===')
  } catch (error) {
    console.error('Error running examples:', error.message)
  }
}

// Export for use in other files
export {
  basicMMRRetrieval,
  hybridRetrieval,
  contextualRetrieval,
  multiStepRetrieval,
  compareRetrievalMethods,
  benchmarkConfigurations,
  sourceSpecificRetrieval,
  advancedMMRRetrieval,
  runAllExamples
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples()
}