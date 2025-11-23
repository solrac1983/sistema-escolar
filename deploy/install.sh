#!/bin/bash

# School Management System - Auto Installer
# Usage: curl -sL https://raw.githubusercontent.com/solrac1983/sistema-escolar/main/deploy/install.sh | sudo bash -s -- <DOMAIN> <EMAIL>

set -e

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}=== School Management System Installer ===${NC}"

# 1. Gather Information
DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ]; then
    read -p "Enter your domain name (e.g., escola.com.br): " DOMAIN
fi

if [ -z "$EMAIL" ]; then
    read -p "Enter your email for SSL certificate: " EMAIL
fi

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Error: Domain and Email are required."
    exit 1
fi

echo -e "${GREEN}--- Updating System ---${NC}"
apt update && apt upgrade -y
apt install -y curl gnupg git nginx certbot python3-certbot-nginx build-essential

echo -e "${GREEN}--- Installing Node.js 18 ---${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo -e "${GREEN}--- Installing PM2 ---${NC}"
npm install -g pm2

echo -e "${GREEN}--- Setting up Application ---${NC}"
APP_DIR="/var/www/sistema-escolar"

# Remove existing directory if it exists to ensure fresh install
if [ -d "$APP_DIR" ]; then
    echo "Removing existing directory for fresh install..."
    rm -rf "$APP_DIR"
fi

echo "Cloning repository..."
git clone https://github.com/solrac1983/sistema-escolar.git $APP_DIR
cd $APP_DIR

echo -e "${GREEN}--- Installing & Building ---${NC}"
npm install
npx prisma generate
npm run build

# Create .env
echo "Creating .env file..."
cat > .env <<EOF
DATABASE_URL="file:./dev.db"
JWT_SECRET="$(openssl rand -hex 32)"
PORT=3000
VITE_API_URL="https://$DOMAIN/api"
EOF

echo -e "${GREEN}--- Starting Backend ---${NC}"
pm2 delete sistema-escolar 2>/dev/null || true
pm2 start server.js --name "sistema-escolar"
pm2 save
pm2 startup | bash || true

echo -e "${GREEN}--- Configuring Nginx ---${NC}"
# Remove default config to avoid "Welcome to nginx"
rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/sistema-escolar <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        root $APP_DIR/app/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/sistema-escolar /etc/nginx/sites-enabled/
nginx -t
service nginx restart

echo -e "${GREEN}--- Configuring SSL ---${NC}"
certbot --nginx --non-interactive --agree-tos --email $EMAIL -d $DOMAIN --redirect

echo -e "${GREEN}=== Installation Complete! ===${NC}"
echo "Access your system at: https://$DOMAIN"
