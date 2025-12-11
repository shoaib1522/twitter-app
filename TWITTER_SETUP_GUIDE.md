# Twitter Full-Stack Clone - Complete Setup Guide

## 📊 What is This Project?

A **complete full-stack Twitter/X clone** demonstrating:
- **Frontend**: React + Next.js with real-time Apollo Client
- **Backend**: Node.js + Express + GraphQL + Apollo Server
- **Database**: PostgreSQL (production-grade relational database)
- **Architecture**: Modern microservices pattern with API separation

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Port 3000)                       │
│  React + Next.js + Apollo Client + styled-jsx             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Pages:                                               │  │
│  │ - Home Feed (tweets from following)                  │  │
│  │ - Explore (discover new tweets)                      │  │
│  │ - Profile (user profile & tweets)                    │  │
│  │ - Tweet (create new tweet)                           │  │
│  │ - Bookmarks (saved tweets)                           │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                  (HTTP/GraphQL)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    API SERVER (Port 4100)                   │
│   Node.js + Express + Apollo Server + GraphQL             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ GraphQL Resolvers:                                   │  │
│  │ - User (signup, login, profile)                      │  │
│  │ - Tweet (create, like, retweet, bookmark)           │  │
│  │ - Feed (get timeline, explore)                       │  │
│  │ - Follow (follow/unfollow users)                     │  │
│  │ - Search (find tweets, users)                        │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                  (Database Queries)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              DATABASE (Port 5432)                           │
│  PostgreSQL 11.1 (Development)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tables:                                              │  │
│  │ - users (id, name, email, password, bio)           │  │
│  │ - tweets (id, user_id, content, created_at)        │  │
│  │ - likes (id, user_id, tweet_id)                    │  │
│  │ - bookmarks (id, user_id, tweet_id)                │  │
│  │ - follows (id, follower_id, following_id)          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### System Requirements
- **Docker** (version 20.10+)
- **Docker Compose** (version 1.29+)
- **Git** (to clone the repo)
- Windows, macOS, or Linux
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 2GB available

### Check Installation
```bash
docker --version
docker-compose --version
git --version
```

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Navigate to project
cd "d:\University (Data Science)\Semester 7\Big Data Analytics Lab\Project\twitter-app"

# 2. Start everything with Docker
make dev

# 3. Access the app
# Open browser: http://localhost:3000
```

**That's it!** The Makefile handles everything.

---

## 📝 Detailed Setup Steps

### Step 1: Verify Project Structure
```bash
cd "d:\University (Data Science)\Semester 7\Big Data Analytics Lab\Project\twitter-app"

# You should see:
# - packages/
#   - client/          (React + Next.js Frontend)
#   - server/          (Node.js + Express Backend)
# - docker-compose.yml (Container orchestration)
# - Makefile           (Automation)
# - README.md
```

### Step 2: Verify Environment Files Exist
```bash
# Check if .env files are set up
ls -la packages/server/.env
ls -la packages/client/.env

# Both should exist (created during setup)
```

### Step 3: Start the Application

#### Option A: Automatic Setup (Recommended)
```bash
make dev
```

This command:
1. ✅ Starts PostgreSQL database container
2. ✅ Builds Node.js API container
3. ✅ Runs database migrations
4. ✅ Seeds initial data
5. ✅ Starts Express API server (port 4100)
6. ✅ Starts React client (port 3000)

#### Option B: Manual Steps
```bash
# Build and start containers
docker-compose up --build

# In another terminal, reset database with sample data
make reset-db

# Or manually:
docker-compose run --rm api /bin/sh -c "cd packages/server && yarn reset-db"
```

### Step 4: Wait for Startup
- **PostgreSQL**: ~10 seconds
- **API**: ~20 seconds (installing dependencies)
- **Client**: ~30 seconds
- **Total**: ~60 seconds

Watch the logs for:
```
api_1 | Listening on http://localhost:4100
```

### Step 5: Access the Application

**Open your browser**: http://localhost:3000

You'll see the Twitter clone home page!

---

## 👤 Default Test Users (After reset-db)

After running `make reset-db`, use these credentials:

```
User 1:
Email: user1@example.com
Password: password123

User 2:
Email: user2@example.com
Password: password123

