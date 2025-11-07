#!/bin/bash

# Docker Install Script for Ubuntu
# Works on Ubuntu 18 / 20 / 22 / 24

echo "🔄 Updating system packages..."
sudo apt update -y
sudo apt upgrade -y

echo "📦 Installing required dependencies..."
sudo apt install ca-certificates curl gnupg lsb-release -y

echo "🔑 Adding Docker GPG key..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo "📁 Adding Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "♻️ Updating package index..."
sudo apt update -y

echo "🐳 Installing Docker..."
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

echo "🔧 Enabling and starting Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

echo "👤 Adding current user to Docker group..."
sudo usermod -aG docker $USER

echo "✅ Docker Installed Successfully!"
echo "⚠️ Please log out and log back in (or run: newgrp docker)"
docker --version
docker compose version
