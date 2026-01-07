#!/bin/bash

# Smart Building OS - Development Environment Setup Script
# Usage: ./setup-dev.sh

echo "🏗️  Smart Building OS - Development Setup"
echo "========================================"

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI not found. Some features may not work."
else
    echo "✅ AWS CLI detected"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "🔧 Creating environment configuration..."
    cat > .env << EOF
# Smart Building OS - Environment Configuration
VITE_API_REST_URL=https://dq7i2u9882.execute-api.ap-northeast-1.amazonaws.com/v1
VITE_API_WS_URL=wss://373x5ueep5.execute-api.ap-northeast-1.amazonaws.com/v1
EOF
    echo "✅ Environment file created (.env)"
else
    echo "✅ Environment file already exists"
fi

# Create VS Code settings
echo ""
echo "🔧 Setting up VS Code configuration..."
mkdir -p .vscode

cat > .vscode/settings.json << EOF
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.tsx": "typescriptreact",
    "*.ts": "typescript"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
EOF

cat > .vscode/extensions.json << EOF
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "amazonwebservices.aws-toolkit-vscode"
  ]
}
EOF

echo "✅ VS Code configuration created"

# Test build
echo ""
echo "🧪 Testing build process..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build test successful"
else
    echo "❌ Build test failed"
    exit 1
fi

# Display project info
echo ""
echo "📊 Project Information"
echo "======================"
echo "Name: Smart Building OS"
echo "Version: $(node -p "require('./package.json').version")"
echo "Framework: React + TypeScript + Vite"
echo "UI Library: MUI v6"
echo ""

echo "🚀 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Start development server: npm run dev"
echo "2. Open browser: http://localhost:5173"
echo "3. Check PROJECT_STATUS.md for detailed information"
echo ""
echo "AWS Resources:"
echo "- TwinMaker Workspace: smart-building-data-model-auto-generat-twinmaker"
echo "- Region: ap-northeast-1 (Tokyo)"
echo ""
echo "Happy coding! 🎉"