#!/bin/bash

# Cleanup Script - Removes the School Management System
# Usage: curl -sL https://raw.githubusercontent.com/solrac1983/sistema-escolar/main/deploy/cleanup.sh | sudo bash

echo "--- Cleaning up School Management System ---"

# 1. Stop and Delete PM2 Process
if command -v pm2 &> /dev/null; then
    echo "Stopping PM2 process..."
    pm2 delete sistema-escolar 2>/dev/null || true
    pm2 save
fi

# 2. Remove Application Directory
if [ -d "/var/www/sistema-escolar" ]; then
    echo "Removing application files..."
    rm -rf /var/www/sistema-escolar
fi

# 3. Remove Nginx Configuration
echo "Removing Nginx configuration..."
rm -f /etc/nginx/sites-available/sistema-escolar
rm -f /etc/nginx/sites-enabled/sistema-escolar

# 4. Restart Nginx
echo "Restarting Nginx..."
service nginx restart

echo "--- Cleanup Complete! ---"
echo "You can now run the install script again."
