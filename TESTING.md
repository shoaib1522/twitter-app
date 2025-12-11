# Testing and Quality Assurance Guide

## Testing Overview

This document outlines testing strategies for the Twitter clone application across unit tests, integration tests, and end-to-end tests.

## Unit Testing

### Backend Unit Tests

#### Setup
```bash
# Install testing dependencies (already in package.json)
cd packages/server
yarn install

# Run tests
yarn test
```

#### Authentication Tests
File: `src/__tests__/auth.test.js`

```javascript
describe('Authentication', () => {
  describe('Signup', () => {
    test('should create new user with valid email and password', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `
            mutation Signup($email: String!, $password: String!, $name: String!) {
              signup(email: $email, password: $password, name: $name) {
                id
                email
                name
              }
            }
          `,
          variables: {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.signup.email).toBe('test@example.com');
    });

    test('should reject duplicate email', async () => {
      // Signup first user
      await request(app)
        .post('/graphql')
        .send({ /* signup query */ });

      // Try to signup with same email
      const response = await request(app)
        .post('/graphql')
        .send({ /* signup query */ });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('duplicate');
    });
  });

  describe('Login', () => {
    test('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `
            mutation Login($email: String!, $password: String!) {
              login(email: $email, password: $password) {
                id
                email
              }
            }
          `,
          variables: {
            email: 'test@example.com',
            password: 'password123'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.login).toBeDefined();
    });

    test('should reject invalid password', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `
            mutation Login($email: String!, $password: String!) {
              login(email: $email, password: $password) {
                id
              }
            }
          `,
          variables: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        });

      expect(response.body.errors).toBeDefined();
    });
  });
});
```

Run auth tests:
```bash
yarn test:auth
```

#### Tweet Tests
File: `src/__tests__/tweet.test.js`

```javascript
describe('Tweets', () => {
  describe('Create Tweet', () => {
    test('should create tweet with valid content', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `
            mutation CreateTweet($content: String!) {
              createTweet(content: $content) {
                id
                content
                user {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            content: 'Hello world!'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.createTweet.content).toBe('Hello world!');
    });

    test('should reject empty content', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `
            mutation CreateTweet($content: String!) {
              createTweet(content: $content) {
                id
              }
            }
          `,
          variables: {
            content: ''
          }
        });

      expect(response.body.errors).toBeDefined();
    });

    test('should reject content over 280 characters', async () => {
      const longContent = 'a'.repeat(281);
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `
            mutation CreateTweet($content: String!) {
              createTweet(content: $content) {
                id
              }
            }
          `,
          variables: {
            content: longContent
          }
        });

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Get Tweets', () => {
    test('should get home feed', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `
            query {
              homeFeed(limit: 10) {
                id
                content
                user {
                  id
                  name
                }
              }
            }
          `
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.homeFeed)).toBe(true);
    });
  });

  describe('Like Tweet', () => {
    test('should like tweet', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `
            mutation LikeTweet($tweetId: String!) {
              likeTweet(tweetId: $tweetId) {
                id
                likes_count
                is_liked_by_me
              }
            }
          `,
          variables: {
            tweetId: 'tweet-id-123'
          }
        });

      expect(response.body.data.likeTweet.is_liked_by_me).toBe(true);
    });

    test('should not like same tweet twice', async () => {
      // Like once
      await request(app).post('/graphql').send({ /* first like */ });

      // Like again
      const response = await request(app)
        .post('/graphql')
        .send({ /* second like */ });

      expect(response.body.errors).toBeDefined();
    });
  });
});
```

Run tweet tests:
```bash
yarn test:tweet
```

### Frontend Unit Tests

#### Jest Configuration
File: `packages/client/jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};
```

#### Component Tests

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tweet from '../Tweet';

describe('Tweet Component', () => {
  test('renders tweet content', () => {
    const tweet = {
      id: '1',
      content: 'Hello world!',
      user: { name: 'John', avatar_url: 'https://...' },
      likes_count: 5,
      created_at: new Date()
    };

    render(<Tweet tweet={tweet} />);
    expect(screen.getByText('Hello world!')).toBeInTheDocument();
  });

  test('clicking like button triggers like mutation', async () => {
    const mockOnLike = jest.fn();
    const tweet = { /* ... */ };

    render(<Tweet tweet={tweet} onLike={mockOnLike} />);

    const likeButton = screen.getByRole('button', { name: /like/i });
    await userEvent.click(likeButton);

    expect(mockOnLike).toHaveBeenCalled();
  });
});
```

