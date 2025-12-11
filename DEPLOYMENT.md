# Deployment Guide

## Development Deployment

### Local Development Setup

#### Prerequisites
- Docker and Docker Compose installed
- Git for version control
- Text editor or IDE (VS Code recommended)
- Terminal/Command Prompt access

#### Quick Start
```bash
# Clone repository
git clone https://github.com/shoaib1522/twitter-app.git
cd twitter-app

# Start all services
docker-compose up --build

# Access applications
# Frontend: http://localhost:3000
# API: http://localhost:4100
# Database: localhost:5432
```

#### Initialize Database
```bash
# Run migrations and seed data
docker-compose exec api sh -c "cd packages/server && yarn reset-db"
```

#### Testing the Application
1. Navigate to http://localhost:3000
2. Click "Sign Up" to create account
3. Email: test@example.com
4. Password: password123
5. Explore features (create tweets, follow users, like posts)

### Docker Compose Commands

```bash
# Start services in foreground
docker-compose up

# Start services in background
docker-compose up -d

# Build without starting
docker-compose build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f client
docker-compose logs -f db

# Stop services
docker-compose stop

# Remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Restart services
docker-compose restart

# Execute command in container
docker-compose exec api yarn dev
docker-compose exec db psql -U postgres
```

## Staging Deployment

### AWS EC2 Setup

#### Instance Configuration
- **AMI**: Ubuntu 20.04 LTS
- **Instance Type**: t3.medium or larger
- **Storage**: 30GB EBS
- **Security Group**: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000, 4100

#### Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Clone repository
git clone https://github.com/shoaib1522/twitter-app.git
cd twitter-app
```

#### Environment Configuration
Create `.env.production`:
```bash
NODE_ENV=production
DATABASE_URL=postgres://postgres:strong_password_here@db:5432/postgres
API_URL=https://api.example.com
FRONTEND_URL=https://example.com
CORS_ORIGIN=https://example.com
```

#### SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate certificate
sudo certbot certonly --standalone -d api.example.com -d example.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

#### Start Application
```bash
# Build and start
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Initialize database
docker-compose exec api sh -c "cd packages/server && yarn migrate"
docker-compose exec api sh -c "cd packages/server && yarn seed"
```

#### Health Monitoring
```bash
# Check service status
docker-compose ps

# View container stats
docker stats

# Check logs
docker-compose logs --tail=100 -f
```

### Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/twitter-clone`:
```nginx
upstream api {
    server localhost:4100;
}

upstream client {
    server localhost:3000;
}

server {
    listen 80;
    server_name example.com www.example.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://client;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /graphql {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable configuration:
```bash
sudo ln -s /etc/nginx/sites-available/twitter-clone /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Production Deployment

### Docker Registry Setup

#### Push to Docker Hub
```bash
# Build images
docker build -t yourusername/twitter-api:latest --target api .
docker build -t yourusername/twitter-client:latest --target web .

# Login to Docker Hub
docker login

# Push images
docker push yourusername/twitter-api:latest
docker push yourusername/twitter-client:latest
```

### Kubernetes Deployment

#### Create Deployment YAML
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: twitter-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: twitter-api
  template:
    metadata:
      labels:
        app: twitter-api
    spec:
      containers:
      - name: api
        image: yourusername/twitter-api:latest
        ports:
        - containerPort: 4100
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /graphql
            port: 4100
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /graphql
            port: 4100
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: twitter-api-service
spec:
  selector:
    app: twitter-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 4100
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f deployment.yaml
kubectl get pods
kubectl logs -f <pod-name>
```

### Database Scaling (Production)

#### Read Replicas
```sql
-- Primary PostgreSQL configuration
max_wal_senders = 10
wal_level = replica
```

Configure replica:
```bash
# On replica server
pg_basebackup -h primary.example.com -D /var/lib/postgresql/13/main -U replication -v -P -W
```

#### Connection Pooling with PgBouncer
```ini
[databases]
postgres = host=localhost port=5432 dbname=postgres

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
```

### Monitoring and Logging

#### Health Checks
```bash
# API health
curl http://localhost:4100/graphql

# Database health
docker-compose exec db pg_isready -U postgres
```

#### Log Aggregation (ELK Stack)

Create `logstash.conf`:
```
input {
  docker {
    host => "127.0.0.1"
  }
}

filter {
  json {
    source => "message"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "twitter-logs-%{+YYYY.MM.dd}"
  }
}
```

#### Metrics Collection (Prometheus)

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'docker'
    static_configs:
      - targets: ['localhost:9323']
```

## Continuous Deployment

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build Docker images
        run: |
          docker build -t ${{ secrets.DOCKER_REPO }}/api:latest --target api .
          docker build -t ${{ secrets.DOCKER_REPO }}/web:latest --target web .

      - name: Push to Docker Hub
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push ${{ secrets.DOCKER_REPO }}/api:latest
          docker push ${{ secrets.DOCKER_REPO }}/web:latest

      - name: Deploy to server
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh -o StrictHostKeyChecking=no ubuntu@${{ secrets.SERVER_IP }} << 'EOF'
            cd twitter-app
            git pull
            docker-compose up -d
          EOF
```

## Backup Strategy

### Automated Database Backups
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker-compose exec -T db pg_dump -U postgres -d postgres | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

Schedule with cron:
```bash
0 2 * * * /home/user/twitter-app/backup.sh
```

### Database Restore
```bash
# List backups
ls /backups/postgres/

# Restore from backup
gunzip < /backups/postgres/backup_20231201_020000.sql.gz | docker-compose exec -T db psql -U postgres
```

## Rollback Procedure

### Rollback to Previous Version
```bash
# Check commit history
git log --oneline -10

# Checkout previous version
git checkout <commit-hash>

# Rebuild and restart
docker-compose down -v
docker-compose up --build -d

# Restore database backup if needed
docker-compose exec -T db psql -U postgres < /backups/postgres/latest_backup.sql
```

## Performance Tuning

### PostgreSQL Configuration
```ini
# postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### Node.js Optimization
```javascript
// server.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  // Fork workers for each CPU core
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }
} else {
  // Worker process
  startServer();
}
```

## Security Checklist

- [ ] HTTPS/SSL enabled on all endpoints
- [ ] Database password secured in environment variables
- [ ] API CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection headers set
- [ ] CSRF tokens implemented
- [ ] Database backups encrypted
- [ ] Server firewall configured
- [ ] Regular security updates applied
- [ ] Secrets manager (AWS Secrets Manager, HashiCorp Vault) configured
