# Docker Setup and Configuration Guide

## Overview

This Twitter clone application uses Docker Compose to orchestrate three main services:
1. **API Service** - Node.js Express server with GraphQL
2. **Client Service** - React/Next.js frontend
3. **Database Service** - PostgreSQL relational database

## Docker Architecture

### Services Configuration

#### API Service (port 4100)
- **Base Image**: Node.js 10.15.0-alpine
- **Working Directory**: `/app/packages/server`
- **Environment Variables**:
  - `DATABASE_URL`: Connection string to PostgreSQL
  - `NODE_ENV`: development/production mode
- **Development Command**: `yarn dev` with nodemon hot-reload
- **Health Check**: Depends on database being healthy

#### Client Service (port 3000)
- **Base Image**: Node.js 10.15.0-alpine
- **Working Directory**: `/app/packages/client`
- **Environment Variables**:
  - `API_URL`: Internal Docker network reference to API service
- **Proxy Configuration**: Forwards `/api/*` requests to API service
- **SSR Support**: Next.js server-side rendering enabled

#### Database Service (port 5432)
- **Image**: PostgreSQL 11.1-alpine
- **Credentials**:
  - Username: postgres
  - Password: postgres
  - Default Database: postgres
- **Health Check**: Uses `pg_isready` to verify readiness
- **Persistent Volume**: `postgres_data` for data persistence

## Networking

All services communicate through a dedicated Docker bridge network (`app-network`):
- API service accessible internally as `api:4100`
- Database accessible internally as `db:5432`
- Isolation from host network except exposed ports

## Volumes

### Volume Mounts
- Application source code: `.:/app`
- Node modules caching: `/app/node_modules`
- Server dependencies: `/app/packages/server/node_modules`
- Client dependencies: `/app/packages/client/node_modules`

### Persistent Data
- PostgreSQL data: `postgres_data` volume for persistent storage

## Running the Application

### Start All Services
```bash
docker-compose up --build
```

### Start in Background
```bash
docker-compose up -d --build
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f client
docker-compose logs -f db
```

### Stop Services
```bash
# Stop without removing
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers with volumes
docker-compose down -v
```

## Database Management

### Access Database
```bash
docker-compose exec db psql -U postgres -d postgres
```

### Run Migrations
```bash
docker-compose exec api sh -c "cd packages/server && yarn migrate"
```

### Reset Database with Seed Data
```bash
docker-compose exec api sh -c "cd packages/server && yarn reset-db"
```

### Inspect Database Tables
```bash
# Inside psql
\dt              # List all tables
\d users         # Describe users table
\d tweets        # Describe tweets table
\d follows       # Describe follows table
\d likes         # Describe likes table
```

## Development Workflow

### Hot Module Reloading
- API service uses `nodemon` for automatic restarts on file changes
- Client uses Next.js HMR (Hot Module Replacement)
- Changes to source files automatically reflect in running containers

### Debugging
```bash
# View API logs
docker-compose logs -f api

# View client logs
docker-compose logs -f client

# View database logs
docker-compose logs -f db
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process using port
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Container Failed to Start
```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild images
docker-compose up --build
```

### Database Connection Issues
```bash
# Check database health
docker-compose exec db pg_isready -U postgres

# Restart database
docker-compose restart db
```

### API Dependencies Not Installing
```bash
# Clear Docker cache and rebuild
docker system prune -a
docker-compose up --build
```

## Environment Variables

All environment variables are configured in `docker-compose.yml`. To modify:

1. Edit `docker-compose.yml` under the specific service's `environment` section
2. Restart the service: `docker-compose restart <service-name>`
3. Or rebuild: `docker-compose up --build`

## Production Deployment

For production deployment:
1. Use `NODE_ENV=production` in environment variables
2. Use `docker build` with `--target api` and `--target web` for multi-stage builds
3. Configure proper database backup and recovery procedures
4. Set up Docker registry for image storage
5. Use container orchestration (Kubernetes, Docker Swarm) for scaling