## Integration Testing

### API Integration Tests

Test multiple components working together:

```javascript
describe('User Flow Integration', () => {
  test('complete signup to tweet flow', async () => {
    // 1. Signup
    const signupResponse = await request(app)
      .post('/graphql')
      .send({
        query: `mutation { signup(...) { id email } }`,
        variables: { /* ... */ }
      });

    const userId = signupResponse.body.data.signup.id;

    // 2. Create tweet
    const tweetResponse = await request(app)
      .post('/graphql')
      .send({
        query: `mutation { createTweet(...) { id } }`,
        variables: { content: 'Hello!' }
      });

    const tweetId = tweetResponse.body.data.createTweet.id;

    // 3. Like tweet
    const likeResponse = await request(app)
      .post('/graphql')
      .send({
        query: `mutation { likeTweet(tweetId: "${tweetId}") { likes_count } }`
      });

    expect(likeResponse.body.data.likeTweet.likes_count).toBe(1);
  });

  test('follow user and see their tweets in feed', async () => {
    // 1. Create user 1 and user 2
    const user1 = await createUser('user1@test.com');
    const user2 = await createUser('user2@test.com');

    // 2. User2 creates tweet
    const tweet = await createTweet(user2.id, 'Hello from user2');

    // 3. User1 follows user2
    await followUser(user1.id, user2.id);

    // 4. Check user1's feed contains user2's tweet
    const feed = await getHomeFeed(user1.id);
    expect(feed.tweets).toContainEqual(expect.objectContaining({
      id: tweet.id,
      user: expect.objectContaining({ id: user2.id })
    }));
  });
});
```

### Database Integration Tests

Test database operations:

```javascript
describe('Database Operations', () => {
  beforeEach(async () => {
    // Clear database
    await knex('likes').delete();
    await knex('retweets').delete();
    await knex('follows').delete();
    await knex('tweets').delete();
    await knex('users').delete();
  });

  test('tweet deletion cascades to likes', async () => {
    const user = await createUser('test@test.com');
    const tweet = await createTweet(user.id, 'Content');
    const like = await likeTweet(user.id, tweet.id);

    // Delete tweet
    await deleteTweet(tweet.id);

    // Check like is deleted
    const likeExists = await knex('likes').where('id', like.id);
    expect(likeExists.length).toBe(0);
  });

  test('follow constraint prevents duplicate follows', async () => {
    const user1 = await createUser('user1@test.com');
    const user2 = await createUser('user2@test.com');

    await followUser(user1.id, user2.id);

    // Try to follow again
    expect(followUser(user1.id, user2.id)).rejects.toThrow();
  });
});
```

## End-to-End Testing

### Cypress Setup

Create `cypress.config.js`:

```javascript
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:3000',
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
  },
};
```

### User Flow Tests

File: `cypress/e2e/user-flow.cy.js`

```javascript
describe('User Complete Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should signup and create a tweet', () => {
    // Click signup
    cy.contains('Sign Up').click();

    // Fill form
    cy.get('input[name="email"]').type('newuser@test.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="name"]').type('New User');

    // Submit
    cy.get('button[type="submit"]').click();

    // Should redirect to home
    cy.url().should('include', '/home');

    // Create tweet
    cy.get('textarea[placeholder="What\'s happening?"]').type('My first tweet!');
    cy.get('button[aria-label="Tweet"]').click();

    // Tweet should appear
    cy.contains('My first tweet!').should('be.visible');
  });

  it('should follow user and see their tweets', () => {
    // Login
    cy.login('user1@test.com', 'password123');

    // Navigate to user profile
    cy.visit('/profile/user2');

    // Click follow
    cy.contains('Follow').click();

    // Follow button should change to "Following"
    cy.contains('Following').should('be.visible');

    // Go to home feed
    cy.visit('/home');

    // Should see user2's tweets
    cy.contains('User 2 Tweet').should('be.visible');
  });

  it('should like and unlike tweet', () => {
    cy.login('user1@test.com', 'password123');

    // Find tweet
    cy.get('[data-testid="tweet"]').first().as('tweet');

    // Get initial like count
    cy.get('@tweet').find('[data-testid="like-count"]').then($el => {
      const initialCount = parseInt($el.text());

      // Click like
      cy.get('@tweet').find('[aria-label="Like"]').click();

      // Count should increase
      cy.get('@tweet').find('[data-testid="like-count"]').should('contain', initialCount + 1);

      // Click unlike
      cy.get('@tweet').find('[aria-label="Unlike"]').click();

      // Count should decrease
      cy.get('@tweet').find('[data-testid="like-count"]').should('contain', initialCount);
    });
  });
});
```

