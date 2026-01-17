# RAG System Windows Deployment Script
# Usage: .\windows-deploy.ps1 [environment]

param(
    [string]$Environment = "development"
)

Write-Host "🚀 Deploying RAG System to $Environment environment..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check prerequisites
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check Docker
    try {
        docker --version | Out-Null
    }
    catch {
        Write-Error "Docker is not installed or not in PATH"
        exit 1
    }
    
    # Check Docker Compose
    try {
        docker-compose --version | Out-Null
    }
    catch {
        Write-Error "Docker Compose is not installed or not in PATH"
        exit 1
    }
    
    # Check .env file
    if (-not (Test-Path ".env")) {
        Write-Error ".env file not found. Please create it from .env.example"
        exit 1
    }
    
    Write-Status "Prerequisites check passed ✅"
}

# Validate environment variables
function Test-Environment {
    Write-Status "Validating environment variables..."
    
    $envContent = Get-Content ".env" -Raw
    $requiredVars = @("SUPABASE_URL", "SUPABASE_ANON_KEY", "OPENAI_API_KEY")
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if (-not ($envContent -match "$var=.+")) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Error "Missing required environment variables:"
        $missingVars | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        exit 1
    }
    
    # Check optional variables
    if (-not ($envContent -match "COHERE_API_KEY=.+")) {
        Write-Warning "COHERE_API_KEY not set - reranking features will be disabled"
    }
    
    Write-Status "Environment validation passed ✅"
}

# Build and deploy
function Start-Deployment {
    Write-Status "Building and deploying containers..."
    
    # Stop existing containers
    docker-compose down
    
    # Build new images
    docker-compose build --no-cache
    
    # Start services
    if ($Environment -eq "production") {
        docker-compose --profile production up -d
    }
    else {
        docker-compose up -d
    }
    
    Write-Status "Containers started ✅"
}

# Health check
function Test-Health {
    Write-Status "Performing health check..."
    
    # Wait for service to start
    Start-Sleep -Seconds 10
    
    # Check health endpoint
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Status "Health check passed ✅"
                return
            }
        }
        catch {
            # Continue trying
        }
        
        Write-Status "Attempt $attempt/$maxAttempts - waiting for service..."
        Start-Sleep -Seconds 2
        $attempt++
    }
    
    Write-Error "Health check failed after $maxAttempts attempts"
    docker-compose logs rag-backend
    exit 1
}

# Test basic functionality
function Test-Functionality {
    Write-Status "Testing basic functionality..."
    
    # Test document processing
    $testDoc = @{
        text = "This is a test document for deployment verification."
        metadata = @{
            source = "deployment_test.txt"
            title = "Deployment Test"
        }
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/documents/process" `
            -Method POST `
            -ContentType "application/json" `
            -Body $testDoc `
            -TimeoutSec 30
        
        if ($response.success) {
            Write-Status "Document processing test passed ✅"
        }
        else {
            Write-Error "Document processing test failed"
            Write-Host $response
            exit 1
        }
    }
    catch {
        Write-Error "Document processing test failed: $($_.Exception.Message)"
        exit 1
    }
    
    # Test complete RAG pipeline
    $testQuery = @{
        query = "What is this test about?"
        topK = 10
        rerankTopN = 3
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/answers/complete-rag" `
            -Method POST `
            -ContentType "application/json" `
            -Body $testQuery `
            -TimeoutSec 30
        
        if ($response.success) {
            Write-Status "RAG pipeline test passed ✅"
        }
        else {
            Write-Warning "RAG pipeline test failed (may be due to insufficient data)"
        }
    }
    catch {
        Write-Warning "RAG pipeline test failed: $($_.Exception.Message)"
    }
}

# Show deployment info
function Show-DeploymentInfo {
    Write-Status "Deployment completed successfully! 🎉"
    Write-Host ""
    Write-Host "📊 Service Information:" -ForegroundColor Cyan
    Write-Host "  • API Base URL: http://localhost:3000"
    Write-Host "  • Health Check: http://localhost:3000/health"
    Write-Host "  • Documentation: http://localhost:3000"
    Write-Host ""
    Write-Host "🔧 Management Commands:" -ForegroundColor Cyan
    Write-Host "  • View logs: docker-compose logs -f rag-backend"
    Write-Host "  • Stop services: docker-compose down"
    Write-Host "  • Restart: docker-compose restart"
    Write-Host ""
    Write-Host "📚 API Endpoints:" -ForegroundColor Cyan
    Write-Host "  • Process documents: POST /api/documents/process"
    Write-Host "  • Complete RAG: POST /api/answers/complete-rag"
    Write-Host "  • MMR retrieval: POST /api/retrieval/mmr"
    Write-Host "  • Reranking: POST /api/reranking/rerank"
    Write-Host ""
    Write-Host "🧪 Test your deployment:" -ForegroundColor Cyan
    Write-Host "  npm run examples:answers"
}

# Main deployment flow
function Main {
    Write-Host "🏗️  RAG System Deployment" -ForegroundColor Blue
    Write-Host "==========================" -ForegroundColor Blue
    Write-Host ""
    
    Test-Prerequisites
    Test-Environment
    Start-Deployment
    Test-Health
    Test-Functionality
    Show-DeploymentInfo
}

# Handle script interruption
trap {
    Write-Error "Deployment interrupted"
    exit 1
}

# Run main function
Main