#!/bin/bash

# Simple deployment script for HealthPix on Hostinger VPS

echo "🚀 Deploying HealthPix (Simple Mode)..."

# Install dependencies for backend
echo "📦 Installing backend dependencies..."
cd /var/www/healthpix/backend
npm install --production

# Build and setup frontend
echo "🏗️ Building frontend..."
cd /var/www/healthpix/frontend
npm install
npm run build

# Copy built frontend to Nginx
sudo cp -r dist/* /var/www/html/

# Configure Nginx for React Router
sudo tee /etc/nginx/sites-available/healthpix << EOF
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/healthpix /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Start backend with PM2
echo "🔄 Starting backend with PM2..."
cd /var/www/healthpix/backend
pm2 start index.js --name "healthpix-backend"
pm2 startup
pm2 save

echo "✅ Deployment complete!"
echo "Your app should be available at http://your-domain.com"