### Custom Cypress Commands

File: `cypress/support/commands.js`

```javascript
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/home');
});

Cypress.Commands.add('createTweet', (content) => {
  cy.get('textarea[placeholder="What\'s happening?"]').type(content);
  cy.get('button[aria-label="Tweet"]').click();
  cy.contains(content).should('be.visible');
});
```

Run Cypress tests:
```bash
# Interactive mode
cypress open

# Headless mode
cypress run
```

## Performance Testing

### Load Testing with Apache JMeter

Create `load-test.jmx` plan:
1. Add HTTP Request Sampler for POST /graphql
2. Add Home Timeline query
3. Add constant timer (1000ms delay)
4. Configure thread group: 100 users, 1 minute ramp-up

Run test:
```bash
jmeter -n -t load-test.jmx -l results.jtl -j jmeter.log
jmeter -g results.jtl -o output_folder
```

### Artillery Load Testing

Create `load-test.yml`:
```yaml
config:
  target: 'http://localhost:4100'
  phases:
    - duration: 60
      arrivalRate: 10
      name: 'Warm up'
    - duration: 120
      arrivalRate: 50
      name: 'Ramp up'
    - duration: 60
      arrivalRate: 100
      name: 'Spike'

scenarios:
  - name: 'Get Home Feed'
    flow:
      - post:
          url: '/graphql'
          json:
            query: 'query { homeFeed(limit: 20) { id content } }'
```

Run test:
```bash
artillery run load-test.yml --output results.json
artillery report results.json
```

## Test Coverage

### Generate Coverage Report

```bash
# Backend coverage
cd packages/server
yarn test --coverage

# Frontend coverage
cd packages/client
yarn test --coverage
```

Target coverage:
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

## Continuous Integration

### GitHub Actions Test Workflow

File: `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:11.1-alpine
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2

      - uses: actions/setup-node@v2
        with:
          node-version: '10.15.0'

      - name: Install dependencies
        run: |
          cd packages/server && yarn install
          cd ../client && yarn install

      - name: Run backend tests
        run: cd packages/server && yarn test

      - name: Run frontend tests
        run: cd packages/client && yarn test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Manual Testing Checklist

### Authentication
- [ ] Signup with valid credentials
- [ ] Signup with duplicate email fails
- [ ] Login with correct credentials
- [ ] Login with wrong password fails
- [ ] Logout works correctly

### Tweet Operations
- [ ] Create tweet with text
- [ ] Create tweet with 280 characters (max)
- [ ] Cannot create tweet with 281+ characters
- [ ] Delete own tweet
- [ ] Cannot delete other user's tweet

### Social Features
- [ ] Follow user from profile
- [ ] Unfollow user
- [ ] View follower list
- [ ] View following list
- [ ] Like tweet
- [ ] Unlike tweet
- [ ] Retweet
- [ ] Remove retweet

### Timeline
- [ ] Home timeline shows own tweets
- [ ] Home timeline shows followed users' tweets
- [ ] User timeline shows only that user's tweets
- [ ] Newest tweets appear first
- [ ] Pagination works (load more)

### Search
- [ ] Search users by name
- [ ] Search tweets by content
- [ ] Search returns correct results
- [ ] Search with no results shows empty state

### UI/UX
- [ ] Responsive design on mobile
- [ ] Responsive design on tablet
- [ ] Responsive design on desktop
- [ ] All links work correctly
- [ ] Forms display error messages
- [ ] Loading indicators appear during async operations
- [ ] Toast notifications for actions (follow, like, etc.)
