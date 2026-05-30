#!/bin/bash

# Exit on any error
set -e

echo "Starting deployment setup for KhataBook CRM and AI Assistant..."

# 1. Update and install dependencies
echo "Installing Node.js, npm, Python, and other dependencies..."
sudo apt update

# Install Node.js LTS (if not installed)
if ! command -v node > /dev/null; then
    echo "Node.js not found. Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js is already installed: $(node -v)"
fi

# Install Python and venv
echo "Ensuring Python3 and venv are installed..."
sudo apt install -y python3 python3-venv python3-pip

# Install PM2 globally
if ! command -v pm2 > /dev/null; then
    echo "Installing PM2 globally..."
    sudo npm install -g pm2
else
    echo "PM2 is already installed."
fi

# 2. Setup project directories
APP_DIR=$(pwd)
BACKEND_DIR="$APP_DIR/khatabook-api"
FRONTEND_DIR="$APP_DIR/khatabook-frontend"
AI_DIR="$APP_DIR/AIAssistant"

echo "Using application directory: $APP_DIR"

# 3. Build & Run Backend (NestJS)
echo "Setting up CRM Backend (NestJS)..."
cd "$BACKEND_DIR"

echo "Installing backend dependencies..."
npm install

echo "Generating Prisma Client..."
npx prisma generate

echo "Building backend..."
npm run build

echo "Starting backend with PM2 on port 3000..."
# Delete the old process first to ensure clean environment variables and settings
pm2 delete crm-backend || true
PORT=3000 pm2 start dist/main.js --name "crm-backend"

# 4. Setup & Run AI Assistant (FastAPI)
echo "Setting up AI Assistant (FastAPI)..."
cd "$AI_DIR"

echo "Creating Python virtual environment..."
python3 -m venv venv

echo "Installing Python dependencies..."
# Use the local venv's pip
./venv/bin/pip install -r requirements.txt

echo "Starting AI Assistant with PM2 on port 8000..."
pm2 delete ai-assistant || true
# Run uvicorn from the virtual environment
pm2 start ./venv/bin/python --name "ai-assistant" -- -m uvicorn main:app --host 127.0.0.1 --port 8000

# 5. Build & Run Frontend (Next.js)
echo "Setting up CRM Frontend (Next.js)..."
cd "$FRONTEND_DIR"

echo "Installing frontend dependencies..."
npm install

echo "Cleaning old Next.js build cache..."
rm -rf .next

echo "Building frontend..."
npm run build

echo "Starting frontend with PM2 on port 3001..."
# Delete the old process first to avoid duplicates or port binding issues
pm2 delete crm-frontend || true
pm2 start npm --name "crm-frontend" -- start -- -p 3001

# 6. Save PM2 configuration to run on startup
echo "Configuring PM2 to start on boot..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER || true
pm2 save

# 7. Configure Nginx Reverse Proxy for CRM & AI Assistant
echo "Configuring Nginx..."

cat <<EOF | sudo tee /etc/nginx/sites-available/crm
# CRM Frontend (Next.js)
server {
    listen 80;
    server_name app.miteklabs.tech;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # WebSocket support for Next.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# CRM Backend (NestJS)
server {
    listen 80;
    server_name api.miteklabs.tech;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# AI Assistant Backend (FastAPI)
server {
    listen 80;
    server_name ai.miteklabs.tech;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Important for streaming responses from LangGraph/Ollama if used
        proxy_buffering off;
        proxy_read_timeout 300;
    }
}
EOF

# 8. Enable Nginx Site and Restart
echo "Enabling Nginx configuration..."
sudo ln -sf /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/

echo "Testing Nginx configuration..."
sudo nginx -t

echo "Restarting Nginx..."
sudo systemctl restart nginx

# 9. Setup SSL with Let's Encrypt (Certbot)
echo "Setting up SSL for app, api, and ai subdomains..."

# Added ai.miteklabs.tech to the certbot command
sudo certbot --nginx -d app.miteklabs.tech -d api.miteklabs.tech -d ai.miteklabs.tech \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email \
    --redirect \
    --keep-until-expiring

echo "Deployment complete!"
echo "Next.js Frontend:   https://app.miteklabs.tech"
echo "NestJS Backend:     https://api.miteklabs.tech"
echo "FastAPI AI Service: https://ai.miteklabs.tech"
echo "Chatbot should remain unaffected at chatbot.miteklabs.tech"
