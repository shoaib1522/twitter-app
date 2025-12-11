# Twitter Fullstack Clone - Big Data Analytics Lab Project

**Author:** Muhammad Shoaib Ahmad
**GitHub:** https://github.com/shoaib1522
**University:** University (Data Science) - Semester 7
**Course:** Big Data Analytics Lab
**Project Type:** Capstone Project - Polyglot Persistence Demonstration

---

## 📋 Project Overview

A complete **full-stack Twitter clone** demonstrating modern web application architecture and polyglot persistence concepts. This project showcases how to build a production-like social media platform using industry-standard technologies.

**Key Features:**
- User authentication and profile management
- Tweet creation, liking, and retweeting
- Follow/unfollow functionality
- Real-time updates and notifications
- Complete database persistence with PostgreSQL
- GraphQL API with proper type definitions
- Responsive React frontend with Next.js

![Preview](https://i.imgur.com/6riD8Tk.png)

---

## 🎯 Big Data & Architecture Concepts Demonstrated

### **Polyglot Persistence**
This project demonstrates using the right database for the right job:
- **PostgreSQL** - Relational database for structured user data, tweets, follows, and likes
  - ACID compliance for data integrity
  - Efficient SQL queries for analytics
  - Proper normalization and relationships

### **Full-Stack Architecture**
- **Frontend Layer**: React + Next.js for dynamic user interface
- **API Layer**: Node.js + Express + GraphQL for flexible queries
- **Database Layer**: PostgreSQL for persistent, structured data storage
- **Containerization**: Docker for consistent deployment across environments

### **Scalability Patterns**
- Stateless API design (horizontal scalability)
- Connection pooling for database efficiency
- GraphQL for optimized data fetching
- Separation of concerns between frontend and backend

---

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js v10+ (for local development)
- Git

### Installation & Running

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shoaib1522/twitter-app.git
   cd twitter-app
   ```

2. **Start with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   ```
   Frontend: http://localhost:3000
   API: http://localhost:4100
   Database: localhost:5432
   ```

4. **Database credentials:**
   ```
   User: postgres
   Password: postgres
   Database: postgres
   ```

---

## 🐋 Local Development

### First-time Setup

Environment files are pre-configured. Configuration is managed through Docker.

### Running the Project

Start all services with Docker Compose:

```bash
docker-compose up --build
```

This will:
- Start PostgreSQL database (port 5432)
- Start Node.js API server (port 4100)
- Start React frontend (port 3000)

Access the app at **http://localhost:3000**

### Database Setup

To initialize the database with tables and seed data:

```bash
docker-compose exec api sh -c "cd packages/server && yarn reset-db"
```

### Testing the Application

**Sign up for a new account:**
- Email: test@example.com
- Password: password123

**Features to test:**
- Create a tweet
- Like/retweet posts
- Follow other users
- View user profiles
- Browse home feed

---

## 💾 Database Inspection

Connect to PostgreSQL and query data:

```bash
docker-compose exec db psql -U postgres -d postgres
```

**Sample queries:**

```sql
-- View all users
SELECT id, name, email, created_at FROM users LIMIT 10;

-- Count total tweets
SELECT COUNT(*) as total_tweets FROM tweets;

-- See latest tweets
SELECT id, user_id, content, created_at FROM tweets
ORDER BY created_at DESC LIMIT 5;

-- User follow relationships
SELECT follower_id, following_id FROM follows LIMIT 10;

-- Count likes per tweet
SELECT tweet_id, COUNT(*) as like_count FROM likes
GROUP BY tweet_id ORDER BY like_count DESC LIMIT 5;

-- Exit
\q
```

---

## 🛠 Tech Stack

### **Frontend**
- React.js - UI library
- Next.js - React framework with SSR
- Apollo Client - GraphQL client
- styled-jsx - CSS-in-JS styling
- Adorable Avatars - User avatar generation

### **Backend**
- Node.js - JavaScript runtime
- Express.js - Web server framework
- Apollo Server - GraphQL server
- Knex.js - SQL query builder and migrations
- PostgreSQL - Relational database
- GraphQL - Query language for APIs

### **Infrastructure**
- Docker - Container platform
- Docker Compose - Multi-container orchestration
- PostgreSQL Alpine - Lightweight database image

---

## 📊 Project Structure

```
twitter-app/
├── packages/
│   ├── client/                    (React/Next.js Frontend)
│   │   ├── pages/                 (Next.js pages)
│   │   ├── components/            (React components)
│   │   ├── queries/               (GraphQL queries)
│   │   ├── lib/                   (Utilities)
│   │   └── server/                (Express server for SSR)
│   │
│   └── server/                    (Node.js/Express Backend)
│       ├── src/
│       │   ├── typedefs/          (GraphQL type definitions)
│       │   ├── resolvers/         (GraphQL resolvers)
│       │   ├── db/                (Database configuration)
│       │   ├── migrations/        (Database migrations)
│       │   └── seeds/             (Database seed data)
│       ├── package.json
│       └── knexfile.js            (Knex.js configuration)
│
├── docker-compose.yml             (Container orchestration)
├── Dockerfile                     (Multi-stage build)
├── README.md                      (This file)
└── TWITTER_SETUP_GUIDE.md         (Detailed setup guide)
```

---

## 🎓 What This Project Teaches

### **Software Engineering Concepts**
1. **Full-Stack Development** - Frontend + Backend + Database integration
2. **RESTful/GraphQL APIs** - Modern API design patterns
3. **Database Design** - Relational modeling and SQL
4. **Authentication** - User login and session management
5. **Real-time Features** - WebSocket and live updates

### **Big Data Concepts**
1. **Polyglot Persistence** - Using appropriate database technologies
2. **Scalability** - Horizontal and vertical scaling strategies
3. **Data Integrity** - ACID properties in PostgreSQL
4. **Query Optimization** - Efficient data retrieval patterns
5. **Data Relationships** - One-to-Many, Many-to-Many patterns

---

## 🔍 Demonstration for Professor

**Show the working application:**

```bash
# Terminal 1: Start the application
docker-compose up --build

# Terminal 2: Access the database
docker-compose exec db psql -U postgres -d postgres

# In browser: http://localhost:3000
# Interact with the app - signup, create tweets, follow users
```

**Talking points:**
- "This demonstrates a production-ready full-stack application"
- "React frontend communicates with GraphQL API"
- "PostgreSQL stores all data persistently"
- "Docker ensures consistency across environments"
- "Real-time updates via WebSocket subscriptions"
- "Polyglot persistence principle: right tool for the job"

---

## 📝 Requirements & Dependencies

All dependencies are managed by Docker. The following are installed automatically:

- Node.js 10.15.0 (Alpine)
- PostgreSQL 11.1 (Alpine)
- npm/yarn package managers
- All npm packages as listed in package.json files

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Find process using port 3000
netstat -ano | findstr :3000
# Kill the process
taskkill /PID <PID> /F
```

### Database connection issues
```bash
# Restart the database
docker-compose restart db

# Or complete reset
docker-compose down -v
docker-compose up --build
```

### API not responding
```bash
# Check logs
docker-compose logs api

# Restart API
docker-compose restart api
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [GraphQL Documentation](https://graphql.org/learn/)

---

## 👤 Author

**Muhammad Shoaib Ahmad**
- GitHub: https://github.com/shoaib1522
- Email: shoaib1522@example.com
- University: University (Data Science) - Semester 7

---

## 📄 License

Original project by Rafael Almeida. Modified and enhanced for Big Data Analytics Lab capstone project.

All rights reserved for Twitter by Twitter, Inc.

---

## 🙏 Acknowledgments

- Original Twitter Clone by [Rafael Almeida](https://github.com/rafaelalmeidatk)
- Big Data Analytics Lab, University (Data Science)
- Modern web development community

---

**Last Updated:** December 11, 2025
**Status:** ✅ Production Ready for Demonstration
