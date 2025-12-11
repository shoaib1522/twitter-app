# GraphQL API Documentation

## Base URL

```
Development: http://localhost:4100/graphql
Production: https://twitter-clone-api.example.com/graphql
```

## Authentication

All requests that modify data or access private user data require authentication via session cookie.

### Login Mutation
```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    id
    email
    name
    avatar_url
  }
}
```

### Logout Mutation
```graphql
mutation Logout {
  logout
}
```

### Signup Mutation
```graphql
mutation Signup($email: String!, $password: String!, $name: String!) {
  signup(email: $email, password: $password, name: $name) {
    id
    email
    name
    avatar_url
  }
}
```

## User Queries

### Get Current User
```graphql
query Me {
  me {
    id
    email
    name
    avatar_url
    bio
    website
    created_at
    tweets_count
    followers_count
    following_count
  }
}
```

### Get User by ID
```graphql
query User($id: String!) {
  user(id: $id) {
    id
    email
    name
    avatar_url
    bio
    website
    created_at
    tweets_count
    followers_count
    following_count
    is_following # Current user follows this user?
    tweets {
      id
      content
      created_at
    }
  }
}
```

### Get User by Username
```graphql
query UserByUsername($username: String!) {
  userByUsername(username: $username) {
    id
    name
    avatar_url
    bio
    website
    tweets_count
    followers_count
    following_count
  }
}
```

### Search Users
```graphql
query SearchUsers($query: String!, $limit: Int) {
  searchUsers(query: $query, limit: $limit) {
    id
    name
    avatar_url
    tweets_count
    followers_count
  }
}
```

### Get Followers
```graphql
query Followers($userId: String!, $limit: Int, $offset: Int) {
  followers(userId: $userId, limit: $limit, offset: $offset) {
    id
    name
    avatar_url
    tweets_count
  }
}
```

### Get Following
```graphql
query Following($userId: String!, $limit: Int, $offset: Int) {
  following(userId: $userId, limit: $limit, offset: $offset) {
    id
    name
    avatar_url
    tweets_count
  }
}
```

## User Mutations

### Update User Profile
```graphql
mutation UpdateUser($name: String, $bio: String, $website: String) {
  updateUser(name: $name, bio: $bio, website: $website) {
    id
    name
    bio
    website
  }
}
```

### Follow User
```graphql
mutation Follow($userId: String!) {
  followUser(userId: $userId) {
    id
    following_count
    is_following
  }
}
```

### Unfollow User
```graphql
mutation Unfollow($userId: String!) {
  unfollowUser(userId: $userId) {
    id
    following_count
    is_following
  }
}
```

## Tweet Queries

### Get Home Timeline
```graphql
query HomeFeed($limit: Int, $offset: Int) {
  homeFeed(limit: $limit, offset: $offset) {
    id
    content
    created_at
    user {
      id
      name
      avatar_url
    }
    likes_count
    retweets_count
    replies_count
    is_liked_by_me
    is_retweeted_by_me
  }
}
```

### Get User Timeline
```graphql
query UserTweets($userId: String!, $limit: Int, $offset: Int) {
  userTweets(userId: $userId, limit: $limit, offset: $offset) {
    id
    content
    created_at
    user {
      id
      name
      avatar_url
    }
    likes_count
    retweets_count
    replies_count
  }
}
```

### Get Single Tweet
```graphql
query Tweet($id: String!) {
  tweet(id: $id) {
    id
    content
    created_at
    user {
      id
      name
      avatar_url
      bio
      followers_count
    }
    likes_count
    retweets_count
    replies_count
    is_liked_by_me
    is_retweeted_by_me
    liked_by {
      id
      name
      avatar_url
    }
  }
}
```

### Get Tweet Likes
```graphql
query TweetLikes($tweetId: String!, $limit: Int, $offset: Int) {
  tweetLikes(tweetId: $tweetId, limit: $limit, offset: $offset) {
    id
    name
    avatar_url
  }
}
```

### Get Retweets
```graphql
query TweetRetweets($tweetId: String!, $limit: Int, $offset: Int) {
  tweetRetweets(tweetId: $tweetId, limit: $limit, offset: $offset) {
    id
    name
    avatar_url
  }
}
```

### Search Tweets
```graphql
query SearchTweets($query: String!, $limit: Int) {
  searchTweets(query: $query, limit: $limit) {
    id
    content
    created_at
    user {
      id
      name
      avatar_url
    }
    likes_count
  }
}
```

## Tweet Mutations

### Create Tweet
```graphql
mutation CreateTweet($content: String!) {
  createTweet(content: $content) {
    id
    content
    created_at
    user {
      id
      name
      avatar_url
    }
    likes_count
  }
}
```

