#!/bin/bash

# Start the backend
cd backend
node index.js &

# Start the frontend
cd ../frontend
npm run dev