User 3:
Email: user3@example.com
Password: password123
```

---

## ✨ Features You Can Demo

### 1. **Authentication**
- Sign up with email/password
- Login to existing account
- Logout

### 2. **Tweet Creation**
- Write a new tweet
- Submit and see it appear instantly

### 3. **Interactions**
- Like/unlike tweets
- Retweet posts
- Bookmark tweets for later

### 4. **User Profile**
- View user profile
- See user's tweets
- Follow/unfollow users

### 5. **Timeline**
- Home feed (tweets from followed users)
- Explore (discover new tweets)
- See trending topics

### 6. **Search** (if enabled)
- Search for users
- Search for tweets

---

## 🔍 Database Inspection

### Connect to PostgreSQL

```bash
# Enter the database container
docker exec -it twitter-fullstack-clone_db_1 psql -U twitterclone -d dev_twitter_clone

# Or use this exact command if container name differs:
docker ps  # Find the db container name first
docker exec -it <container_id> psql -U twitterclone -d dev_twitter_clone
```

### Useful Database Queries

```sql
-- See all users
SELECT id, name, email, created_at FROM users LIMIT 10;

-- Count tweets
SELECT COUNT(*) as total_tweets FROM tweets;

-- See latest tweets
SELECT id, user_id, content, created_at FROM tweets ORDER BY created_at DESC LIMIT 5;

-- See user follows
SELECT follower_id, following_id FROM follows LIMIT 10;

-- Count likes
SELECT COUNT(*) as total_likes FROM likes;

-- See user with most tweets
SELECT user_id, COUNT(*) as tweet_count FROM tweets GROUP BY user_id ORDER BY tweet_count DESC LIMIT 5;

-- Exit
\q
```

---

## 🐛 Troubleshooting

### Problem 1: "Cannot connect to Docker daemon"
```bash
# Solution: Start Docker Desktop
# Windows/Mac: Launch Docker Desktop application
# Linux: sudo systemctl start docker
```

### Problem 2: Port 3000 or 4100 already in use
```bash
# Find what's using the port (Windows)
netstat -ano | findstr :3000
netstat -ano | findstr :4100

# Find what's using the port (Mac/Linux)
lsof -i :3000
lsof -i :4100

# Kill the process (or change ports in docker-compose.yml)
```

### Problem 3: Database connection error
```bash
# Wait for PostgreSQL to initialize (takes 30+ seconds)
# Check logs:
docker-compose logs db

# Try restarting:
docker-compose down
docker-compose up --build
```

### Problem 4: "Dependencies not installing"
```bash
# Clear node_modules and reinstall
docker-compose run --rm api /bin/sh -c "rm -rf node_modules && yarn install"
docker-compose run --rm client /bin/sh -c "rm -rf node_modules && yarn install"

# Restart everything
docker-compose down
docker-compose up --build
```

### Problem 5: Migration errors
```bash
# Reset database with fresh migrations and seed data
make reset-db

# Or manually:
docker-compose run --rm api /bin/sh -c "cd packages/server && yarn reset-db"
```

### Problem 6: "localhost:3000 refused to connect"
```bash
# Check if containers are running
docker ps

# Check logs
docker-compose logs client
docker-compose logs api

# Make sure both are running without errors
```

---

## 📊 Big Data Concepts Demonstrated

### 1. **Relational Database Design**
- **PostgreSQL** stores structured data
- Proper schema with foreign keys
- Normalized tables (users, tweets, follows, likes, bookmarks)

### 2. **API Architecture**
- **GraphQL** enables flexible data queries
- Apollo Server manages type safety
- Efficient data fetching (no over-fetching)

### 3. **Real-time Updates**
- WebSocket support via Apollo subscriptions
- Live feed updates
- Real-time notifications

### 4. **User Relationships**
- **One-to-Many**: User → Tweets
- **Many-to-Many**: Users → Follows → Users
- **Junction Tables**: likes, bookmarks, follows

### 5. **Scalability Patterns**
- Stateless API (can be scaled horizontally)
- Database connection pooling
- Read replicas possible

### 6. **Data Integrity**
- ACID transactions
- Foreign key constraints
- Cascade deletes

---

## 🎓 What to Tell Your Professor

**"Here's a complete production-like Twitter clone demonstrating modern web architecture:**

1. **Frontend Layer**: React with Next.js for server-side rendering
2. **API Layer**: GraphQL with Apollo Server for flexible queries
3. **Database Layer**: PostgreSQL for reliable, relational data storage
4. **Real-time Features**: WebSocket subscriptions for live updates

**You can see:**
- User authentication system
- Tweet creation and timeline
- Social interactions (likes, retweets, follows)
- User profiles
- Bookmarks and saved posts

**Technology demonstrates:**
- Microservices pattern (API separation)
- GraphQL best practices
- PostgreSQL relational design
- Docker containerization
- Production-ready architecture"

---

## 🛑 Stopping the Application

```bash
# Stop all containers (keeps data)
docker-compose down

