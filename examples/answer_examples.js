/**
 * Answer Generation Examples
 * Demonstrates LLM answering with inline citations and source snippets
 */

const API_BASE = 'http://localhost:3000/api'

// Example 1: Basic Answer Generation with Citations
async function basicAnswerGeneration() {
  console.log('=== Basic Answer Generation with Citations ===')
  
  // Sample chunks (would come from retrieval in real scenario)
  const chunks = [
    {
      id: '1',
      content: 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every task.',
      source: 'ml_textbook.pdf',
      title: 'Introduction to Machine Learning',
      section: 'Chapter 1',
      similarity: 0.89,
      rerankScore: 0.92
    },
    {
      id: '2',
      content: 'Supervised learning algorithms learn from labeled training data to make predictions on new, unseen data. Examples include linear regression, decision trees, and neural networks.',
      source: 'ml_algorithms.pdf', 
      title: 'Machine Learning Algorithms',
      section: 'Supervised Learning',
      similarity: 0.85,
      rerankScore: 0.88
    },
    {
      id: '3',
      content: 'Deep learning uses artificial neural networks with multiple layers to automatically learn hierarchical representations of data, making it particularly effective for complex tasks like image recognition.',
      source: 'deep_learning_guide.pdf',
      title: 'Deep Learning Fundamentals', 
      section: 'Neural Networks',
      similarity: 0.82,
      rerankScore: 0.85
    }
  ]

  const response = await fetch(`${API_BASE}/answers/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What is machine learning and how does it work?',
      chunks: chunks,
      model: 'gpt-4-turbo-preview',
      maxTokens: 800,
      temperature: 0.1,
      strictCitations: true
    })
  })

  const result = await response.json()
  
  console.log('Generated Answer:')
  console.log(result.answer)
  console.log('\nCitations Used:')
  result.citations.forEach(citation => {
    console.log(`[${citation.number}] ${citation.title} - ${citation.source}`)
  })
  
  console.log('\nSource Snippets:')
  result.sources.forEach(source => {
    console.log(`${source.citation} ${source.title}`)
    console.log(`   "${source.snippet}"`)
    console.log(`   Source: ${source.source}`)
  })

  console.log(`\nMetadata:`)
  console.log(`  Chunks provided: ${result.metadata.chunksProvided}`)
  console.log(`  Chunks used: ${result.metadata.chunksUsed}`)
  console.log(`  Has answer: ${result.metadata.hasAnswer}`)
  console.log(`  Confidence: ${result.metadata.confidence.toFixed(2)}`)

  return result
}

// Example 2: Complete RAG Pipeline
async function completeRAGPipeline() {
  console.log('\n=== Complete RAG Pipeline ===')
  
  const response = await fetch(`${API_BASE}/answers/complete-rag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'How do neural networks learn from data?',
      topK: 30,           // Initial retrieval
      finalK: 8,          // After MMR
      rerankTopN: 4,      // After reranking
      lambda: 0.7,        // MMR balance
      threshold: 0.4,     // Similarity threshold
      model: 'gpt-4-turbo-preview',
      maxTokens: 1000,
      temperature: 0.1,
      strictCitations: true
    })
  })

  const result = await response.json()
  
  console.log('Complete RAG Result:')
  console.log('Query:', result.query)
  console.log('\nAnswer:')
  console.log(result.answer)
  
  console.log('\nPipeline Metadata:')
  console.log(`  Initial candidates: ${result.metadata.retrievalMetadata?.totalCandidates || 'N/A'}`)
  console.log(`  After MMR: ${result.metadata.retrievalMetadata?.mmrResults || 'N/A'}`)
  console.log(`  Final chunks: ${result.metadata.chunksProvided}`)
  console.log(`  Citations used: ${result.citations.length}`)
  console.log(`  Answer confidence: ${result.metadata.confidence.toFixed(2)}`)

  if (result.sources.length > 0) {
    console.log('\nSources:')
    result.sources.forEach(source => {
      console.log(`${source.citation} ${source.title} (${source.source})`)
    })
  }

  return result
}

