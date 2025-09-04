#!/bin/bash

# 🚀 URL Shortener Auto Setup Script
# This script helps users who fork this repository to set up everything automatically

echo "🚀 Welcome to URL Shortener Setup!"
echo "This script will help you configure your forked repository."
echo ""

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📋 Step $1:${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Get repository information
echo "🔍 Detecting repository information..."
REPO_URL=$(git remote get-url origin 2>/dev/null)
if [[ $REPO_URL == *"github.com"* ]]; then
    # Extract owner and repo name
    REPO_INFO=$(echo $REPO_URL | sed -n 's/.*github\.com[:/]\([^/]*\)\/\([^/.]*\)\.git.*/\1\/\2/p')
    if [[ -z "$REPO_INFO" ]]; then
        REPO_INFO=$(echo $REPO_URL | sed -n 's/.*github\.com[:/]\([^/]*\)\/\([^/]*\).*/\1\/\2/p')
    fi
    REPO_OWNER=$(echo $REPO_INFO | cut -d'/' -f1)
    REPO_NAME=$(echo $REPO_INFO | cut -d'/' -f2)
    print_success "Detected repository: $REPO_INFO"
else
    print_error "Could not detect GitHub repository. Please ensure you're in a GitHub repository."
    exit 1
fi

echo ""
print_step "1" "Setting up environment variables"

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    print_success "Created .env.local from .env.example"
else
    print_warning ".env.local already exists, skipping creation"
fi

echo ""
print_step "2" "Updating repository configuration in code"

# Update repository configuration in the code
echo "🔧 Updating repository references to: $REPO_INFO"

# Update GitHub API endpoints
if [ -f "app/api/github-sync/route.ts" ]; then
    sed -i "s|const GITHUB_REPO = '.*';|const GITHUB_REPO = '$REPO_INFO';|g" app/api/github-sync/route.ts
    print_success "Updated app/api/github-sync/route.ts"
fi

if [ -f "lib/github.ts" ]; then
    sed -i "s|https://api.github.com/repos/.*/dispatches|https://api.github.com/repos/$REPO_INFO/dispatches|g" lib/github.ts
    print_success "Updated lib/github.ts"
fi

echo ""
print_step "3" "Environment configuration guide"

echo "📝 Please configure the following environment variables in .env.local:"
echo ""
echo "1. TURSO_DATABASE_URL - Your Turso database URL"
echo "   → Get this from: https://turso.tech/"
echo ""
echo "2. TURSO_AUTH_TOKEN - Your Turso authentication token"
echo "   → Get this from: https://turso.tech/"
echo ""
echo "3. GITHUB_TOKEN - Your GitHub Personal Access Token"
echo "   → Create at: https://github.com/settings/tokens"
echo "   → Required permissions: repo, workflow"
echo ""
echo "4. ADMIN_PASSWORD - Your admin panel password"
echo "   → Set any secure password you prefer"
echo ""

echo ""
print_step "4" "GitHub repository secrets setup"

echo "🔐 Please add the following secrets to your GitHub repository:"
echo "   → Go to: https://github.com/$REPO_INFO/settings/secrets/actions"
echo ""
echo "Required secrets:"
echo "  • TURSO_DATABASE_URL"
echo "  • TURSO_AUTH_TOKEN"
echo "  • GITHUB_TOKEN (optional, can use default)"
echo ""

echo ""
print_step "5" "Installation and deployment"

echo "📦 Installing dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install
    print_success "Dependencies installed with pnpm"
elif command -v npm &> /dev/null; then
    npm install
    print_success "Dependencies installed with npm"
else
    print_error "Neither pnpm nor npm found. Please install Node.js and npm/pnpm first."
    exit 1
fi

echo ""
print_step "6" "Database setup"

echo "🗄️ Setting up database..."
if [ -f "scripts/seed-data.js" ]; then
    echo "Run this command after setting up your environment variables:"
    echo "  pnpm run seed  # or npm run seed"
    print_warning "Make sure to configure TURSO_* variables first!"
fi

echo ""
print_step "7" "Deployment options"

echo "🚀 Deploy your URL shortener:"
echo ""
echo "Option 1 - Vercel (Recommended):"
echo "  1. Visit: https://vercel.com/new"
echo "  2. Import your repository: $REPO_INFO"
echo "  3. Add environment variables in Vercel dashboard"
echo "  4. Deploy!"
echo ""
echo "Option 2 - Other platforms:"
echo "  • Netlify: https://netlify.com"
echo "  • Railway: https://railway.app"
echo "  • Render: https://render.com"
echo ""

echo ""
print_step "8" "Optional: GitHub webhook setup"

echo "🔗 For bi-directional sync, set up GitHub webhook:"
echo "  1. Go to: https://github.com/$REPO_INFO/settings/hooks"
echo "  2. Add webhook:"
echo "     • Payload URL: https://your-domain.com/api/github-sync"
echo "     • Content type: application/json"
echo "     • Events: Push events"
echo ""

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. ✏️  Edit .env.local with your actual values"
echo "2. 🗄️  Run: pnpm run seed (after env setup)"
echo "3. 🚀 Deploy to Vercel or your preferred platform"
echo "4. 🔧 Add GitHub repository secrets"
echo "5. 🧪 Test the sync functionality"
echo ""
echo "📚 For detailed documentation, check:"
echo "  • README.md"
echo "  • GITHUB_SYNC_SETUP.md"
echo ""
echo "🆘 Need help? Check the troubleshooting section in GITHUB_SYNC_SETUP.md"
echo ""
print_success "Happy URL shortening! 🎯"
