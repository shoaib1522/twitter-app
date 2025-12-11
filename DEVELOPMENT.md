# Development Guide

## Development Environment Setup

### Prerequisites
- Git installed
- Docker and Docker Compose
- Node.js 10.15.0 (or use Docker)
- Code editor (VS Code recommended)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/shoaib1522/twitter-app.git
cd twitter-app

# Install dependencies (optional - Docker handles this)
cd packages/server && yarn install
cd ../client && yarn install
cd ../..

# Start development environment
docker-compose up --build

# Access services
# Frontend: http://localhost:3000
# API: http://localhost:4100/graphql
# Database: localhost:5432
```

## Project Structure

```
twitter-app/
├── packages/
│   ├── client/                      # React/Next.js Frontend
│   │   ├── pages/                   # Next.js pages (routing)
│   │   │   ├── _app.js              # App wrapper with Apollo provider
│   │   │   ├── index.js             # Home page
│   │   │   ├── login.js             # Login page
│   │   │   ├── signup.js            # Signup page
│   │   │   ├── home.js              # Home feed
│   │   │   ├── profile/[username].js # User profile
│   │   │   └── _error.js            # Error page
│   │   │
│   │   ├── components/              # React components
│   │   │   ├── Tweet.js             # Tweet display component
│   │   │   ├── TweetForm.js         # Tweet creation form
│   │   │   ├── UserCard.js          # User profile card
│   │   │   ├── NavBar.js            # Navigation bar
│   │   │   ├── Timeline.js          # Timeline wrapper
│   │   │   └── ...
│   │   │
│   │   ├── queries/                 # GraphQL queries
│   │   │   ├── user.js              # User queries
│   │   │   ├── tweet.js             # Tweet queries
│   │   │   └── auth.js              # Auth mutations
│   │   │
│   │   ├── lib/                     # Utilities
│   │   │   ├── apolloClient.js      # Apollo client setup
│   │   │   ├── auth.js              # Auth utilities
│   │   │   └── formatters.js        # Data formatters
│   │   │
│   │   ├── server/                  # Next.js server (SSR)
│   │   │   └── index.js             # Express server setup
│   │   │
│   │   ├── styles/                  # Global styles
│   │   ├── public/                  # Static assets
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── server/                      # Node.js/Express Backend
│       ├── src/
│       │   ├── index.js             # Server entry point
│       │   ├── typedefs/            # GraphQL type definitions
│       │   │   ├── user.graphql
│       │   │   ├── tweet.graphql
│       │   │   ├── follow.graphql
│       │   │   └── like.graphql
│       │   │
│       │   ├── resolvers/           # GraphQL resolvers
│       │   │   ├── Query.js         # Root query resolvers
│       │   │   ├── Mutation.js      # Mutation resolvers
│       │   │   ├── User.js          # User field resolvers
│       │   │   ├── Tweet.js         # Tweet field resolvers
│       │   │   └── ...
│       │   │
│       │   ├── db/                  # Database configuration
│       │   │   └── connection.js    # Knex connection setup
│       │   │
│       │   ├── migrations/          # Database migrations
│       │   │   ├── 001_create_users_table.js
│       │   │   ├── 002_create_tweets_table.js
│       │   │   ├── 003_create_follows_table.js
│       │   │   └── ...
│       │   │
│       │   ├── seeds/               # Seed data
│       │   │   ├── index.js
│       │   │   └── factories.js
│       │   │
│       │   ├── middleware/          # Express middleware
│       │   │   ├── auth.js          # Authentication middleware
│       │   │   ├── validation.js    # Input validation
│       │   │   └── errorHandler.js  # Error handling
│       │   │
│       │   └── __tests__/           # Test files
│       │       ├── auth.test.js
│       │       ├── tweet.test.js
│       │       └── ...
│       │
│       ├── dist/                    # Compiled JavaScript (production)
│       ├── .babelrc                 # Babel configuration
│       ├── .eslintrc.json          # ESLint configuration
│       ├── package.json
│       ├── knexfile.js             # Knex configuration
│       └── jest.config.js           # Jest configuration
│
├── docker-compose.yml              # Container orchestration
├── Dockerfile                      # Multi-stage build
├── README.md                       # Project overview
└── [DOCUMENTATION FILES]
    ├── DOCKER_SETUP.md
    ├── BIG_DATA_CONCEPTS.md
    ├── FEATURES.md
    ├── API_DOCUMENTATION.md
    ├── DATABASE_SCHEMA.md
    ├── DEPLOYMENT.md
    ├── TESTING.md
    └── DEVELOPMENT.md (this file)
```

## Backend Development

### Adding a New Feature

#### 1. Create Database Migration
```bash
# Generate migration file
docker-compose exec api sh -c "cd packages/server && yarn migrate create add_column_to_table"
```

Edit migration file:
```javascript
exports.up = (knex) => {
  return knex.schema.table('tweets', (table) => {
    table.string('media_url');
  });
};

