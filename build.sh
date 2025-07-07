#!/bin/bash

# Render Build Script for MapStory Creator

set -e

echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the React application
echo "🔨 Building React application..."
npm run build

# Verify build output
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📊 Build statistics:"
    du -sh dist/
    ls -la dist/
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "🎉 Build process completed!" 