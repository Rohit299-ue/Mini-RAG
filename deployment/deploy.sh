#!/bin/bash

# RAG System Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-development}
echo "🚀 Deploying RAG System to $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check .env file
    if [ ! -f .env ]; then
        print_error ".env file not found. Please create it from .env.example"
        exit 1
    fi
    
    print_status "Prerequisites check passed ✅"
}

# Validate environment variables
validate_env() {
    print_status "Validating environment variables..."
    
    required_vars=("SUPABASE_URL" "SUPABASE_ANON_KEY" "OPENAI_API_KEY")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
    
    # Check optional variables
    if ! grep -q "^COHERE_API_KEY=" .env || grep -q "^COHERE_API_KEY=$" .env; then
        print_warning "COHERE_API_KEY not set - reranking features will be disabled"
    fi
    
    print_status "Environment validation passed ✅"
}

# Build and deploy
deploy() {
    print_status "Building and deploying containers..."
    
    # Stop existing containers
    docker-compose down
    
    # Build new images
    docker-compose build --no-cache
    
    # Start services
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose --profile production up -d
    else
        docker-compose up -d
    fi
    
    print_status "Containers started ✅"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait for service to start
    sleep 10
    
    # Check health endpoint
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/health &> /dev/null; then
            print_status "Health check passed ✅"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for service..."
        sleep 2
        ((attempt++))
    done
    
    print_error "Health check failed after $max_attempts attempts"
    docker-compose logs rag-backend
    exit 1
}

# Test basic functionality
test_functionality() {
    print_status "Testing basic functionality..."
    
    # Test document processing
    response=$(curl -s -X POST http://localhost:3000/api/documents/process \
        -H "Content-Type: application/json" \
        -d '{
            "text": "This is a test document for deployment verification.",
            "metadata": {
                "source": "deployment_test.txt",
                "title": "Deployment Test"
            }
        }')
    
    if echo "$response" | grep -q '"success":true'; then
        print_status "Document processing test passed ✅"
    else
        print_error "Document processing test failed"
        echo "$response"
        exit 1
    fi
    
    # Test complete RAG pipeline
    response=$(curl -s -X POST http://localhost:3000/api/answers/complete-rag \
        -H "Content-Type: application/json" \
        -d '{
            "query": "What is this test about?",
            "topK": 10,
            "rerankTopN": 3
        }')
    
    if echo "$response" | grep -q '"success":true'; then
        print_status "RAG pipeline test passed ✅"
    else
        print_warning "RAG pipeline test failed (may be due to insufficient data)"
    fi
}

# Show deployment info
show_info() {
    print_status "Deployment completed successfully! 🎉"
    echo ""
    echo "📊 Service Information:"
    echo "  • API Base URL: http://localhost:3000"
    echo "  • Health Check: http://localhost:3000/health"
    echo "  • Documentation: http://localhost:3000"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • View logs: docker-compose logs -f rag-backend"
    echo "  • Stop services: docker-compose down"
    echo "  • Restart: docker-compose restart"
    echo ""
    echo "📚 API Endpoints:"
    echo "  • Process documents: POST /api/documents/process"
    echo "  • Complete RAG: POST /api/answers/complete-rag"
    echo "  • MMR retrieval: POST /api/retrieval/mmr"
    echo "  • Reranking: POST /api/reranking/rerank"
    echo ""
    echo "🧪 Test your deployment:"
    echo "  npm run examples:answers"
}

# Main deployment flow
main() {
    echo "🏗️  RAG System Deployment"
    echo "=========================="
    echo ""
    
    check_prerequisites
    validate_env
    deploy
    health_check
    test_functionality
    show_info
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main