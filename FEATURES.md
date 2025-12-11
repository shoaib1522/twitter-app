# Feature Documentation

## User Authentication

### Signup Process
- **Endpoint**: `POST /api/auth/signup`
- **Fields**: email, password, name
- **Validation**:
  - Email must be unique
  - Password must be at least 6 characters
  - Name is required
- **Response**: User object with JWT token

### Login Process
- **Endpoint**: `POST /api/auth/login`
- **Fields**: email, password
- **Session Management**: Express session stored in database
- **Duration**: 24-hour session expiry
- **Response**: Authenticated session token

### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Action**: Invalidates session in database
- **Redirect**: Returns to login page

### Password Encryption
- **Algorithm**: bcryptjs with 10 salt rounds
- **Storage**: Hashed passwords in database
- **Comparison**: Constant-time comparison to prevent timing attacks

## Tweet Management

### Create Tweet
- **Endpoint**: `POST /api/tweets`
- **Fields**: content (required)
- **Validation**:
  - Content is required
  - Max 280 characters
  - Requires authenticated user
- **Database Operation**: Inserts into tweets table with user_id
- **Response**: Tweet object with metadata

### View Tweets
- **Endpoint**: `GET /api/tweets` or GraphQL query
- **Types**:
  - Home timeline (tweets from followed users + own)
  - User timeline (specific user's tweets)
  - Tweet detail (single tweet)
- **Pagination**: Limit and offset parameters
- **Ordering**: Newest first (created_at DESC)

### Delete Tweet
- **Endpoint**: `DELETE /api/tweets/:id`
- **Authorization**: Only tweet owner can delete
- **Cascade Delete**: Also removes associated likes and retweets
- **Database Operation**: Soft delete or hard delete

### Edit Tweet
- **Current Status**: Not yet implemented
- **Design Consideration**:
  - Would add "edited_at" timestamp
  - Preserve original version history
  - Show "edited" indicator to users

## Like Functionality

### Like Tweet
- **Endpoint**: `POST /api/tweets/:id/like`
- **Validation**:
  - User cannot like own tweet
  - Cannot like same tweet twice
- **Database**: Inserts into likes table
- **Uniqueness**: Composite unique constraint (user_id, tweet_id)
- **Response**: Updated like count

### Unlike Tweet
- **Endpoint**: `DELETE /api/tweets/:id/like`
- **Validation**: User must have liked the tweet
- **Database**: Deletes from likes table
- **Response**: Updated like count

### Like Count Aggregation
```sql
SELECT COUNT(*) as likes
FROM likes
WHERE tweet_id = ?
```
- **Caching Opportunity**: Cache count for 1 minute
- **Real-time**: WebSocket notification when new like arrives

## Retweet Functionality

### Retweet Tweet
- **Endpoint**: `POST /api/tweets/:id/retweet`
- **Validation**:
  - User cannot retweet own tweet
  - Cannot retweet same tweet twice
- **Database**: Inserts into retweets table
- **Display**: Shows in user's timeline as original tweet
- **Response**: Retweet confirmation

### Unretweet
- **Endpoint**: `DELETE /api/tweets/:id/retweet`
- **Database**: Deletes from retweets table
- **Response**: Unretweet confirmation

### Retweet Count Aggregation
```sql
SELECT COUNT(*) as retweets
FROM retweets
WHERE tweet_id = ?
```

## User Profile Management

### Profile Information
- **Fields**: name, email, avatar_url, bio, website
- **Endpoint**: `GET /api/users/:username` or GraphQL query
- **Public Data**: Name, avatar, bio (no email)
- **Private Data**: Email (only own profile)

### Profile Update
- **Endpoint**: `PUT /api/users/:id`
- **Fields Editable**: name, bio, website, avatar
- **Authorization**: Only user can update own profile
- **Validation**: Name is required, bio max 160 characters

### User Statistics
- **Tweets Count**: Number of tweets posted
- **Followers Count**: Number of followers
- **Following Count**: Number of users being followed
- **Calculation**: Aggregate queries on follows and tweets tables

### Avatar Generation
- **Method**: Adorable Avatars API
- **URL Format**: `https://api.adorable.io/avatars/285/{email-hash}.png`
- **Caching**: Downloaded and stored locally

## Follow/Unfollow System

### Follow User
- **Endpoint**: `POST /api/users/:id/follow`
- **Validation**:
  - Cannot follow self
  - Cannot follow same user twice
- **Database**: Inserts into follows table
- **Uniqueness**: Composite unique constraint (follower_id, following_id)
- **Response**: Follower count update

### Unfollow User
- **Endpoint**: `DELETE /api/users/:id/follow`
- **Validation**: User must be currently following
- **Database**: Deletes from follows table
- **Response**: Follower count update

### Follower List
- **Endpoint**: `GET /api/users/:id/followers`
- **Returns**: Array of users following the specified user
- **Pagination**: Supported

### Following List
- **Endpoint**: `GET /api/users/:id/following`
- **Returns**: Array of users the specified user follows
- **Pagination**: Supported

### Follower/Following Count
```sql
SELECT COUNT(*) as followers
FROM follows
WHERE following_id = ?;

SELECT COUNT(*) as following
FROM follows
WHERE follower_id = ?;
```

## Timeline Display

### Home Timeline
- **Shows**:
  - User's own tweets
  - Tweets from users they follow
  - Likes from followed users
  - Retweets from followed users
- **Query Logic**:
```sql
SELECT t.* FROM tweets t
WHERE t.user_id = ? OR t.user_id IN (
  SELECT following_id FROM follows WHERE follower_id = ?
)
ORDER BY t.created_at DESC
LIMIT 20 OFFSET ?;
```

### User Timeline
- **Shows**: All tweets by specific user
- **Sorting**: Newest first
- **Pagination**: 20 per page

### Trending Timeline
- **Shows**: Most liked tweets in last 24 hours
- **Calculation**: Aggregate likes by tweet, ordered by count
- **Refresh**: Recalculated every 5 minutes

## Search Functionality

### Tweet Search
- **Current Status**: Basic content search
- **Method**: SQL LIKE operator (case-insensitive)
```sql
SELECT * FROM tweets
WHERE content ILIKE '%search_term%'
LIMIT 50;
```
- **Improvement**: Implement Elasticsearch for full-text search

### User Search
- **Search Fields**: name, email
- **Method**: SQL LIKE operator
- **Results**: Limited to 50 matching users

### Hashtag Search
- **Current Status**: Not yet implemented
- **Design**: Extract hashtags from tweet content using regex
- **Storage**: Separate hashtags table with normalization

## Real-time Features

### WebSocket Subscriptions
- **GraphQL Subscriptions**: Implemented via Apollo Server
- **Events**:
  - New tweet posted
  - Tweet liked
  - User followed
  - New comment received

### Live Notifications
- **Alert Types**:
  - Someone followed you
  - Someone liked your tweet
  - Someone retweeted your tweet
  - Someone replied to your tweet
- **Delivery**: Push via WebSocket connection
- **Storage**: Persisted in notifications table

### Activity Feeds
- **Real-time Updates**: Badges show new activity count
- **Update Frequency**: Immediate via WebSocket
- **Clearing**: User manually marks as read

## Comments/Replies (Future Enhancement)

### Design Consideration
- **Related Tables**:
  - replies table (references tweets.id as parent_id)
  - reply_likes table (for liking replies)
- **Threading**:
  - Replies nested under original tweet
  - Replies to replies (threaded conversations)
- **Display**:
  - Show reply author, content, time
  - Show like count for reply
  - Allow liking/unliking reply

## Notifications System (Future Enhancement)

### Notification Types
1. **Follow Notification**: User started following you
2. **Like Notification**: User liked your tweet
3. **Retweet Notification**: User retweeted your tweet
4. **Reply Notification**: User replied to your tweet

### Notification Aggregation
- **Grouping**: Multiple actions by same user
- **Display**: "John and 3 others liked your tweet"
- **Clearing**: Mark as read individually or bulk

### Notification Preferences
- **Settings**:
  - Email notifications (daily digest)
  - Push notifications (real-time)
  - In-app notifications (badge count)
- **Granular Control**: Per notification type

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /auth/signup | Create new user account |
| POST | /auth/login | Authenticate user |
| POST | /auth/logout | End user session |
| GET | /users/:id | Get user profile |
| PUT | /users/:id | Update user profile |
| GET | /users/:id/followers | List followers |
| GET | /users/:id/following | List following |
| POST | /users/:id/follow | Follow user |
| DELETE | /users/:id/follow | Unfollow user |
| POST | /tweets | Create new tweet |
| GET | /tweets | Get home timeline |
| GET | /tweets/:id | Get single tweet |
| DELETE | /tweets/:id | Delete tweet |
| POST | /tweets/:id/like | Like tweet |
| DELETE | /tweets/:id/like | Unlike tweet |
| POST | /tweets/:id/retweet | Retweet tweet |
| DELETE | /tweets/:id/retweet | Unretweet tweet |

## GraphQL Schema

### Core Types
- **User**: id, email, name, avatar_url, bio, website, createdAt
- **Tweet**: id, content, user, createdAt, likes, retweets
- **Follow**: follower, following, createdAt
- **Like**: user, tweet, createdAt

### Root Queries
- me: Current authenticated user
- user(id): Specific user by ID
- tweet(id): Specific tweet by ID
- tweets(limit, offset): Home timeline
- userTweets(userId, limit, offset): User's tweets
