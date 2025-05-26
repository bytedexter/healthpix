#!/bin/bash

# Hostinger VPS Deployment Script for HealthPix

echo "🚀 Starting HealthPix deployment on Hostinger VPS..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker and Docker Compose
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

echo "🐳 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install MongoDB
echo "🍃 Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx (backup web server)
echo "🌐 Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2 for Node.js process management
echo "⚙️ Installing PM2..."
sudo npm install -g pm2

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/healthpix
sudo chown -R $USER:$USER /var/www/healthpix

echo "✅ VPS setup complete!"
echo ""
echo "Next steps:"
echo "1. Upload your application code to /var/www/healthpix"
echo "2. Copy .env.example to .env and configure your environment variables"
echo "3. Run 'docker-compose up -d' in the application directory"
echo "4. Configure your domain to point to this VPS"
echo ""
echo "🎉 Your VPS is ready for HealthPix deployment!"
