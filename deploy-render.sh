#!/bin/bash

# Render Deployment Preparation Script
# This script prepares your MapStory Creator for Render deployment

set -e

echo "🚀 Preparing MapStory Creator for Render deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if we're in a git repository
if [ ! -d .git ]; then
    print_error "This is not a git repository. Please run 'git init' first."
    exit 1
fi

print_status "Git repository detected"

# Check if package.json exists
if [ ! -f package.json ]; then
    print_error "package.json not found!"
    exit 1
fi

print_status "package.json found"

# Test build locally
print_status "Testing build process..."
if npm run build; then
    print_status "Build test successful"
else
    print_error "Build test failed. Please fix build issues before deploying."
    exit 1
fi

# Check for required files
required_files=("server.js" "package.json" "env.example")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file exists"
    else
        print_error "$file is missing!"
        exit 1
    fi
done

# Generate a sample JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Create deployment checklist
cat > RENDER_CHECKLIST.md << EOF
# Render Deployment Checklist for MapStory Creator

## Before Deployment
- [x] Code tested locally
- [x] Build process verified
- [x] Required files present

## Render Setup Required

### 1. Environment Variables to Set in Render:
\`\`\`
NODE_ENV=production
DATABASE_URL=[Get from your PostgreSQL service]
JWT_SECRET=$JWT_SECRET
VITE_GOOGLE_MAPS_API_KEY=[Your Google Maps API key]
\`\`\`

### 2. Service Configuration:
- **Build Command**: \`npm ci && npm run build\`
- **Start Command**: \`npm start\`
- **Health Check Path**: \`/api/maps\`
- **Port**: 10000 (auto-detected)

### 3. Database Setup:
- Create PostgreSQL service first
- Copy Internal Database URL to web service
- Run \`npm run seed:prod\` in Render shell after deployment

## Post-Deployment
- [ ] Test application functionality
- [ ] Verify Google Maps integration
- [ ] Test user registration/login
- [ ] Check database operations

## Your Generated JWT Secret:
\`$JWT_SECRET\`

**⚠️ Important**: Save this JWT secret securely and add it to your Render environment variables.
EOF

print_status "Created RENDER_CHECKLIST.md with your deployment details"

# Add and commit changes
if git diff --quiet && git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    print_status "Committing changes for deployment..."
    git add .
    git commit -m "Prepare for Render deployment

- Add Render configuration files
- Update server for Render compatibility
- Add deployment documentation"
    print_status "Changes committed"
fi

# Check git remote
if git remote get-url origin &> /dev/null; then
    REPO_URL=$(git remote get-url origin)
    print_status "Git remote configured: $REPO_URL"
    
    print_warning "Ready to push to GitHub? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        git push origin main
        print_status "Code pushed to GitHub"
    else
        print_warning "Remember to push your code: git push origin main"
    fi
else
    print_error "No git remote configured. Please add your GitHub repository:"
    echo "git remote add origin https://github.com/yourusername/mapstory.git"
    exit 1
fi

echo
echo "🎉 Render deployment preparation complete!"
echo
echo "📋 Next Steps:"
echo "1. Go to https://render.com and create an account"
echo "2. Create a PostgreSQL database service"
echo "3. Create a Web Service connected to your GitHub repository"
echo "4. Set the environment variables from RENDER_CHECKLIST.md"
echo "5. Deploy and initialize your database"
echo
echo "📖 Full guide: See RENDER_DEPLOYMENT.md"
echo "✅ Checklist: See RENDER_CHECKLIST.md"
echo
echo "🌐 Your app will be available at: https://your-app-name.onrender.com" 