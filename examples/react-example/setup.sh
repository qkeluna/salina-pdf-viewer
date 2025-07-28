#!/bin/bash

# Setup script for React example with enhanced highlighting

echo "🚀 Setting up React example with enhanced PDF.js highlighting..."

# Step 1: Build the core package
echo "📦 Building core package..."
cd ../../packages/core

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "📦 Installing core package dependencies..."
    npm install
fi

npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build core package"
    echo "💡 Try running: cd packages/core && npm install && npm run build"
    exit 1
fi

echo "✅ Core package built successfully"

# Step 2: Install react-example dependencies
echo "📦 Installing React example dependencies..."
cd ../../examples/react-example
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install React example dependencies"
    exit 1
fi

echo "✅ React example dependencies installed"

# Step 3: Start the development server
echo ""
echo "🎉 Setup complete! Starting development server..."
echo ""
echo "🎯 Test the new PDF.js-style highlighting features:"
echo "   • Text layer search vs legacy search"
echo "   • Manual highlighting with browser selection"  
echo "   • Zoom-independent highlighting"
echo "   • Multi-color highlight management"
echo "   • Export/import functionality"
echo ""
echo "📖 See DEMO_GUIDE.md for comprehensive testing instructions"
echo "🌐 Opening http://localhost:5173"
echo ""

npm run dev