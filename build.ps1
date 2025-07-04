#!/usr/bin/env pwsh

# Salesforce Toolkit Build Script
# This script builds the Electron application for Windows

Write-Host "Building Salesforce Toolkit for Windows..." -ForegroundColor Green

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build the Electron main process
Write-Host "Building Electron main process..." -ForegroundColor Yellow
npx tsc electron/main.ts --outDir dist-electron --target ES2020 --module commonjs --moduleResolution node --esModuleInterop

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to build Electron main process" -ForegroundColor Red
    exit 1
}

# Build the Electron preload script
Write-Host "Building Electron preload script..." -ForegroundColor Yellow
npx tsc electron/preload.ts --outDir dist-electron --target ES2020 --module commonjs --moduleResolution node --esModuleInterop

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to build Electron preload script" -ForegroundColor Red
    exit 1
}

# Build the React application
Write-Host "Building React application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to build React application" -ForegroundColor Red
    exit 1
}

# Build the Electron application
Write-Host "Building Electron application..." -ForegroundColor Yellow
npm run build:win

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to build Electron application" -ForegroundColor Red
    exit 1
}

Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "The executable can be found in the 'dist-app' directory." -ForegroundColor Cyan