exports.down = (knex) => {
  return knex.schema.table('tweets', (table) => {
    table.dropColumn('media_url');
  });
};
```

Run migration:
```bash
docker-compose exec api sh -c "cd packages/server && yarn migrate"
```

#### 2. Create GraphQL Type Definition
File: `packages/server/src/typedefs/mediaUpload.graphql`
```graphql
type Media {
  id: ID!
  url: String!
  type: MediaType!
  tweet: Tweet
}

enum MediaType {
  IMAGE
  VIDEO
  GIF
}

extend type Mutation {
  uploadMedia(file: Upload!): Media!
}
```

#### 3. Create Resolver
File: `packages/server/src/resolvers/Mutation/uploadMedia.js`
```javascript
import path from 'path';
import { createWriteStream } from 'fs';

export default {
  uploadMedia: async (_, { file }, { req, db }) => {
    if (!req.user) {
      throw new Error('Unauthorized');
    }

    const { filename, createReadStream } = await file;
    const stream = createReadStream();
    const filePath = path.join(__dirname, `../../public/uploads/${Date.now()}-${filename}`);

    return new Promise((resolve, reject) => {
      stream
        .pipe(createWriteStream(filePath))
        .on('finish', async () => {
          const media = await db('media').insert({
            url: `/uploads/${path.basename(filePath)}`,
            type: 'IMAGE',
            user_id: req.user.id
          }).returning('*');

          resolve(media[0]);
        })
        .on('error', reject);
    });
  }
};
```

#### 4. Write Tests
File: `packages/server/src/__tests__/media.test.js`
```javascript
describe('Media Upload', () => {
  test('should upload image file', async () => {
    const response = await request(app)
      .post('/graphql')
      .field('operations', JSON.stringify({
        query: `mutation UploadMedia($file: Upload!) { uploadMedia(file: $file) { id url } }`,
        variables: { file: null }
      }))
      .field('map', JSON.stringify({ 0: ['variables.file'] }))
      .attach('0', 'test-image.jpg');

    expect(response.status).toBe(200);
    expect(response.body.data.uploadMedia.url).toContain('/uploads/');
  });
});
```

### Common Development Tasks

#### Working with Resolvers
```javascript
// packages/server/src/resolvers/Query/homeFeed.js
import { offset, limit } from '../../utils/pagination';

