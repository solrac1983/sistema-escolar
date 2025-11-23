#!/bin/bash

# School Management System - Auto Installer
# Usage: curl -sL https://raw.githubusercontent.com/solrac1983/sistema-escolar/main/deploy/install.sh | sudo bash

set -e

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}=== School Management System Installer ===${NC}"

# 1. Gather Information
read -p "Enter your domain name (e.g., escola.com.br): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Error: Domain and Email are required."
    exit 1
fi

echo -e "${GREEN}--- Updating System ---${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}--- Installing Dependencies ---${NC}"
# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs nginx git certbot python3-certbot-nginx

# PM2
npm install -g pm2

echo -e "${GREEN}--- Setting up Application ---${NC}"
APP_DIR="/var/www/sistema-escolar"

if [ -d "$APP_DIR" ]; then
    echo "Directory exists. Pulling latest changes..."
    cd $APP_DIR
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/solrac1983/sistema-escolar.git $APP_DIR
    cd $APP_DIR
fi

echo -e "${GREEN}--- Installing & Building ---${NC}"
npm install
npm run build
npx prisma generate

# Create .env if not exists (Basic setup)
if [ ! -f .env ]; then
    echo "Creating default .env..."
    echo "DATABASE_URL=\"file:./dev.db\"" > .env # Default to SQLite for ease, or prompt? User likely needs Postgres.
    echo "JWT_SECRET=\"$(openssl rand -hex 32)\"" >> .env
    echo "PORT=3000" >> .env
    echo "VITE_API_URL=\"https://$DOMAIN/api\"" >> .env
    echo "Warning: Using default SQLite/Env settings. Please configure .env for production DB."
fi

echo -e "${GREEN}--- Starting Backend ---${NC}"
pm2 delete sistema-escolar 2>/dev/null || true
pm2 start server.js --name "sistema-escolar"
pm2 save
pm2 startup | bash || true # Silently try to startup

echo -e "${GREEN}--- Configuring Nginx ---${NC}"
cat > /etc/nginx/sites-available/sistema-escolar <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        root $APP_DIR/app/frontend/dist; # Adjusted path based on structure
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
rm -f /etc/nginx/sites-enabled/default
nginx -t
service nginx restart

echo -e "${GREEN}--- Configuring SSL ---${NC}"
certbot --nginx --non-interactive --agree-tos --email $EMAIL -d $DOMAIN --redirect

echo -e "${GREEN}=== Installation Complete! ===${NC}"
echo "Access your system at: https://$DOMAIN"