**Variables:**
```json
{
  "content": "Hello Twitter! This is my first tweet."
}
```

**Validation:**
- Content is required
- Content must be 1-280 characters
- User must be authenticated

### Update Tweet
```graphql
mutation UpdateTweet($id: String!, $content: String!) {
  updateTweet(id: $id, content: $content) {
    id
    content
    updated_at
  }
}
```

### Delete Tweet
```graphql
mutation DeleteTweet($id: String!) {
  deleteTweet(id: $id)
}
```

**Authorization:**
- Only tweet owner can delete
- Deletes associated likes, retweets, and replies

### Like Tweet
```graphql
mutation LikeTweet($tweetId: String!) {
  likeTweet(tweetId: $tweetId) {
    id
    likes_count
    is_liked_by_me
  }
}
```

### Unlike Tweet
```graphql
mutation UnlikeTweet($tweetId: String!) {
  unlikeTweet(tweetId: $tweetId) {
    id
    likes_count
    is_liked_by_me
  }
}
```

### Retweet
```graphql
mutation Retweet($tweetId: String!) {
  retweet(tweetId: $tweetId) {
    id
    retweets_count
    is_retweeted_by_me
  }
}
```

### Remove Retweet
```graphql
mutation RemoveRetweet($tweetId: String!) {
  removeRetweet(tweetId: $tweetId) {
    id
    retweets_count
    is_retweeted_by_me
  }
}
```

## Subscriptions (WebSocket)

### New Tweet Posted
```graphql
subscription OnNewTweet {
  newTweet {
    id
    content
    created_at
    user {
      id
      name
      avatar_url
    }
  }
}
```

### Tweet Liked
```graphql
subscription OnTweetLiked($tweetId: String!) {
  tweetLiked(tweetId: $tweetId) {
    id
    likes_count
    liked_by {
      id
      name
    }
  }
}
```

### User Followed
```graphql
subscription OnUserFollowed {
  userFollowed {
    id
    name
    avatar_url
  }
}
```

## Error Responses

### Unauthorized
```json
{
  "errors": [
    {
      "message": "Unauthorized",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

### Validation Error
```json
{
  "errors": [
    {
      "message": "Content is required",
      "extensions": {
        "code": "VALIDATION_ERROR"
      }
    }
  ]
}
```

### Not Found
```json
{
  "errors": [
    {
      "message": "Tweet not found",
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ]
}
```

### Duplicate
```json
{
  "errors": [
    {
      "message": "User already liked this tweet",
      "extensions": {
        "code": "DUPLICATE"
      }
    }
  ]
}
```

## Rate Limiting

- **Rate Limit**: 100 requests per minute per IP
- **Headers Returned**:
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 99
  - `X-RateLimit-Reset`: Unix timestamp

## Pagination

### Limit and Offset
```graphql
query {
  homeFeed(limit: 20, offset: 0) {
    id
    content
  }
}
```

### Cursor-based (Planned)
```graphql
query {
  homeFeed(limit: 20, after: "cursor-token") {
    edges {
      cursor
      node {
        id
        content
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

## Testing with Apollo Studio

1. Navigate to: `http://localhost:4100/graphql`
2. Use built-in explorer
3. Authenticate first with login mutation
4. Execute queries and mutations

## Common Query Patterns

### Get Feed with Nested Data
```graphql
query {
  homeFeed(limit: 20) {
    id
    content
    created_at
    user {
      id
      name
      avatar_url
      followers_count
    }
    liked_by(limit: 3) {
      id
      name
      avatar_url
    }
    likes_count
    retweets_count
    is_liked_by_me
    is_retweeted_by_me
  }
}
```

### Get User with Stats
```graphql
query {
  me {
    id
    name
    email
    avatar_url
    bio
    website
    tweets_count
    followers_count
    following_count
    followers(limit: 5) {
      id
      name
      avatar_url
    }
  }
}
```

### Create Tweet with Response
```graphql
mutation {
  createTweet(content: "Hello world!") {
    id
    content
    created_at
    user {
      id
      name
    }
    likes_count
  }
}
```

## Performance Tips

1. **Only request needed fields**: GraphQL returns only requested fields
2. **Use pagination**: Limit results with limit/offset to reduce data transfer
3. **Cache results**: Apollo Client automatically caches query results
4. **Batch operations**: Use multiple mutations in single request if possible
5. **Subscribe selectively**: Only subscribe to specific tweet events, not all

## API Health Check

```graphql
query {
  __typename
}
```

This simple query tests API connectivity without authentication.