// Example 3: Conversational Answer with History
async function conversationalAnswer() {
  console.log('\n=== Conversational Answer with History ===')
  
  const conversationHistory = [
    {
      query: 'What is artificial intelligence?',
      answer: 'Artificial intelligence (AI) is a branch of computer science that aims to create machines capable of performing tasks that typically require human intelligence.'
    },
    {
      query: 'What are the main types of AI?',
      answer: 'The main types of AI include narrow AI (designed for specific tasks), general AI (human-level intelligence), and superintelligence (exceeding human capabilities).'
    }
  ]

  const chunks = [
    {
      id: '1',
      content: 'Machine learning is a key component of AI that allows systems to automatically learn and improve from experience without being explicitly programmed.',
      source: 'ai_overview.pdf',
      title: 'AI Fundamentals'
    },
    {
      id: '2', 
      content: 'Deep learning, a subset of machine learning, uses neural networks with multiple layers to process data and make decisions.',
      source: 'deep_learning.pdf',
      title: 'Deep Learning Explained'
    }
  ]

  const response = await fetch(`${API_BASE}/answers/conversational`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'How does machine learning relate to what we discussed?',
      chunks: chunks,
      conversationHistory: conversationHistory,
      temperature: 0.2
    })
  })

  const result = await response.json()
  
  console.log('Conversational Answer:')
  console.log(result.answer)
  console.log(`\nUsed ${conversationHistory.length} previous exchanges for context`)

  return result
}

// Example 4: Custom Answer with Specific Instructions
async function customAnswerGeneration() {
  console.log('\n=== Custom Answer with Instructions ===')
  
  const chunks = [
    {
      id: '1',
      content: 'Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen.',
      source: 'biology_textbook.pdf'
    },
    {
      id: '2',
      content: 'Chlorophyll in plant leaves absorbs light energy, primarily in the red and blue wavelengths, while reflecting green light.',
      source: 'plant_biology.pdf'
    },
    {
      id: '3',
      content: 'The photosynthesis process occurs in two main stages: light-dependent reactions and light-independent reactions (Calvin cycle).',
      source: 'biochemistry_guide.pdf'
    }
  ]

  const instructions = `
    Explain the topic as if you're teaching a 10-year-old student. 
    Use simple language, analogies, and break down complex concepts.
    Include all the important facts but make them easy to understand.
    Still use proper citations for each fact.
  `

  const response = await fetch(`${API_BASE}/answers/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'How does photosynthesis work?',
      chunks: chunks,
      instructions: instructions.trim(),
      temperature: 0.3
    })
  })

  const result = await response.json()
  
  console.log('Custom Answer (Kid-Friendly):')
  console.log(result.answer)
  console.log('\nCustom Instructions Applied:', result.metadata.customInstructions ? 'Yes' : 'No')

  return result
}

// Example 5: Handling No-Answer Cases
async function noAnswerHandling() {
  console.log('\n=== No-Answer Case Handling ===')
  
  // Chunks that are topically related but don't answer the specific question
  const irrelevantChunks = [
    {
      id: '1',
      content: 'The weather today is sunny with a temperature of 75 degrees Fahrenheit.',
      source: 'weather_report.txt',
      similarity: 0.2
    },
    {
      id: '2',
      content: 'Cats are popular pets known for their independence and hunting abilities.',
      source: 'pet_guide.pdf',
      similarity: 0.15
    }
  ]

  const response = await fetch(`${API_BASE}/answers/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What are the latest developments in quantum computing?',
      chunks: irrelevantChunks,
      strictCitations: true
    })
  })

  const result = await response.json()
  
  console.log('No-Answer Response:')
  console.log(result.answer)
  console.log(`\nResponse Type: ${result.metadata.responseType}`)
  console.log(`Has Answer: ${result.metadata.hasAnswer}`)
  console.log(`Confidence: ${result.metadata.confidence}`)

  return result
}

