# Big Data and Architecture Concepts

## Overview

This Twitter clone demonstrates key concepts from modern distributed systems and big data analytics through a full-stack application. While the current implementation is designed for demonstration purposes, it showcases the architectural patterns used in production systems handling millions of users.

## Polyglot Persistence

### Concept Definition
Polyglot persistence refers to using multiple database technologies within a single application, choosing the right database for the specific job at hand.

### Implementation in This Project
**PostgreSQL (Relational Database)**
- Stores structured user data (users, authentication)
- Maintains tweet data with proper relationships
- Manages follow relationships and social graph
- Handles like/retweet aggregations
- Provides ACID compliance for data integrity

### Why PostgreSQL for Twitter Data?
1. **Structured Data**: User profiles, tweets, and relationships are inherently structured
2. **ACID Properties**: Ensures data integrity for critical operations
   - Atomicity: Follow operations complete fully or not at all
   - Consistency: User counts remain accurate
   - Isolation: Concurrent operations don't interfere
   - Durability: Data persists across failures
3. **Complex Queries**: SQL enables efficient analytics on social data
4. **Data Relationships**: Foreign keys maintain referential integrity
5. **Indexing**: Optimizes queries on frequently accessed data

### Alternative Databases for Different Use Cases
- **Redis**: Caching layer for hot tweets and user sessions
- **Elasticsearch**: Full-text search on tweet content
- **MongoDB**: Flexible schema for user preferences
- **Neo4j**: Social graph and recommendation algorithms
- **Cassandra**: Time-series tweet data at massive scale

## Horizontal Scalability

### Current Design
```
┌─────────────────────────────────────────┐
│        Load Balancer / Reverse Proxy    │
└─────────────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│  Multiple API Service Instances            │
│  ├─ API Instance 1 (port 4100)            │
│  ├─ API Instance 2 (port 4101)            │
│  └─ API Instance N (port 410N)            │
└────────────────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│  Shared PostgreSQL Database                │
│  (Connection Pooling)                      │
└────────────────────────────────────────────┘
```

### Stateless API Design
- **No Session Storage in Memory**: Sessions stored in database
- **No Local File Uploads**: Files stored in object storage (S3, GCS)
- **No Cached State**: Cache shared across instances via Redis
- **Result**: Any instance can handle any request

### Connection Pooling
```javascript
// Database connection pool
const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 }
});
```
- Maintains connection pool to database
- Avoids reconnection overhead
- Enables efficient resource utilization

## Data Relationships (Schema Design)

### Entity-Relationship Model

```
USERS
├── id (Primary Key)
├── email (Unique)
├── name
├── password_hash
├── avatar_url
└── created_at

TWEETS
├── id (Primary Key)
├── user_id (Foreign Key → users.id)
├── content
├── created_at
└── updated_at

FOLLOWS
├── id (Primary Key)
├── follower_id (Foreign Key → users.id)
├── following_id (Foreign Key → users.id)
└── created_at
└── UNIQUE(follower_id, following_id)

LIKES
├── id (Primary Key)
├── user_id (Foreign Key → users.id)
├── tweet_id (Foreign Key → tweets.id)
├── created_at
└── UNIQUE(user_id, tweet_id)

RETWEETS
├── id (Primary Key)
├── user_id (Foreign Key → users.id)
├── tweet_id (Foreign Key → tweets.id)
├── created_at
└── UNIQUE(user_id, tweet_id)
```

### Query Examples Demonstrating Relationships

