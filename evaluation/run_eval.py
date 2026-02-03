import json
import requests
import time

API_URL = "http://localhost:8000"

def load_test_cases():
    with open('test_cases.json', 'r') as f:
        return json.load(f)

def run_evaluation():
    """Run evaluation on test cases"""
    print("=" * 60)
    print("Mini RAG Evaluation Suite")
    print("=" * 60)
    
    data = load_test_cases()
    test_cases = data['test_cases']
    
    print(f"\nRunning {len(test_cases)} test cases...\n")
    
    results = []
    
    for test in test_cases:
        print(f"Test {test['id']}: {test['category']}")
        print(f"Question: {test['question']}")
        
        try:
            start = time.time()
            response = requests.post(
                f"{API_URL}/ask",
                json={"question": test['question']},
                timeout=30
            )
            elapsed = time.time() - start
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ Answer received in {elapsed:.2f}s")
                print(f"  Tokens: {result['tokens_used']}")
                print(f"  Citations: {len(result['citations'])}")
                
                results.append({
                    'test_id': test['id'],
                    'success': True,
                    'time': elapsed,
                    'tokens': result['tokens_used'],
                    'citations': len(result['citations'])
                })
            else:
                print(f"✗ Failed: {response.status_code}")
                results.append({
                    'test_id': test['id'],
                    'success': False,
                    'error': response.text
                })
        
        except Exception as e:
            print(f"✗ Error: {e}")
            results.append({
                'test_id': test['id'],
                'success': False,
                'error': str(e)
            })
        
        print()
    
    # Summary
    print("=" * 60)
    print("Evaluation Summary")
    print("=" * 60)
    
    successful = sum(1 for r in results if r.get('success'))
    print(f"Success Rate: {successful}/{len(results)} ({successful/len(results)*100:.1f}%)")
    
    if successful > 0:
        avg_time = sum(r['time'] for r in results if r.get('success')) / successful
        avg_tokens = sum(r['tokens'] for r in results if r.get('success')) / successful
        print(f"Average Response Time: {avg_time:.2f}s")
        print(f"Average Tokens Used: {avg_tokens:.0f}")
    
    print("\nNote: Upload relevant documents before running evaluation!")
    print("Expected success rate: ~85% with proper document context")

if __name__ == "__main__":
    run_evaluation()
