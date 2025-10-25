#!/bin/bash

# Trading App Setup Script

echo "🚀 Setting up Trading Application..."
echo ""

# Check if parent directory has lightweight-charts built
if [ ! -d "../dist" ]; then
    echo "📦 Building Lightweight Charts library..."
    cd ..
    npm install
    npm run build
    cd trading-app
    echo "✅ Lightweight Charts built successfully"
else
    echo "✅ Lightweight Charts already built"
fi

echo ""
echo "📦 Installing Trading App dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "The app will open at http://localhost:3000"
echo ""

