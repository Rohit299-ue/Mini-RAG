#!/bin/bash

# Production Deployment Script for RAG System
# Deploys backend to Render and frontend to Netlify

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes. Commit them first."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_status "Prerequisites check passed ✅"
}

# Deploy backend to Render
deploy_backend() {
    print_header "🚀 Deploying Backend to Render..."
    
    # Render auto-deploys on git push, so we just need to push
    print_status "Pushing changes to trigger Render deployment..."
    
    # Add deployment timestamp to commit
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    git add .
    git commit -m "Deploy to production - $TIMESTAMP" || true
    git push origin main
    
    print_status "Backend deployment triggered ✅"
    print_status "Monitor deployment at: https://dashboard.render.com"
}

# Deploy frontend to Netlify
deploy_frontend() {
    print_header "🎨 Deploying Frontend to Netlify..."
    
    cd frontend
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in frontend directory"
        exit 1
    fi
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build the project
    print_status "Building frontend for production..."
    npm run build
    
    # Check if Netlify CLI is available
    if command -v netlify &> /dev/null; then
        print_status "Deploying to Netlify using CLI..."
        netlify deploy --prod --dir=build
        print_status "Frontend deployed via Netlify CLI ✅"
    else
        print_warning "Netlify CLI not found"
        print_status "Manual deployment required:"
        print_status "1. Go to https://app.netlify.com"
        print_status "2. Drag and drop the 'frontend/build' folder"
        print_status "3. Or connect your Git repository for auto-deployment"
    fi
    
    cd ..
}

# Verify deployment
verify_deployment() {
    print_header "🧪 Verifying Deployment..."
    
    # Get backend URL from user or use default
    read -p "Enter your Render backend URL (or press Enter for default): " BACKEND_URL
    BACKEND_URL=${BACKEND_URL:-"https://your-rag-backend.onrender.com"}
    
    # Test backend health
    print_status "Testing backend health..."
    if curl -f "$BACKEND_URL/health" &> /dev/null; then
        print_status "Backend health check passed ✅"
    else
        print_warning "Backend health check failed ⚠️"
        print_status "This might be normal if the service is still starting up"
    fi
    
    # Get frontend URL from user
    read -p "Enter your Netlify frontend URL (optional): " FRONTEND_URL
    
    if [ ! -z "$FRONTEND_URL" ]; then
        print_status "Testing frontend..."
        if curl -f "$FRONTEND_URL" &> /dev/null; then
            print_status "Frontend accessible ✅"
        else
            print_warning "Frontend not accessible ⚠️"
        fi
    fi
}

# Show deployment summary
show_summary() {
    print_header "📋 Deployment Summary"
    echo ""
    echo "🎉 Deployment completed!"
    echo ""
    echo "📊 Service URLs:"
    echo "  • Backend (Render): https://your-rag-backend.onrender.com"
    echo "  • Frontend (Netlify): https://your-app.netlify.app"
    echo ""
    echo "🔧 Management Dashboards:"
    echo "  • Render: https://dashboard.render.com"
    echo "  • Netlify: https://app.netlify.com"
    echo ""
    echo "📚 Next Steps:"
    echo "  1. Update environment variables in Render dashboard"
    echo "  2. Configure custom domain in Netlify (optional)"
    echo "  3. Set up monitoring and alerts"
    echo "  4. Test the complete RAG pipeline"
    echo ""
    echo "🧪 Test your deployment:"
    echo "  curl https://your-rag-backend.onrender.com/health"
}

# Main deployment flow
main() {
    print_header "🌐 RAG System Production Deployment"
    print_header "===================================="
    echo ""
    
    check_prerequisites
    
    # Ask user what to deploy
    echo "What would you like to deploy?"
    echo "1) Backend only (Render)"
    echo "2) Frontend only (Netlify)"
    echo "3) Both backend and frontend"
    echo "4) Verify existing deployment"
    echo ""
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            deploy_backend
            ;;
        2)
            deploy_frontend
            ;;
        3)
            deploy_backend
            deploy_frontend
            ;;
        4)
            verify_deployment
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    if [ "$choice" != "4" ]; then
        verify_deployment
    fi
    
    show_summary
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"