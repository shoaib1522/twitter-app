# Database Schema Documentation

## Overview

The Twitter clone uses PostgreSQL relational database with proper normalization and ACID compliance. This document describes all tables, columns, constraints, and relationships.

## Tables

### users
Stores user account information and authentication data.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Unique identifier (UUID)
- `email`: User email address (unique for signup/login)
- `password_hash`: bcryptjs hashed password (never store plaintext)
- `name`: User's display name
- `avatar_url`: URL to user's profile picture
- `bio`: Short biography (max 160 characters typically)
- `website`: User's website URL
- `created_at`: Account creation timestamp
- `updated_at`: Last profile update timestamp

**Indexes:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

**Primary Key:** `id`

**Constraints:**
- Email must be unique (no duplicate accounts)
- Email is not null (required for signup)
- Password hash is required

---

### tweets
Stores all tweets posted by users.

```sql
CREATE TABLE tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Unique tweet identifier
- `user_id`: Foreign key to tweet author
- `content`: Tweet text content (280 character limit typically enforced in API)
- `created_at`: Tweet creation timestamp
- `updated_at`: Last edit timestamp (if editing is allowed)

**Indexes:**
```sql
CREATE INDEX idx_tweets_user_id ON tweets(user_id);
CREATE INDEX idx_tweets_created_at ON tweets(created_at DESC);
CREATE INDEX idx_tweets_user_created ON tweets(user_id, created_at DESC);
```

**Foreign Keys:**
- `user_id` → `users(id)` with ON DELETE CASCADE (deleting user deletes tweets)

**Constraints:**
- Content is required and not null
- User must exist (referential integrity via foreign key)

---

### follows
Stores social graph relationships between users.

```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);
```

**Columns:**
- `id`: Relationship identifier
- `follower_id`: User who is following (foreign key)
- `following_id`: User being followed (foreign key)
- `created_at`: When relationship was established

**Indexes:**
```sql
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_follows_created ON follows(created_at DESC);
```

**Foreign Keys:**
- `follower_id` → `users(id)` ON DELETE CASCADE
- `following_id` → `users(id)` ON DELETE CASCADE

**Constraints:**
- Composite unique constraint (follower_id, following_id) prevents duplicate follows
- Cannot follow same user twice
- Both users must exist

**Important:**
- No self-follows: Application layer validation prevents follower_id == following_id
- Relationship is directional: A→B ≠ B→A

---

### likes
Stores which users like which tweets.

```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tweet_id)
);
```

**Columns:**
- `id`: Like relationship identifier
- `user_id`: User who liked the tweet
- `tweet_id`: Tweet being liked
- `created_at`: When like was created

**Indexes:**
```sql
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_tweet_id ON likes(tweet_id);
CREATE INDEX idx_likes_tweet_created ON likes(tweet_id, created_at DESC);
```

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE
- `tweet_id` → `tweets(id)` ON DELETE CASCADE

**Constraints:**
- Composite unique constraint (user_id, tweet_id) prevents duplicate likes
- User cannot like same tweet twice

**Queries:**
```sql
-- Count likes on a tweet
SELECT COUNT(*) as like_count FROM likes WHERE tweet_id = ?;

-- Check if user liked a tweet
SELECT EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND tweet_id = ?);

-- Get all users who liked a tweet
SELECT u.* FROM users u
JOIN likes l ON u.id = l.user_id
WHERE l.tweet_id = ?
ORDER BY l.created_at DESC;
```

---

### retweets
Stores which users retweeted which tweets.

```sql
CREATE TABLE retweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tweet_id)
);
```

**Columns:**
- `id`: Retweet relationship identifier
- `user_id`: User who retweeted
- `tweet_id`: Tweet being retweeted
- `created_at`: When retweet was created

**Indexes:**
```sql
CREATE INDEX idx_retweets_user_id ON retweets(user_id);
CREATE INDEX idx_retweets_tweet_id ON retweets(tweet_id);
```

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE
- `tweet_id` → `tweets(id)` ON DELETE CASCADE

**Constraints:**
- Composite unique constraint (user_id, tweet_id) prevents duplicate retweets

**Queries:**
```sql
-- Count retweets on a tweet
SELECT COUNT(*) as retweet_count FROM retweets WHERE tweet_id = ?;

-- Get all retweets by user
SELECT t.* FROM tweets t
JOIN retweets r ON t.id = r.tweet_id
WHERE r.user_id = ?
ORDER BY r.created_at DESC;
```

---

## Key Relationships

### User ↔ Tweet (One-to-Many)
- One user can post many tweets
- One tweet belongs to exactly one user
```sql
SELECT * FROM tweets WHERE user_id = ?;
```

### User ↔ User (Many-to-Many via follows)
- One user can follow many users
- One user can be followed by many users
```sql
SELECT u.* FROM users u
JOIN follows f ON u.id = f.following_id
WHERE f.follower_id = ?;
```

### User ↔ Tweet (Many-to-Many via likes)
- One user can like many tweets
- One tweet can be liked by many users
```sql
SELECT COUNT(*) FROM likes WHERE tweet_id = ?;
```

### User ↔ Tweet (Many-to-Many via retweets)
- One user can retweet many tweets
- One tweet can be retweeted by many users

## Common Queries

### Get Home Timeline
```sql
SELECT t.*, u.name, u.avatar_url,
       COUNT(DISTINCT l.id) as like_count,
       COUNT(DISTINCT r.id) as retweet_count