export default {
  homeFeed: async (_, { limit: l = 20, offset: o = 0 }, { db, req }) => {
    if (!req.user) {
      throw new Error('Unauthorized');
    }

    const tweets = await db.raw(`
      SELECT t.*, u.name, u.avatar_url,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT r.id) as retweets_count
      FROM tweets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN likes l ON t.id = l.tweet_id
      LEFT JOIN retweets r ON t.id = r.tweet_id
      WHERE t.user_id = ?
         OR t.user_id IN (
           SELECT following_id FROM follows
           WHERE follower_id = ?
         )
      GROUP BY t.id, u.id
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, req.user.id, l, o]);

    return tweets;
  }
};
```

#### Working with DataLoaders
```javascript
// Prevent N+1 query problem
import DataLoader from 'dataloader';

const userLoader = new DataLoader(async (userIds) => {
  const users = await db('users').whereIn('id', userIds);
  return userIds.map(id => users.find(u => u.id === id));
});

const context = {
  userLoader,
  db,
  req
};

// In resolver
const user = await context.userLoader.load(tweet.user_id);
```

#### Middleware Usage
```javascript
// Custom authentication middleware
export const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Input validation
export const validateTweet = (req, res, next) => {
  const { content } = req.body;
  if (!content || content.length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }
  if (content.length > 280) {
    return res.status(400).json({ error: 'Content must be 280 characters or less' });
  }
  next();
};
```

## Frontend Development

### Adding a New Page

#### 1. Create Page File
```jsx
// packages/client/pages/explore.js
import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import TweetList from '../components/TweetList';
import Layout from '../components/Layout';

const EXPLORE_QUERY = gql`
  query ExploreTweets($limit: Int) {
    exploreTweets(limit: $limit) {
      id
      content
      user {
        id
        name
        avatar_url
      }
      likes_count
      created_at
    }
  }
`;

export default function ExplorePage() {
  const { data, loading, error } = useQuery(EXPLORE_QUERY, {
    variables: { limit: 50 }
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Layout>
      <div className="explore-container">
        <h1>Explore</h1>
        <TweetList tweets={data.exploreTweets} />
      </div>
    </Layout>
  );
}
```

### Adding a New Component

```jsx
// packages/client/components/SearchBox.js
import React, { useState, useRef } from 'react';
import { useLazyQuery, gql } from '@apollo/client';

const SEARCH_QUERY = gql`
  query Search($query: String!) {
    searchTweets(query: $query) {
      id
      content
      user {
        name
        avatar_url
      }
    }
  }
`;

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [search, { data, loading }] = useLazyQuery(SEARCH_QUERY);
  const inputRef = useRef();

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 2) {
      search({ variables: { query: value } });
    }
  };

  return (
    <div className="search-box">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search tweets..."
        value={query}
        onChange={handleSearch}
      />
      {loading && <div>Searching...</div>}
      {data?.searchTweets && (
        <ul className="search-results">
          {data.searchTweets.map(tweet => (
            <li key={tweet.id}>{tweet.content}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Styling Approach

Using styled-jsx (CSS-in-JS):
```jsx
// packages/client/components/Tweet.js
import React from 'react';

export default function Tweet({ tweet }) {
  return (
    <div className="tweet">
      <div className="avatar">
        <img src={tweet.user.avatar_url} alt={tweet.user.name} />
      </div>
      <div className="content">
        <h3>{tweet.user.name}</h3>
        <p>{tweet.content}</p>
        <div className="actions">
          <button className="like-btn">❤️ {tweet.likes_count}</button>
          <button className="retweet-btn">🔄 {tweet.retweets_count}</button>
        </div>
      </div>

      <style jsx>{`
        .tweet {
          display: flex;
          padding: 16px;
          border-bottom: 1px solid #eee;
        }

        .avatar {
          margin-right: 12px;
        }

        .avatar img {
          width: 48px;
          height: 48px;
          border-radius: 50%;
        }

        .content {
          flex: 1;
        }

        .content h3 {
          margin: 0 0 4px 0;
          font-weight: 700;
          color: #000;
        }

        .content p {
          margin: 0 0 12px 0;
          color: #333;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .like-btn, .retweet-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #657786;
        }

        .like-btn:hover, .retweet-btn:hover {
          color: #1da1f2;
        }
      `}</style>
    </div>
  );
}
```

## Debugging

### Backend Debugging

```bash
# View API logs
docker-compose logs -f api

# Debug with node inspector
docker-compose exec api node --inspect=0.0.0.0:9229 --require @babel/register src/index.js

# Then connect with DevTools at chrome://inspect
```

### Frontend Debugging

```bash
# View client logs
docker-compose logs -f client

# Open DevTools in browser (F12)
# Check Network tab for API requests
# Check Console tab for JavaScript errors
```

### Database Debugging

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U postgres -d postgres

# Common queries
SELECT * FROM users LIMIT 10;
SELECT * FROM tweets ORDER BY created_at DESC LIMIT 5;
SELECT user_id, COUNT(*) as tweet_count FROM tweets GROUP BY user_id;
```

## Performance Tips

### Backend Optimization
1. **Use indexes** on frequently queried columns
2. **Batch queries** with DataLoader
3. **Cache results** with Redis for expensive queries
4. **Connection pooling** for database efficiency
5. **Lazy load** related data only when needed

### Frontend Optimization
1. **Code splitting** with Next.js dynamic imports
2. **Image optimization** with next/image component
3. **Lazy loading** components with Suspense
4. **Apollo cache** for query results
5. **Debounce** search and input handlers

### Database Optimization
1. **Index strategy** on foreign keys and frequently filtered columns
2. **Query analysis** with EXPLAIN ANALYZE
3. **Pagination** to limit result sets
4. **Connection pooling** to reduce overhead

## Git Workflow

### Feature Branch Development
```bash
# Create feature branch
git checkout -b feature/tweet-reactions

# Make changes and commit
git add .
git commit -m "feat: Add emoji reactions to tweets"

# Push to remote
git push -u origin feature/tweet-reactions

# Create pull request on GitHub
```

### Commit Message Convention
```
type(scope): subject

body (optional)

footer (optional)
```

Types: feat, fix, docs, style, refactor, test, chore

Example:
```
feat(tweets): Add emoji reactions

- Allow users to react with emoji
- Store reactions in database
- Display reaction counts on timeline

Closes #123
```

## Hot Reloading

### API Changes
- Nodemon automatically restarts server on file changes in packages/server/src
- No manual restart needed

### Frontend Changes
- Next.js HMR updates pages without full reload
- Component changes reflect immediately

### Database Schema Changes
- Require manual migration
- Restart not needed if using hot reload

## Troubleshooting

### API Not Responding
```bash
# Check logs
docker-compose logs api

# Restart service
docker-compose restart api

# Rebuild if dependencies changed
docker-compose up --build api
```

### Frontend Not Loading
```bash
# Check logs
docker-compose logs client

# Restart service
docker-compose restart client

# Clear next cache
docker-compose exec client rm -rf .next
```

### Database Connection Error
```bash
# Check database health
docker-compose exec db pg_isready -U postgres

# Restart database
docker-compose restart db

# Rebuild everything
docker-compose down -v
docker-compose up --build
```

## Useful Commands

```bash
# Stop all services
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# View resource usage
docker stats

# Execute bash in container
docker-compose exec api bash

# Copy file from container
docker cp twitter-app_api_1:/app/file.txt ./

# Build specific service
docker-compose build api
```

## Code Style

### ESLint Configuration
The project uses ESLint for code quality:
```bash
# Check code style
docker-compose exec api yarn lint

# Fix auto-fixable issues
docker-compose exec api yarn lint --fix
```

### Prettier Formatting
```bash
# Format code
docker-compose exec api yarn prettier --write src/**/*.js
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Knex.js Documentation](http://knexjs.org/)
- [Docker Documentation](https://docs.docker.com/)
