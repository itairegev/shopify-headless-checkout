#!/bin/bash

# Create required directories
mkdir -p nginx/conf.d
mkdir -p nginx/cache
mkdir -p certbot/conf
mkdir -p certbot/www

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
# Application
NODE_ENV=production
PORT=3000

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Shopify
SHOPIFY_SHOP_NAME=your-shop-name.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-shopify-access-token
SHOPIFY_STOREFRONT_TOKEN=your-storefront-token
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret

# Analytics (Optional)
SEGMENT_WRITE_KEY=your-segment-write-key
EOL
    echo ".env file created. Please update it with your actual values."
fi

# Start containers
echo "Starting Docker containers..."
docker compose up -d

# Wait for nginx to start
echo "Waiting for nginx to start..."
sleep 10

# Get domain name
read -p "Enter your domain name (e.g., example.com): " DOMAIN

# Update nginx configuration with domain name
sed -i "s/your-domain.com/$DOMAIN/g" nginx/conf.d/default.conf

# Generate SSL certificate
echo "Generating SSL certificate for $DOMAIN..."
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email admin@$DOMAIN \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Restart nginx to apply SSL configuration
echo "Restarting nginx..."
docker compose restart nginx

echo "Setup complete! Your application should now be running at https://$DOMAIN"
echo "Please ensure your DNS records are properly configured to point to this server." 