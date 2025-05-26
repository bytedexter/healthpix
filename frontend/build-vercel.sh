#!/bin/bash

# Vercel build script to handle Rollup binary issues
echo "Starting Vercel build process..."

# Clean any existing modules
rm -rf node_modules package-lock.json

# Install dependencies without optional packages first
npm install --no-optional --force

# Manually install the missing Rollup binary
npm install @rollup/rollup-linux-x64-gnu --no-save --force

# Run the build
npm run build

echo "Build completed successfully!"
