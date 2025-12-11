# Troubleshooting Guide

## Common Issues and Solutions

### Docker Issues

#### Docker Daemon Not Running

**Error Message**:
```
Cannot connect to Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
```

**Solution (Windows)**:
1. Open Docker Desktop application
2. Wait for it to fully start (look for whale icon)
3. Try command again

**Solution (Linux)**:
```bash
# Check if Docker is running
sudo systemctl status docker

# Start Docker
sudo systemctl start docker

# Enable auto-start
sudo systemctl enable docker
```

---

#### Port Already in Use

**Error Message**:
```
Error response from daemon: driver failed programming external connectivity on endpoint twitter-app_api_1 (port 4100)
```

**Find Process Using Port**:

Windows:
```bash
netstat -ano | findstr :4100
taskkill /PID <PID> /F
```

Linux/Mac:
```bash
lsof -i :4100
kill -9 <PID>
```

**Alternative**: Change port in docker-compose.yml
```yaml
ports:
  - '4101:4100'  # Use 4101 instead of 4100
```

---

#### Docker Compose Build Fails

**Error**: `ERROR: failed to solve with frontend dockerfile.v0`

**Solution**:
```bash
# Clear Docker cache
docker system prune -a --volumes

# Try building again
docker-compose up --build

# If still fails, build specific service
docker-compose build --no-cache api
```

---

#### Container Exit Immediately

**Error**: Container starts then stops

**Check Logs**:
```bash
# View container logs
docker-compose logs api

# More detailed output
docker-compose logs --tail=50 -f api

# Check specific error
docker-compose logs api | grep -i error
```

**Common Causes**:
- Database not ready (add healthcheck in docker-compose)
- Missing environment variables
- Port conflict
- Dependency not running

---

### Database Issues

#### Database Connection Failed

**Error Message**:
```
could not connect to server: Connection refused
  Is the server running on host "db" (172.18.0.2) and accepting
  TCP connections on port 5432?
```

**Check Database Health**:
```bash
# Verify database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Test connection
docker-compose exec db pg_isready -U postgres
```

**Solution**:
```bash
# Restart database service
docker-compose restart db

# Or full reset
docker-compose down -v
docker-compose up --build
```

---

#### Database Tables Don't Exist

**Error**: `relation "users" does not exist`

**Solution - Run Migrations**:
```bash
# Run migrations
docker-compose exec api sh -c "cd packages/server && yarn migrate"

# Verify tables were created
docker-compose exec db psql -U postgres -d postgres -c "\dt"
```

**Solution - Seed Data**:
```bash
# Load seed data
docker-compose exec api sh -c "cd packages/server && yarn seed"

# Verify data
docker-compose exec db psql -U postgres -d postgres -c "SELECT COUNT(*) FROM users;"
```

---

#### Reset Database Completely

**Warning**: This deletes all data!

```bash
# Stop containers
docker-compose down -v

# Remove database volume
docker volume rm twitter-app_postgres_data

# Start fresh
docker-compose up --build

# Run migrations and seeds
docker-compose exec api sh -c "cd packages/server && yarn reset-db"
```

---

#### Database Permissions Error

**Error**: `permission denied for schema public`

**Solution**:
```sql
-- Connect to database
docker-compose exec db psql -U postgres -d postgres

-- Fix permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;

-- Exit
\q
```

---

### API Server Issues

#### API Not Responding (Port 4100)

**Check API Status**:
```bash
# View logs
docker-compose logs api

# Check if port is listening
docker-compose exec api netstat -tuln | grep 4100

# Test with curl
curl -X POST http://localhost:4100/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { __typename }"}'
```

**Common Causes**:
- Dependencies not installed
- Database connection failed
- Port not exposed correctly
- Syntax error in resolvers

---

#### Node.js Module Not Found

**Error**:
```
Cannot find module 'apollo-server-express'
```

**Solution**:
```bash
# Rebuild containers (reinstall dependencies)
docker-compose down -v
docker-compose up --build

# Or reinstall in running container
docker-compose exec api sh -c "cd packages/server && yarn install"

# Restart service
docker-compose restart api
```

---

#### GraphQL Query Syntax Error

**Error**:
```
GraphQLError: Syntax Error: Unexpected Name "twets"
```

**Debug**:
1. Check query spelling
2. Validate against schema: http://localhost:4100/graphql (Playground)
3. Use IDE with GraphQL validation

**Example Invalid Query**:
```graphql
query {
  twets {  # TYPO: should be "tweets"
    id
    content
  }
}
```

---

#### Resolver Not Returning Data

**Error**: Query returns null or empty

**Debug Procedure**:
```javascript
// Add console.log to resolver
export default {
  homeFeed: async (_, args, { db, req }) => {
    console.log('User:', req.user?.id);  // Check auth
    console.log('Database:', db);         // Check connection

    const tweets = await db('tweets')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(20);

    console.log('Tweets found:', tweets.length);
    return tweets;
  }
};

// View logs
docker-compose logs -f api | grep "Tweets found"
```

---

### Frontend Issues

#### Frontend Not Loading (Port 3000)

**Check Client Status**:
```bash
# View logs
docker-compose logs client

# Check if running
docker-compose ps client

# Test connection
curl http://localhost:3000
```

