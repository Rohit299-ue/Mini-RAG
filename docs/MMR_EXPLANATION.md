# Maximal Marginal Relevance (MMR) Implementation

## Overview

Maximal Marginal Relevance (MMR) is a technique used to balance relevance and diversity in information retrieval. Instead of simply returning the most similar documents, MMR ensures that the retrieved documents are both relevant to the query and diverse from each other.

## The MMR Formula

```
MMR = λ * Sim(q, d) - (1-λ) * max(Sim(d, d_i))
```

Where:
- `λ` (lambda): Balance parameter between relevance and diversity (0 ≤ λ ≤ 1)
- `Sim(q, d)`: Similarity between query `q` and candidate document `d`
- `Sim(d, d_i)`: Similarity between candidate document `d` and already selected document `d_i`
- `max(Sim(d, d_i))`: Maximum similarity to any already selected document

## How Our Implementation Works

### 1. Initial Retrieval Phase
```javascript
// Retrieve top-k candidates using vector similarity
const candidates = await this.retrieveTopKCandidates(queryEmbedding, {
  topK: 50,        // Get many candidates for MMR selection
  threshold: 0.3,  // Minimum similarity threshold
  source,          // Optional filtering
  section
})
```

### 2. MMR Selection Process

#### Step 1: Select Most Relevant Document
```javascript
// Always select the most relevant document first
const mostRelevant = remaining.reduce((best, current) => 
  current.similarity > best.similarity ? current : best
)
selected.push(mostRelevant)
```

#### Step 2: Iterative MMR Selection
```javascript
while (selected.length < finalK && remaining.length > 0) {
  let bestCandidate = null
  let bestScore = -Infinity

  for (const candidate of remaining) {
    // Calculate relevance score (similarity to query)
    const relevanceScore = candidate.similarity

    // Calculate maximum similarity to already selected documents
    let maxSimilarityToSelected = 0
    for (const selectedDoc of selected) {
      const similarity = cosineSimilarity(
        candidate.embedding,
        selectedDoc.embedding
      )
      maxSimilarityToSelected = Math.max(maxSimilarityToSelected, similarity)
    }

    // Calculate MMR score
    const mmrScore = lambda * relevanceScore - (1 - lambda) * maxSimilarityToSelected

    if (mmrScore > bestScore) {
      bestScore = mmrScore
      bestCandidate = candidate
    }
  }

  if (bestCandidate) {
    selected.push(bestCandidate)
    remaining.splice(remaining.indexOf(bestCandidate), 1)
  }
}
```

## Lambda Parameter Effects

### λ = 1.0 (Pure Relevance)
- Only considers similarity to query
- May return very similar documents
- Good for: Focused, specific queries

### λ = 0.5 (Balanced)
- Equal weight to relevance and diversity
- Good general-purpose setting
- Good for: Exploratory queries

### λ = 0.0 (Pure Diversity)
- Only considers diversity from selected documents
- May return less relevant but very diverse results
- Good for: Broad topic exploration

### λ = 0.7 (Recommended Default)
- Favors relevance but ensures some diversity
- Good balance for most RAG applications
- Good for: Most question-answering scenarios

## Implementation Benefits

### 1. Improved Coverage
```javascript
// Without MMR: Might get 5 very similar chunks about "neural networks"
// With MMR: Gets chunks about neural networks, training, applications, history, etc.
```

### 2. Better User Experience
- Reduces redundant information
- Provides broader context
- Helps users discover related topics

### 3. Enhanced RAG Performance
- LLM gets more diverse context
- Reduces repetitive information in prompts
- Improves answer quality and completeness

## Advanced Features

### 1. Hybrid Retrieval with MMR
```javascript
// Combines dense vector search with sparse keyword search
const denseResults = await retrieveWithMMR(query, { lambda: 0.7 })
const sparseResults = await keywordSearch(query)
const fusedResults = reciprocalRankFusion(denseResults, sparseResults)
```

