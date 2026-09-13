# Production Deployment Guide

## Backend/Frontend Separation Setup

This guide covers deploying your backend and frontend as separate services with proper security.

## Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 12+
- Redis 6+ (optional, for distributed caching/rate limiting)
- Docker (recommended for containerization)
- PM2 or similar for process management

## Deployment Scenarios

### Scenario 1: Monolithic (Same Origin)

**Best for:**
- Single domain deployment
- Small to medium projects
- Simpler DevOps setup
- Learning and development

**Setup:**
```bash
# No configuration needed
NEXT_PUBLIC_API_URL=""
NEXT_PUBLIC_ALLOWED_ORIGINS=""

# Everything runs on: https://yourdomain.com
# Frontend: https://yourdomain.com/
# API: https://yourdomain.com/api/v1/
```

**Deployment:**
```bash
# Build
pnpm build

# Start
pnpm start
```

---

### Scenario 2: Separate Frontend & Backend

**Best for:**
- Large projects
- Scaling frontend and backend independently
- Different deployment requirements
- Advanced DevOps setup

**Architecture:**
```
Frontend: https://app.yourdomain.com
Backend:  https://api.yourdomain.com
```

**Setup:**

#### Backend Service

1. **Create Dockerfile** (docker/Dockerfile.backend):
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Expose API port
EXPOSE 3001

# Start
ENV NODE_ENV=production
ENV PORT=3001
CMD ["pnpm", "start"]
```

2. **Environment variables** (.env.production - Backend):
```bash
# Backend runs on port 3001
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Database
DATABASE_URL=postgres://user:pass@postgres.example.com:5432/cognix

# Redis (for rate limiting & caching)
REDIS_URL=redis://redis.example.com:6379

# Auth
BETTER_AUTH_SECRET=<generate-with-cli>
BETTER_AUTH_URL=https://api.yourdomain.com

# CORS Configuration
NEXT_PUBLIC_ALLOWED_ORIGINS=https://app.yourdomain.com,https://yourdomain.com

# LLM Provider Keys
OPENAI_API_KEY=sk-...
# ... other provider keys
```

3. **Deploy Backend:**
```bash
# Using Docker
docker build -f docker/Dockerfile.backend -t cognix-backend:latest .
docker run -d \
  --name cognix-backend \
  --env-file .env.production \
  -p 3001:3001 \
  cognix-backend:latest

# Or using PM2
pm2 start pnpm --name "cognix-backend" -- start -- -p 3001
```

#### Frontend Service

1. **Create Dockerfile** (docker/Dockerfile.frontend):
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

2. **Environment variables** (.env.production - Frontend):
```bash
# Frontend runs on port 3000
NODE_ENV=production
PORT=3000

# Point to backend API
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ALLOWED_ORIGINS=https://app.yourdomain.com

# Auth
BETTER_AUTH_URL=https://api.yourdomain.com
```

3. **Deploy Frontend:**
```bash
# Using Docker
docker build -f docker/Dockerfile.frontend -t cognix-frontend:latest .
docker run -d \
  --name cognix-frontend \
  --env-file .env.production.frontend \
  -p 3000:3000 \
  cognix-frontend:latest

# Or using PM2
pm2 start pnpm --name "cognix-frontend" -- start -- -p 3000
```

#### Nginx Configuration

Set up reverse proxies:

```nginx
# /etc/nginx/sites-available/cognix.conf

upstream backend {
    server localhost:3001;
}

upstream frontend {
    server localhost:3000;
}

# Backend API
server {
    server_name api.yourdomain.com;
    listen 80;
    listen [::]:80;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    server_name api.yourdomain.com;
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # CORS handling
    add_header 'Access-Control-Allow-Origin' 'https://app.yourdomain.com' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization,X-CSRF-Token' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;

    # Preflight requests
    if ($request_method = 'OPTIONS') {
        return 204;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    server_name app.yourdomain.com yourdomain.com;
    listen 80;
    listen [::]:80;

    return 301 https://$server_name$request_uri;
}

server {
    server_name app.yourdomain.com yourdomain.com;
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.yourdomain.com;" always;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable configuration:
```bash
sudo ln -s /etc/nginx/sites-available/cognix.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Scenario 3: Docker Compose (Development/Staging)

**docker-compose.yml** (updated):
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: cognix
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: cognix
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: development
      PORT: 3001
      DATABASE_URL: postgres://cognix:changeme@postgres:5432/cognix
      REDIS_URL: redis://redis:6379
      BETTER_AUTH_SECRET: dev-secret-change-in-production
      BETTER_AUTH_URL: http://localhost:3001
      NEXT_PUBLIC_API_URL: http://localhost:3001
      NEXT_PUBLIC_ALLOWED_ORIGINS: http://localhost:3000
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
      NEXT_PUBLIC_API_URL: http://localhost:3001
      NEXT_PUBLIC_ALLOWED_ORIGINS: http://localhost:3000
      BETTER_AUTH_URL: http://localhost:3001
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
```

Run:
```bash
docker-compose -f docker/compose.yml up
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

---

## SSL/TLS Certificates

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificates
sudo certbot certonly --nginx -d yourdomain.com -d api.yourdomain.com -d app.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

---

## Database Backup

### PostgreSQL Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DATABASE_URL="postgres://user:pass@host/dbname"

mkdir -p $BACKUP_DIR

pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/cognix_$DATE.sql.gz

# Keep last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/cognix_$DATE.sql.gz s3://your-bucket/backups/
```

Add to crontab:
```bash
0 2 * * * /usr/local/bin/backup-postgres.sh
```

---

## Monitoring & Logging

### Using PM2 Plus (Recommended)

```bash
# Install PM2
npm install -g pm2

# Monitor
pm2 plus

# View logs
pm2 logs cognix-backend
pm2 logs cognix-frontend
```

### Using ELK Stack (Advanced)

```yaml
# docker-compose.yml additions
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node

  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
    # Configuration...

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
```

---

## Performance Optimization

1. **Enable Redis**
   ```bash
   REDIS_URL=redis://your-redis-host:6379
   ```

2. **Database Indexing**
   ```bash
   pnpm db:studio
   # Add indexes for frequently queried columns
   ```

3. **CDN for Static Assets**
   ```bash
   # Configure S3 + CloudFront for /public files
   FILE_STORAGE_TYPE=s3
   FILE_STORAGE_S3_PUBLIC_BASE_URL=https://cdn.yourdomain.com
   ```

4. **Enable HTTP/2 and Compression**
   ```nginx
   # In nginx config
   gzip on;
   gzip_types text/plain text/css application/json;
   http2_max_field_size 16k;
   ```

---

## Troubleshooting

**CORS Errors:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_ALLOWED_ORIGINS

# Verify in browser console
# Look for: Access-Control-Allow-Origin headers
```

**Backend not responding:**
```bash
# Check logs
pm2 logs cognix-backend

# Test endpoint
curl -H "Origin: https://app.yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -X OPTIONS https://api.yourdomain.com/api/v1/user/profile -v
```

**Database connection issues:**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check migrations
pnpm db:studio
```

---

## Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [PostgreSQL Administration](https://www.postgresql.org/docs/current/admin.html)
- [SSL Certificate Management](https://letsencrypt.org/docs/)
