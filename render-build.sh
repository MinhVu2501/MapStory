#!/bin/bash

# Render Build Script for MapStory Creator
echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the React frontend
echo "🔨 Building React frontend..."
npm run build

# Verify build output
echo "✅ Checking build output..."
if [ -d "dist" ]; then
  echo "✅ Build successful! dist/ directory created."
  ls -la dist/
else
  echo "❌ Build failed! dist/ directory not found."
  exit 1
fi

echo "🎉 Build completed successfully!" 