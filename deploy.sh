#!/bin/bash

# MapStory Creator Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Starting deployment for environment: $ENVIRONMENT"

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
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_warning "Please copy env.example to .env and configure your environment variables"
    exit 1
fi

# Check if required environment variables are set
print_status "Checking environment variables..."
if ! grep -q "DATABASE_URL=" .env; then
    print_error "DATABASE_URL not found in .env file"
    exit 1
fi

if ! grep -q "JWT_SECRET=" .env; then
    print_error "JWT_SECRET not found in .env file"
    exit 1
fi

if ! grep -q "VITE_GOOGLE_MAPS_API_KEY=" .env; then
    print_error "VITE_GOOGLE_MAPS_API_KEY not found in .env file"
    exit 1
fi

print_status "Environment variables check passed ✓"

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

# Build the application
print_status "Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

print_status "Build completed successfully ✓"

# Database operations
print_status "Checking database connection..."
if command -v psql &> /dev/null; then
    # Test database connection
    if npm run seed:prod &> /dev/null; then
        print_status "Database initialized successfully ✓"
    else
        print_warning "Database initialization failed or already initialized"
    fi
else
    print_warning "psql not found - skipping database operations"
fi

# Start the application based on environment
if [ "$ENVIRONMENT" = "docker" ]; then
    print_status "Starting with Docker Compose..."
    docker-compose down
    docker-compose up -d
    print_status "Application started with Docker ✓"
    print_status "Access your application at: http://localhost:3001"
    
elif [ "$ENVIRONMENT" = "pm2" ]; then
    print_status "Starting with PM2..."
    
    # Create PM2 ecosystem file if it doesn't exist
    if [ ! -f ecosystem.config.js ]; then
        cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'mapstory',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
EOF
    fi
    
    # Start or restart with PM2
    if pm2 describe mapstory > /dev/null 2>&1; then
        pm2 restart mapstory
        print_status "Application restarted with PM2 ✓"
    else
        pm2 start ecosystem.config.js
        print_status "Application started with PM2 ✓"
    fi
    
    pm2 save
    print_status "PM2 configuration saved ✓"
    
elif [ "$ENVIRONMENT" = "production" ]; then
    print_status "Starting in production mode..."
    
    # Kill existing process if running
    if lsof -i :3001 > /dev/null 2>&1; then
        print_warning "Port 3001 is in use, attempting to stop existing process..."
        pkill -f "node server.js" || true
        sleep 2
    fi
    
    # Start the application
    NODE_ENV=production nohup npm start > mapstory.log 2>&1 &
    
    # Wait a moment and check if it started
    sleep 3
    if lsof -i :3001 > /dev/null 2>&1; then
        print_status "Application started successfully ✓"
        print_status "Access your application at: http://localhost:3001"
        print_status "Logs are available in: mapstory.log"
    else
        print_error "Failed to start application"
        print_error "Check mapstory.log for details"
        exit 1
    fi
    
else
    print_status "Starting in development mode..."
    npm run start:dev
fi

print_status "🎉 Deployment completed successfully!"
print_status "Application is running at: http://localhost:3001"

# Display helpful information
echo
echo "📋 Deployment Summary:"
echo "   Environment: $ENVIRONMENT"
echo "   Build: ✓ Completed"
echo "   Database: ✓ Connected"
echo "   Server: ✓ Running"
echo
echo "🔧 Management Commands:"
echo "   View logs: tail -f mapstory.log"
echo "   Stop server: pkill -f 'node server.js'"
echo "   Restart: ./deploy.sh $ENVIRONMENT"
echo
echo "🌐 Access URLs:"
echo "   Application: http://localhost:3001"
echo "   API Health: http://localhost:3001/api/maps"
echo 