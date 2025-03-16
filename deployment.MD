# Deployment Guide for Shopify Headless Checkout

This guide provides detailed instructions for deploying the Shopify Headless Checkout application on a Linux server.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Linux server (Ubuntu 20.04 LTS or newer recommended)
- Domain name with SSL certificate
- Shopify Partner account
- Google OAuth credentials

## Step 1: Server Setup

1. Update server packages:
```bash
sudo apt update && sudo apt upgrade -y
```

2. Install Node.js and npm:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

3. Install PM2 for process management:
```bash
sudo npm install -g pm2
```

4. Install Nginx:
```bash
sudo apt install nginx -y
```

## Step 2: Application Setup

1. Clone the repository:
```bash
git clone [your-repository-url]
cd shopify-headless-checkout
```

2. Install dependencies:
```bash
npm install
```

3. Create production build:
```bash
npm run build
```

## Step 3: Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=production
PORT=3000

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-generated-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Shopify
SHOPIFY_SHOP_NAME=your-shop-name.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-shopify-access-token
SHOPIFY_STOREFRONT_TOKEN=your-storefront-token
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret

# Analytics (Optional)
SEGMENT_WRITE_KEY=your-segment-write-key
```

To generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 4: Nginx Configuration

1. Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/shopify-headless
```

2. Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/certificate.pem;
    ssl_certificate_key /path/to/your/private.key;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/shopify-headless /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: Application Deployment

1. Start the application with PM2:
```bash
pm2 start npm --name "shopify-headless" -- start
pm2 save
```

2. Configure PM2 startup:
```bash
pm2 startup
```

## Step 6: Security Setup

1. Configure firewall:
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

2. Set up SSL certificate with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Docker Deployment

This section covers deploying the application using Docker and Docker Compose.

### Prerequisites for Docker Deployment

- Docker Engine >= 24.0.0
- Docker Compose >= 2.20.0
- Git
- Domain name with SSL certificate

### Step 1: Create Docker Configuration

1. Create a `Dockerfile` in the root directory:
```dockerfile
# Base image
FROM node:18-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

2. Create a `docker-compose.yml` file:
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: runner
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - app

  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    command: certonly --webroot -w /var/www/certbot --force-renewal --email your-email@domain.com -d your-domain.com --agree-tos

volumes:
  certbot-etc:
  certbot-var:

networks:
  default:
    name: shopify-headless-network
    driver: bridge
```

3. Create a `nginx.conf` file:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Proxy configuration
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_set_header Connection "upgrade";
    }

    # Static file caching
    location /_next/static {
        proxy_pass http://app:3000;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header Host $host;
        expires 365d;
        add_header Cache-Control "public, no-transform";
    }

    # Gzip compression
    gzip on;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_comp_level 6;
    gzip_min_length 1000;
}
```

### Step 2: Update Next.js Configuration

1. Update `next.config.js` to support Docker:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... rest of your existing configuration
}

module.exports = nextConfig;
```

### Step 3: Docker Deployment Steps

1. Build and start the containers:
```bash
docker compose up -d --build
```

2. Initialize SSL certificates:
```bash
docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d your-domain.com
```

3. Verify the deployment:
```bash
docker compose ps
docker compose logs -f
```

### Step 4: Docker Maintenance

1. Update the application:
```bash
git pull
docker compose build
docker compose up -d
```

2. View logs:
```bash
# All containers
docker compose logs -f

# Specific container
docker compose logs -f app
```

3. Container management:
```bash
# Restart containers
docker compose restart

# Stop containers
docker compose down

# Remove containers and volumes
docker compose down -v
```

4. Backup Docker volumes:
```bash
# Create backup directory
mkdir -p backups

# Backup volumes
docker run --rm \
  -v shopify-headless_certbot-etc:/source:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/certbot-etc-$(date +%Y%m%d).tar.gz -C /source .
```

### Step 5: Docker Health Monitoring

1. Check container health:
```bash
docker compose ps
docker stats
```

2. Monitor resource usage:
```bash
# Install ctop for container monitoring
docker run --rm -ti \
  --name=ctop \
  --volume /var/run/docker.sock:/var/run/docker.sock:ro \
  quay.io/vektorlab/ctop:latest
```

3. Set up container alerts:
```bash
# Install prometheus and grafana for monitoring
docker compose -f docker-compose.monitoring.yml up -d
```

### Step 6: Docker Security Best Practices

1. Scan container images:
```bash
docker scan shopify-headless-app
```

2. Update base images:
```bash
docker compose pull
docker compose up -d
```

3. Limit container resources:
```yaml
# Add to docker-compose.yml services
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Troubleshooting Docker Deployment

1. Check container status:
```bash
docker compose ps
```

2. View container logs:
```bash
docker compose logs -f [service-name]
```

3. Access container shell:
```bash
docker compose exec app sh
```

4. Check nginx configuration:
```bash
docker compose exec nginx nginx -t
```

5. Verify SSL certificates:
```bash
docker compose exec nginx openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout
```

## Main Application Routes

- `/` - Homepage/Landing page
- `/login` - Authentication page (Google OAuth)
- `/dashboard` - Main dashboard (requires authentication)
- `/unauthorized` - Access denied page
- `/api/auth/*` - Authentication endpoints
- `/api/webhooks/*` - Shopify webhook endpoints

## Access Control

- Only users with @zyg.com email addresses can access the dashboard
- All routes under `/dashboard/*` require authentication
- API routes are protected with appropriate middleware

## Monitoring and Maintenance

1. View application logs:
```bash
pm2 logs shopify-headless
```

2. Monitor application status:
```bash
pm2 status
```

3. Update application:
```bash
git pull
npm install
npm run build
pm2 restart shopify-headless
```

## Troubleshooting

1. Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

2. Check application logs:
```bash
pm2 logs shopify-headless
```

3. Verify environment variables:
```bash
pm2 env shopify-headless
```

4. Test Nginx configuration:
```bash
sudo nginx -t
```

## Backup and Recovery

1. Database backups (if applicable):
```bash
# Set up automated backups for your database
```

2. Environment backup:
```bash
cp .env .env.backup
```

3. Application backup:
```bash
tar -czf backup.tar.gz .next node_modules package.json package-lock.json .env
```

## Performance Optimization

1. Enable Gzip compression in Nginx:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

2. Configure browser caching:
```nginx
location /_next/static {
    expires 1y;
    add_header Cache-Control "public, no-transform";
}
```

## Health Checks

Set up monitoring for:
- Server uptime
- Application status
- SSL certificate expiration
- Memory usage
- CPU usage
- Disk space

## Security Best Practices

1. Regular updates:
```bash
sudo apt update && sudo apt upgrade -y
npm audit
npm update
```

2. Configure rate limiting in Nginx:
```nginx
limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;
location /api {
    limit_req zone=one burst=5;
}
```

## Support and Contact

For support issues:
1. Check application logs
2. Review error monitoring system
3. Contact system administrator
4. Review GitHub issues 