---

#### Apollo Client Cache Issues

**Problem**: Data not updating after mutation

**Solution**:
```javascript
// Method 1: Refetch query
useMutation(CREATE_TWEET_MUTATION, {
  refetchQueries: [{ query: HOME_FEED_QUERY }]
});

// Method 2: Update cache manually
useMutation(CREATE_TWEET_MUTATION, {
  update: (cache, { data: { createTweet } }) => {
    const existing = cache.readQuery({ query: HOME_FEED_QUERY });
    cache.writeQuery({
      query: HOME_FEED_QUERY,
      data: {
        homeFeed: [createTweet, ...existing.homeFeed]
      }
    });
  }
});

// Method 3: Clear cache
client.resetStore();
```

---

#### Next.js Build Failure

**Error**: `FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed`

**Cause**: Out of memory during build

**Solution**:
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Or in docker-compose.yml
environment:
  - NODE_OPTIONS=--max-old-space-size=2048

# Restart
docker-compose restart client
```

---

#### 404 on Page Routes

**Problem**: Pages like /profile/:username return 404

**Check Next.js Routing**:
```javascript
// Verify file structure
// pages/profile/[username].js should exist

// Test route
curl http://localhost:3000/profile/testuser

// Check logs for routing errors
docker-compose logs client | grep "profile"
```

---

### Network Issues

#### CORS Error in Browser Console

**Error**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Check CORS Configuration**:
```javascript
// packages/server/index.js
app.use(cors({
  origin: 'http://localhost:3000',  // Must match frontend URL
  credentials: true
}));
```

**Solution**:
```javascript
const whitelist = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://example.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));

// Restart API
docker-compose restart api
```

---

#### API URL Not Resolving

**Problem**: Client can't reach API

**Check Environment Variables**:
```bash
# View client environment
docker-compose exec client sh -c "echo $API_URL"

# Should print: http://api:4100

# If wrong, update docker-compose.yml
# environment:
#   - API_URL=http://api:4100
```

**Test Connection**:
```bash
# From client container
docker-compose exec client curl http://api:4100/graphql
```

---

### Authentication Issues

#### Login Not Working

**Debug Steps**:
```bash
# Check database for user
docker-compose exec db psql -U postgres -d postgres
SELECT email, password_hash FROM users WHERE email = 'test@test.com';

# Test login mutation manually in GraphQL Playground
mutation {
  login(email: "test@test.com", password: "password123") {
    id
    email
  }
}

# View API logs
docker-compose logs api | grep -i login
```

---

#### Session Not Persisting

**Problem**: Login works but session lost after refresh

**Check Session Storage**:
```bash
# View sessions in database
docker-compose exec db psql -U postgres -d postgres
SELECT * FROM "sessions" LIMIT 5;

# Should contain user session data
```

**Solution**:
```javascript
// Ensure credentials are sent with requests
import { ApolloClient, ApolloLink, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: 'http://localhost:4100/graphql',
  credentials: 'include'  // ← Include cookies/credentials
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache()
});
```

---

### Performance Issues

#### Slow API Responses

**Measure Response Time**:
```bash
# Time a query
time curl -X POST http://localhost:4100/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { homeFeed { id } }"}'
```

**Debug Query Performance**:
```bash
# Connect to database
docker-compose exec db psql -U postgres

# Use EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT t.* FROM tweets t
WHERE t.user_id IN (...)
ORDER BY t.created_at DESC;

# Look for "Seq Scan" - should be "Index Scan" for performance
```

**Solutions**:
1. Add database indexes
2. Use pagination (limit/offset)
3. Implement caching (Redis)
4. Optimize query with DataLoader

---

#### High Memory Usage

**Check Resource Usage**:
```bash
# View memory per container
docker stats

# Limit memory in docker-compose.yml
services:
  api:
    mem_limit: 512m
    memswap_limit: 512m
```

---

### Log Inspection

#### View All Service Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs api
docker-compose logs client
docker-compose logs db

# Last 50 lines
docker-compose logs --tail=50

# Follow (watch)
docker-compose logs -f

# With timestamps
docker-compose logs -t

# Search logs
docker-compose logs | grep "error"
```

---

## Quick Debug Checklist

- [ ] All containers running: `docker-compose ps`
- [ ] Logs show no errors: `docker-compose logs`
- [ ] Database connected: `docker-compose exec db pg_isready`
- [ ] API responding: `curl http://localhost:4100/graphql`
- [ ] Frontend loaded: `curl http://localhost:3000`
- [ ] Environment variables correct: `docker-compose config`
- [ ] Ports not in use: `netstat -tuln | grep -E ':(3000|4100|5432)'`
- [ ] No permission errors: `ls -la .` shows ownership

---

## Getting Help

### Resources

- GitHub Issues: https://github.com/shoaib1522/twitter-app/issues
- Docker Docs: https://docs.docker.com/
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Node.js Docs: https://nodejs.org/docs/

### Reporting Issues

When reporting an issue, include:
1. Error message (full stacktrace)
2. Commands you ran
3. `docker-compose ps` output
4. `docker-compose logs` output
5. Operating system and Docker version
6. Steps to reproduce