FROM tweets t
JOIN users u ON t.user_id = u.id
LEFT JOIN likes l ON t.id = l.tweet_id
LEFT JOIN retweets r ON t.id = r.tweet_id
WHERE t.user_id = current_user_id
   OR t.user_id IN (
     SELECT following_id FROM follows
     WHERE follower_id = current_user_id
   )
GROUP BY t.id, u.id
ORDER BY t.created_at DESC
LIMIT 20;
```

### Get User Profile with Stats
```sql
SELECT u.*,
       COUNT(DISTINCT t.id) as tweets_count,
       COUNT(DISTINCT f1.id) as followers_count,
       COUNT(DISTINCT f2.id) as following_count
FROM users u
LEFT JOIN tweets t ON u.id = t.user_id
LEFT JOIN follows f1 ON u.id = f1.following_id  -- followers
LEFT JOIN follows f2 ON u.id = f2.follower_id   -- following
WHERE u.id = ?
GROUP BY u.id;
```

### Get Trending Tweets (Last 24 Hours)
```sql
SELECT t.*, u.name, u.avatar_url,
       COUNT(l.id) as like_count
FROM tweets t
JOIN users u ON t.user_id = u.id
LEFT JOIN likes l ON t.id = l.tweet_id
WHERE t.created_at > NOW() - INTERVAL '24 hours'
GROUP BY t.id, u.id
ORDER BY like_count DESC, t.created_at DESC
LIMIT 50;
```

### Check if User Follows Another
```sql
SELECT EXISTS(
  SELECT 1 FROM follows
  WHERE follower_id = ? AND following_id = ?
);
```

### Get Mutual Followers
```sql
SELECT u.* FROM users u
WHERE EXISTS(
  SELECT 1 FROM follows f1
  WHERE f1.follower_id = ? AND f1.following_id = u.id
) AND EXISTS(
  SELECT 1 FROM follows f2
  WHERE f2.follower_id = u.id AND f2.following_id = ?
);
```

## Indexes Strategy

### B-Tree Indexes (Default)
Used for equality and range queries:
- User email (fast login lookup)
- Tweet user_id (all tweets by user)
- Tweet created_at (timeline ordering)
- Follow follower_id (get user's following list)
- Like tweet_id (count likes)

### Composite Indexes
For common combined queries:
- `(user_id, created_at DESC)` on tweets
- `(tweet_id, created_at DESC)` on likes

### Foreign Key Indexes
Automatically created for referential integrity checks.

## Data Integrity Constraints

### Primary Keys
- Ensure each record is uniquely identifiable
- Automatically indexed for fast lookups

### Foreign Keys
- Enforce referential integrity
- Prevent orphaned records (e.g., tweets without users)
- ON DELETE CASCADE ensures consistency

### Unique Constraints
- Email uniqueness (one account per email)
- Follow uniqueness (can't follow same user twice)
- Like uniqueness (can't like same tweet twice)
- Retweet uniqueness (can't retweet same tweet twice)

### NOT NULL Constraints
- User email, password, name are required
- Tweet content is required
- Foreign keys are required

## Normalization

### First Normal Form (1NF)
- ✅ All attributes contain atomic values
- ✅ No repeating groups
- ✅ Each attribute describes the entity

### Second Normal Form (2NF)
- ✅ Satisfies 1NF
- ✅ All non-key attributes fully depend on primary key
- ✅ No partial dependencies

### Third Normal Form (3NF)
- ✅ Satisfies 2NF
- ✅ No transitive dependencies
- ✅ Non-key attributes depend only on primary key

## Backup and Recovery

### Backup Strategy
```bash
docker-compose exec db pg_dump -U postgres -d postgres > backup.sql
```

### Recovery
```bash
docker-compose exec -T db psql -U postgres -d postgres < backup.sql
```

### Automated Backups
Consider daily backups:
```bash
0 2 * * * docker-compose exec db pg_dump -U postgres -d postgres > backups/postgres_$(date +\%Y\%m\%d).sql
```

## Performance Optimization

### Query Optimization
1. Use indexes on frequently queried columns
2. Use EXPLAIN ANALYZE to check query plans
3. Avoid N+1 queries in application code
4. Use pagination to limit result sets

### Connection Pooling
- Maintain 2-10 database connections
- Reuse connections for multiple queries
- Prevent connection exhaustion

### Caching Strategy
1. Cache user profiles (1 hour TTL)
2. Cache tweet likes/retweets counts (5 minute TTL)
3. Cache trending tweets (30 second TTL)
4. Invalidate cache on updates

## Future Enhancements

### Suggested Tables
1. **replies** - For threaded conversations
2. **notifications** - For activity feeds
3. **hashtags** - For hashtag search and trending
4. **bookmarks** - For saving tweets
5. **blocks** - For blocking users
6. **mutes** - For muting users
7. **direct_messages** - For private messaging

### Suggested Columns
1. **tweets.media_urls** - For image/video attachments
2. **users.verified** - For verification status
3. **tweets.reply_to_id** - For threaded replies
4. **likes.reaction_type** - For emoji reactions