# Stop and remove all data
docker-compose down -v

# Stop individual containers
docker-compose stop
```

---

## 🔄 Resetting Everything

```bash
# Remove everything and start fresh
docker-compose down -v
docker-compose up --build
make reset-db
```

---

## 📁 Project Structure

```
twitter-app/
├── packages/
│   ├── client/                 (React Frontend)
│   │   ├── pages/             (Next.js pages)
│   │   ├── components/        (React components)
│   │   ├── queries/           (GraphQL queries)
│   │   ├── lib/               (Utilities)
│   │   └── package.json
│   │
│   └── server/                 (Node.js Backend)
│       ├── src/
│       │   ├── typedefs/      (GraphQL type definitions)
│       │   ├── resolvers/     (GraphQL resolvers)
│       │   ├── db/            (Database config)
│       │   └── migrations/    (Database migrations)
│       ├── package.json
│       └── knexfile.js        (Knex.js config)
│
├── docker-compose.yml          (Container orchestration)
├── Dockerfile                  (Multi-stage build)
├── Makefile                    (Commands)
└── README.md
```

---

## 🚀 Advanced Features

### Scale the Application

**Add Redis for caching:**
```yaml
# Add to docker-compose.yml
redis:
  image: redis:6-alpine
  ports:
    - "6379:6379"
```

**Add load balancer:**
Use Nginx to balance requests across multiple API instances.

### Monitoring

**View real-time logs:**
```bash
docker-compose logs -f api
docker-compose logs -f client
docker-compose logs -f db
```

**Monitor database performance:**
```bash
docker exec -it twitter-fullstack-clone_db_1 psql -U twitterclone -d dev_twitter_clone
# Inside psql:
\x  # Extended display
SELECT * FROM pg_stat_statements LIMIT 10;
```

---

## ❓ FAQ

**Q: Can I modify the tweets/users?**
A: Yes! The database is fully mutable. Create new tweets, users, follows through the UI.

**Q: How do I add new features?**
A: See the server mutations and resolvers in `packages/server/src/`. Add new GraphQL types and resolvers.

**Q: Can I use a different database?**
A: Yes, but you'd need to modify the connection string and migrations. PostgreSQL is recommended for this project.

**Q: How do I deploy this?**
A: Use Docker Compose on a server, or deploy to Heroku/AWS with the included configurations.

**Q: Is this production-ready?**
A: It's a demo/learning project. For production, add authentication middleware, rate limiting, input validation, and error handling.

---

## 🎯 Demo Script for Your Professor

```bash
# Step 1: Show the running system
docker ps

# Output shows:
# - PostgreSQL database
# - Node.js API
# - React client

# Step 2: Open browser to http://localhost:3000

# Step 3: Sign up with test account
# Email: test@example.com
# Password: testpass123

# Step 4: Create a tweet
# Type message and click tweet

# Step 5: Show database
docker exec -it twitter-fullstack-clone_db_1 psql -U twitterclone -d dev_twitter_clone
SELECT * FROM tweets ORDER BY created_at DESC LIMIT 3;

# Step 6: Explain the stack
# "This demonstrates modern full-stack architecture with:
#  - React frontend for user experience
#  - Node.js API for business logic
#  - PostgreSQL for persistent data storage
#  - Docker for containerization and portability"
```

---

## 💡 Next Steps

1. ✅ Run `make dev`
2. ✅ Wait for startup
3. ✅ Open http://localhost:3000
4. ✅ Sign up and create tweets
5. ✅ Show your professor
6. ✅ Explain the architecture

Good luck! 🚀
