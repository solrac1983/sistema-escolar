#!/bin/bash

# VPS Setup Script for School Management System
# Usage: sudo ./setup_vps.sh

set -e # Exit on error

echo "--- Updating System ---"
apt update && apt upgrade -y

echo "--- Installing Node.js 18 ---"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

echo "--- Installing Global Dependencies (PM2) ---"
npm install -g pm2

echo "--- Installing Nginx ---"
apt install -y nginx

echo "--- Installing Git ---"
apt install -y git

echo "--- Setup Complete! ---"
echo "Node Version: $(node -v)"
echo "NPM Version: $(npm -v)"
echo "PM2 Version: $(pm2 -v)"