// Example 6: Batch Answer Generation
async function batchAnswerGeneration() {
  console.log('\n=== Batch Answer Generation ===')
  
  const globalChunks = [
    {
      id: '1',
      content: 'Renewable energy sources include solar, wind, hydroelectric, and geothermal power.',
      source: 'energy_guide.pdf'
    },
    {
      id: '2',
      content: 'Solar panels convert sunlight directly into electricity using photovoltaic cells.',
      source: 'solar_technology.pdf'
    },
    {
      id: '3',
      content: 'Wind turbines generate electricity by converting the kinetic energy of wind into rotational energy.',
      source: 'wind_power.pdf'
    }
  ]

  const queries = [
    { query: 'What are renewable energy sources?' },
    { query: 'How do solar panels work?' },
    { query: 'What is wind energy?' }
  ]

  const response = await fetch(`${API_BASE}/answers/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queries: queries,
      globalChunks: globalChunks,
      options: {
        temperature: 0.1,
        maxTokens: 500
      }
    })
  })

  const result = await response.json()
  
  console.log(`Batch Results: ${result.successful} successful, ${result.failed} failed`)
  
  result.results.forEach((item, i) => {
    console.log(`\n${i + 1}. Query: "${item.query}"`)
    console.log(`   Answer: ${item.answer.substring(0, 100)}...`)
    console.log(`   Citations: ${item.citations.length}`)
  })

  return result
}

// Example 7: Answer Evaluation
async function answerEvaluation() {
  console.log('\n=== Answer Evaluation ===')
  
  const query = 'What is machine learning?'
  const answer = 'Machine learning is a subset of artificial intelligence [1] that enables computers to learn from data [2]. It uses algorithms to identify patterns and make predictions without explicit programming [1].'
  
  const chunks = [
    {
      id: '1',
      content: 'Machine learning is a subset of artificial intelligence that enables systems to learn from data.',
      source: 'ml_basics.pdf'
    },
    {
      id: '2',
      content: 'Data is the foundation of machine learning, providing examples for algorithms to learn patterns.',
      source: 'data_science.pdf'
    }
  ]

  const response = await fetch(`${API_BASE}/answers/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: query,
      answer: answer,
      chunks: chunks
    })
  })

  const result = await response.json()
  
  console.log('Answer Evaluation:')
  console.log(`Citation Count: ${result.metrics.citationCount}`)
  console.log(`Valid Citations: ${result.metrics.validCitations}`)
  console.log(`Citation Coverage: ${(result.metrics.citationCoverage * 100).toFixed(1)}%`)
  console.log(`Chunk Utilization: ${(result.metrics.chunkUtilization * 100).toFixed(1)}%`)
  
  console.log('\nQuality Checks:')
  console.log(`  Has Citations: ${result.quality.hasCitations}`)
  console.log(`  All Citations Valid: ${result.quality.allCitationsValid}`)
  console.log(`  Reasonable Length: ${result.quality.reasonableLength}`)
  console.log(`  Uses Multiple Sources: ${result.quality.usesMultipleSources}`)

  return result
}

// Example 8: Demonstrating Citation Benefits
async function demonstrateCitationBenefits() {
  console.log('\n=== Citation Benefits Demonstration ===')
  
  const chunks = [
    {
      id: '1',
      content: 'Climate change is causing global temperatures to rise by approximately 1.1°C since pre-industrial times.',
      source: 'ipcc_report_2023.pdf',
      title: 'IPCC Climate Report 2023'
    },
    {
      id: '2',
      content: 'Sea levels have risen by about 21-24 centimeters since 1880 due to thermal expansion and melting ice.',
      source: 'nasa_climate_data.pdf',
      title: 'NASA Climate Data'
    },
    {
      id: '3',
      content: 'Arctic sea ice is declining at a rate of 13% per decade, affecting polar bear habitats and global weather patterns.',
      source: 'arctic_research_2023.pdf',
      title: 'Arctic Research Study'
    }
  ]

  const response = await fetch(`${API_BASE}/answers/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What are the measurable effects of climate change?',
      chunks: chunks,
      strictCitations: true,
      includeSourceSnippets: true
    })
  })

  const result = await response.json()
  
  console.log('Answer with Citations:')
  console.log(result.answer)
  
  console.log('\n📚 Benefits of Citations:')
  console.log('1. Verifiability: Users can check original sources')
  console.log('2. Credibility: Shows answer is based on authoritative sources')
  console.log('3. Transparency: Clear about information sources')
  console.log('4. Accountability: LLM must ground claims in provided context')
  
  console.log('\nSource Attribution:')
  result.sources.forEach(source => {
    console.log(`${source.citation} ${source.title}`)
    console.log(`   Snippet: "${source.snippet}"`)
    console.log(`   Rerank Score: ${source.rerankScore?.toFixed(3) || 'N/A'}`)
  })

  return result
}

// Run all examples
async function runAllAnswerExamples() {
  try {
    await basicAnswerGeneration()
    await completeRAGPipeline()
    await conversationalAnswer()
    await customAnswerGeneration()
    await noAnswerHandling()
    await batchAnswerGeneration()
    await answerEvaluation()
    await demonstrateCitationBenefits()
    
    console.log('\n🎉 All answer generation examples completed successfully!')
  } catch (error) {
    console.error('Error running answer examples:', error.message)
  }
}

// Export for use in other files
export {
  basicAnswerGeneration,
  completeRAGPipeline,
  conversationalAnswer,
  customAnswerGeneration,
  noAnswerHandling,
  batchAnswerGeneration,
  answerEvaluation,
  demonstrateCitationBenefits,
  runAllAnswerExamples
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllAnswerExamples()
}