### 2. Multi-step Retrieval
```javascript
// Iteratively refines search based on previous results
for (let step = 0; step < steps; step++) {
  const stepResults = await retrieveWithMMR(currentQuery, options)
  allResults.push(...stepResults.results)
  // Update query based on results for next step
  currentQuery = expandQuery(query, stepResults.results[0])
}
```

### 3. Contextual Expansion
```javascript
// Expands query with additional context
const expandedQuery = context 
  ? `${context}\n\nQuery: ${query}`
  : query
return await retrieveWithMMR(expandedQuery, options)
```

## Performance Considerations

### 1. Computational Complexity
- **Initial retrieval**: O(n log k) where n = total documents, k = topK
- **MMR selection**: O(k² * d) where k = candidates, d = embedding dimensions
- **Total**: Dominated by embedding similarity calculations

### 2. Optimization Strategies
```javascript
// 1. Limit candidate pool size
const topK = Math.min(50, totalDocuments) // Don't retrieve more than needed

// 2. Early termination
if (bestScore < threshold) break // Stop if no good candidates remain

// 3. Batch similarity calculations
const similarities = batchCosineSimilarity(candidate.embedding, selectedEmbeddings)
```

### 3. Memory Usage
- Stores embeddings for all candidates during MMR
- Memory usage: `topK * embedding_dimensions * 4 bytes`
- For 50 candidates with 1536-dim embeddings: ~300KB

## Configuration Guidelines

### For Different Use Cases

#### 1. FAQ/Support Systems
```javascript
{
  topK: 30,
  finalK: 5,
  lambda: 0.8,  // High relevance
  threshold: 0.6
}
```

#### 2. Research/Exploration
```javascript
{
  topK: 100,
  finalK: 15,
  lambda: 0.5,  // Balanced
  threshold: 0.3
}
```

#### 3. Summarization
```javascript
{
  topK: 50,
  finalK: 10,
  lambda: 0.6,  // Slight relevance preference
  threshold: 0.4
}
```

#### 4. Creative Writing/Brainstorming
```javascript
{
  topK: 80,
  finalK: 12,
  lambda: 0.4,  // High diversity
  threshold: 0.2
}
```

## Evaluation Metrics

### 1. Relevance Metrics
```javascript
const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length
```

### 2. Diversity Metrics
```javascript
// Average pairwise similarity (lower = more diverse)
let totalSimilarity = 0
let comparisons = 0
for (let i = 0; i < results.length; i++) {
  for (let j = i + 1; j < results.length; j++) {
    totalSimilarity += cosineSimilarity(results[i].embedding, results[j].embedding)
    comparisons++
  }
}
const diversityScore = 1 - (totalSimilarity / comparisons)
```

### 3. Coverage Metrics
```javascript
// Number of unique sections/sources covered
const uniqueSections = new Set(results.map(r => r.section)).size
const uniqueSources = new Set(results.map(r => r.source)).size
```

## Common Issues and Solutions

### 1. All Results from Same Source
**Problem**: MMR selects diverse content but all from one document
**Solution**: Add source-level diversity constraint
```javascript
// Limit results per source
const sourceCount = {}
if ((sourceCount[candidate.source] || 0) >= maxPerSource) continue
```

### 2. Low Relevance with High Diversity
**Problem**: λ too low, getting irrelevant but diverse results
**Solution**: Increase λ or raise similarity threshold
```javascript
if (relevanceScore < minRelevanceThreshold) continue
```

### 3. Poor Performance with Large Candidate Sets
**Problem**: MMR is slow with many candidates
**Solution**: Pre-filter candidates or use approximate methods
```javascript
// Pre-filter by minimum similarity
const filteredCandidates = candidates.filter(c => c.similarity > preFilterThreshold)
```

This MMR implementation provides a robust foundation for diverse, relevant retrieval in RAG systems while maintaining good performance characteristics.