**User Feed (Own tweets + followed users' tweets)**
```sql
SELECT t.* FROM tweets t
WHERE t.user_id = current_user_id
   OR t.user_id IN (
     SELECT following_id FROM follows
     WHERE follower_id = current_user_id
   )
ORDER BY t.created_at DESC
LIMIT 20;
```

**Trending Topics (Aggregate likes)**
```sql
SELECT content, COUNT(l.id) as like_count
FROM tweets t
LEFT JOIN likes l ON t.id = l.tweet_id
WHERE t.created_at > NOW() - INTERVAL '24 hours'
GROUP BY t.id, t.content
ORDER BY like_count DESC
LIMIT 10;
```

**User Recommendations (Follow graph)**
```sql
SELECT u.*, COUNT(mutual.id) as mutual_follows
FROM users u
LEFT JOIN follows f ON u.id = f.following_id
LEFT JOIN follows mutual ON f.following_id = mutual.follower_id
WHERE f.follower_id = current_user_id
  AND u.id != current_user_id
GROUP BY u.id
ORDER BY mutual_follows DESC
LIMIT 5;
```

## GraphQL Query Optimization

### N+1 Query Prevention
Using DataLoader pattern to batch database queries:

```javascript
const userLoader = new DataLoader(async (userIds) => {
  const users = await knex('users')
    .whereIn('id', userIds);
  return userIds.map(id =>
    users.find(u => u.id === id)
  );
});

// In resolver
const user = await userLoader.load(tweet.user_id);
```

### Only Fetch Required Fields
GraphQL client specifies exact fields needed:
```graphql
query {
  tweets {
    id
    content
    user {
      name
      avatar_url
    }
    likes_count
  }
}
```

## ACID Properties Demonstration

### Atomicity: Transaction Example
```javascript
// Either both succeed or both fail
await knex.transaction(async (trx) => {
  // Create tweet
  const tweet = await trx('tweets').insert({
    user_id, content
  }).returning('*');

  // Update user's tweet count
  await trx('users')
    .where('id', user_id)
    .increment('tweets_count');
});
```

### Consistency: Foreign Key Constraints
```javascript
// Can't create tweet with non-existent user_id
// Database enforces referential integrity
const tweet = await knex('tweets').insert({
  user_id: 999, // Must exist in users table
  content: 'Hello'
});
```

### Isolation: Concurrent Requests
```javascript
// Two users liking same tweet simultaneously
// Database handles serialization
const like1 = await knex('likes').insert({
  user_id: 1, tweet_id: 100
});
const like2 = await knex('likes').insert({
  user_id: 2, tweet_id: 100
});
```

### Durability: Persistent Storage
- Data written to PostgreSQL persists across server restarts
- Write-ahead logging (WAL) ensures durability
- Disk-based storage prevents loss on application crash

## Caching Strategies for Scale

### Application-Level Caching
```javascript
// Cache user data in Redis
const cachedUser = await redis.get(`user:${userId}`);
if (!cachedUser) {
  user = await knex('users').where('id', userId).first();
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
}
```

### Database-Level Indexing
```javascript
-- Index frequently queried fields
CREATE INDEX idx_tweets_user_id ON tweets(user_id);
CREATE INDEX idx_tweets_created_at ON tweets(created_at DESC);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_likes_tweet ON likes(tweet_id);
```

### Query Result Caching
- Cache trending topics for 5 minutes
- Cache user profiles for 1 hour
- Cache feed data for 30 seconds

## Scalability Patterns

### Read Replicas
```yaml
# Production setup
Primary Database (Write operations)
├── Replica 1 (Read operations)
├── Replica 2 (Read analytics)
└── Replica 3 (Backup)
```

### Sharding Strategy
```
User data sharded by user_id hash:
├── Shard 1: Users 0-333M (Tweets, Follows, Likes)
├── Shard 2: Users 333M-666M (Tweets, Follows, Likes)
└── Shard 3: Users 666M-1B (Tweets, Follows, Likes)
```

### Message Queues for Async Operations
```javascript
// Create tweet and queue notifications
const tweet = await createTweet(user_id, content);
await queue.enqueue('notify_followers', {
  tweet_id: tweet.id,
  user_id
});
```

## Real-World Scaling Considerations

### Twitter-Scale Numbers
- 500M tweets per day
- 10M new users per month
- Millions of concurrent users
- Petabytes of data

### Technologies at Production Scale
- **Database**: Sharded PostgreSQL with read replicas
- **Cache**: Redis/Memcached for hot data
- **Search**: Elasticsearch for tweet full-text search
- **Graph**: Neo4j or custom solutions for social graph
- **Time Series**: InfluxDB for metrics and analytics
- **Message Queue**: Kafka for event streaming
- **Container Orchestration**: Kubernetes for deployment

## Learning Outcomes

By studying this application, you'll understand:
1. How to design a relational database for a complex application
2. How to implement horizontal scaling patterns
3. How polyglot persistence works in practice
4. How to optimize queries for performance
5. How GraphQL enables efficient data fetching
6. How Docker enables consistent environments
7. How ACID properties protect data integrity
8. How caching improves system performance
