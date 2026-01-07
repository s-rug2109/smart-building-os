@echo off
REM Smart Building OS - Development Environment Setup Script (Windows)
REM Usage: setup-dev.bat

echo 🏗️  Smart Building OS - Development Setup
echo ========================================

REM Check Node.js
echo 📋 Checking prerequisites...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected
for /f "tokens=1 delims=v" %%i in ('node -v') do set NODE_VERSION=%%i

REM Check AWS CLI
aws --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  AWS CLI not found. Some features may not work.
) else (
    echo ✅ AWS CLI detected
)

REM Install dependencies
echo.
echo 📦 Installing dependencies...
npm install

REM Create environment file
if not exist ".env" (
    echo.
    echo 🔧 Creating environment configuration...
    (
        echo # Smart Building OS - Environment Configuration
        echo VITE_API_REST_URL=https://dq7i2u9882.execute-api.ap-northeast-1.amazonaws.com/v1
        echo VITE_API_WS_URL=wss://373x5ueep5.execute-api.ap-northeast-1.amazonaws.com/v1
    ) > .env
    echo ✅ Environment file created (.env^)
) else (
    echo ✅ Environment file already exists
)

REM Create VS Code settings
echo.
echo 🔧 Setting up VS Code configuration...
if not exist ".vscode" mkdir .vscode

(
    echo {
    echo   "typescript.preferences.importModuleSpecifier": "relative",
    echo   "editor.formatOnSave": true,
    echo   "editor.codeActionsOnSave": {
    echo     "source.fixAll.eslint": true
    echo   },
    echo   "files.associations": {
    echo     "*.tsx": "typescriptreact",
    echo     "*.ts": "typescript"
    echo   }
    echo }
) > .vscode\settings.json

echo ✅ VS Code configuration created

REM Test build
echo.
echo 🧪 Testing build process...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Build test failed
    pause
    exit /b 1
)

echo ✅ Build test successful

REM Display project info
echo.
echo 📊 Project Information
echo ======================
echo Name: Smart Building OS
echo Framework: React + TypeScript + Vite
echo UI Library: MUI v6
echo.

echo 🚀 Setup Complete!
echo ==================
echo.
echo Next steps:
echo 1. Start development server: npm run dev
echo 2. Open browser: http://localhost:5173
echo 3. Check PROJECT_STATUS.md for detailed information
echo.
echo AWS Resources:
echo - TwinMaker Workspace: smart-building-data-model-auto-generat-twinmaker
echo - Region: ap-northeast-1 (Tokyo)
echo.
echo Happy coding! 🎉
pause