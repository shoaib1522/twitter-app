# System Architecture

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     User's Web Browser                         │
│                   (Client Application)                         │
└─────────────────────────────┬──────────────────────────────────┘
                              │ HTTP/WebSocket
                              ↓
┌──────────────────────────────────────────────────────────────┐
│               Load Balancer / Reverse Proxy                  │
│                    (Nginx/HAProxy)                           │
└─────────────────────────────┬────────────────────────────────┘
         ┌─────────────────────┼────────────────────────┐
         │                     │                        │
    ┌────↓────┐         ┌─────↓─────┐        ┌────────↓─────┐
    │ Frontend │         │ API Server │        │ API Server   │
    │(Node.js) │         │ (Node.js)  │        │  (Node.js)   │
    │ Port:    │         │  Port:     │        │  Port:       │
    │ 3000     │         │  4100      │        │  4100        │
    └────┬─────┘         └─────┬──────┘        └────────┬──────┘
         │                     │                        │
         └─────────────────────┼────────────────────────┘
                               │ TCP/IP
                               ↓
                   ┌───────────────────────┐
                   │   PostgreSQL DB       │
                   │   (Read/Write)        │
                   │   Port: 5432          │
                   │   Volume: postgres_data│
                   └───────────────────────┘
```

## Detailed Component Architecture

### 1. Frontend Layer (React/Next.js)

**Purpose**: User interface and client-side logic

**Technology Stack**:
- React.js - Component-based UI library
- Next.js - React framework with SSR/ISR
- Apollo Client - GraphQL client
- styled-jsx - CSS-in-JS styling
- Fetch API - HTTP requests

**Key Features**:
- Server-side rendering (SSR) for SEO
- Static site generation (SSG) for performance
- Automatic code splitting
- Hot module replacement (HMR) in development
- API proxy for development

**Directory Structure**:
```
packages/client/
├── pages/               # Next.js routes
├── components/          # React components
├── queries/             # GraphQL queries
├── lib/                 # Utilities (Apollo client setup, helpers)
├── styles/              # Global styles
├── public/              # Static assets
└── server/              # Express server for SSR
```

### 2. API Layer (Node.js/Express/GraphQL)

**Purpose**: Business logic and data access

**Technology Stack**:
- Node.js - JavaScript runtime
- Express.js - Web server framework
- Apollo Server - GraphQL server
- GraphQL - Query language and schema
- Knex.js - SQL query builder
- bcryptjs - Password hashing

**Key Features**:
- GraphQL API for flexible queries
- Stateless design for horizontal scaling
- Session-based authentication
- Input validation and error handling
- DataLoader for N+1 prevention
- CORS support

**Directory Structure**:
```
packages/server/
├── src/
│   ├── index.js              # Entry point
│   ├── typedefs/             # GraphQL schemas
│   ├── resolvers/            # GraphQL resolvers
│   ├── db/                   # Database configuration
│   ├── migrations/           # Schema migrations
│   ├── seeds/                # Test data
│   ├── middleware/           # Express middleware
│   └── __tests__/            # Tests
├── dist/                     # Compiled code
└── knexfile.js              # Knex configuration
```

### 3. Data Access Layer (PostgreSQL)

**Purpose**: Persistent data storage

**Technology Stack**:
- PostgreSQL 11.1 - Relational database
- Knex.js - Migration tool
- Connection pooling - Connection management

**Key Features**:
- ACID compliance for data integrity
- Foreign key constraints
- Composite unique constraints
- Indexed columns for performance
- Transactions for complex operations

**Tables**:
- users - User accounts and profiles
- tweets - Tweet content and metadata
- follows - Social graph relationships
- likes - User likes on tweets
- retweets - User retweets

## Request Flow

### 1. Authentication Flow

```
User Input (Email/Password)
        ↓
Frontend Form Validation
        ↓
GraphQL Mutation (signup/login)
        ↓
Express Request Handler
        ↓
Apollo Server Resolver
        ↓
Database Query (INSERT/SELECT)
        ↓
Password Hash Comparison (bcryptjs)
        ↓
Session Creation
        ↓
User Object Response
        ↓
Apollo Client Cache Update
        ↓
Frontend UI Update
```

### 2. Tweet Creation Flow

```
User Types Tweet
        ↓
Form Validation (not empty, < 280 chars)
        ↓
GraphQL Mutation (createTweet)
        ↓
Express Middleware (authentication check)
        ↓
Apollo Server Resolver
        ↓
Input Validation
        ↓
Database Insert (tweets table)
        ↓
Get User Data (JOIN users table)
        ↓
Return Tweet Object
        ↓
Apollo Cache Update
        ↓
UI Re-render with New Tweet
        ↓
WebSocket Notification (optional real-time)
```

### 3. Timeline Query Flow

```
User Opens Home Page
        ↓
Next.js getServerSideProps or useQuery Hook
        ↓
GraphQL Query (homeFeed)
        ↓
Express Request Handler
        ↓
Apollo Server Resolver
        ↓
SQL Query with JOINs
        ├─ SELECT tweets
        ├─ JOIN users
        ├─ LEFT JOIN likes
        └─ LEFT JOIN retweets
        ↓
PostgreSQL Database
        ↓
Aggregate Results (COUNT likes, retweets)
        ↓
Return Array of Tweet Objects
        ↓
Apollo Client Caches Results
        ↓
React Component Renders List
```

## Data Flow Between Components

### Frontend to Backend

```
React Component
    ↓
Apollo useQuery/useMutation Hook
    ↓
GraphQL Query/Mutation
    ↓
Apollo Client Caching
    ↓
HTTP POST to /graphql
    ↓
Express Middleware Chain
    ├─ Authentication Check
    ├─ CORS Handling
    ├─ Body Parsing
    └─ Error Handling
    ↓
Apollo Server
    ├─ Parse GraphQL Query
    ├─ Validate Against Schema
    └─ Execute Resolvers
    ↓
Database Query
    ↓
Response Object
    ↓
Apollo Client Updates Cache
    ↓
Component Re-renders
```

### Database to Frontend

```
Database (PostgreSQL)
    ↓
Resolver Function
    ├─ Format Results
    ├─ Load Related Data (DataLoader)
    └─ Handle Nested Fields
    ↓
GraphQL Response
    ↓
HTTP Response (JSON)
    ↓
Apollo Client Cache
    ↓
Normalized Store
    ↓
React Component
    ├─ Selector/Hook
    ├─ Computed Values
    └─ Render JSX
    ↓
Browser Display
```

## Scaling Architecture

### Horizontal Scaling (Multiple API Instances)

```
┌──────────────────────────────┐
│     Load Balancer            │
│   (Round Robin / Sticky)     │
└────────┬─────────────────────┘
         │
    ┌────┴────┬────────────┬─────────────┐
    │          │            │             │
┌───↓──┐  ┌───↓──┐   ┌────↓───┐  ┌─────↓──┐
│API #1 │  │API #2 │   │API #3  │  │API #N  │
└───┬──┘  └───┬──┘   └────┬───┘  └─────┬──┘
    │         │            │            │
    └─────────┼────────────┼────────────┘
              │
              ↓
        ┌────────────┐
        │PostgreSQL  │
        │+ Read Rep. │
        │+ Connection│
        │  Pool      │
        └────────────┘
```

**Benefits**:
- Distribute traffic across instances
- Stateless design enables scaling
- No session affinity required
- Handle 10x+ load

### Caching Layer Architecture

```
┌─────────────────────────────┐
│   Client (Browser Cache)    │
│   Apollo Client Cache       │
└────────────┬────────────────┘
             │
             ↓
┌──────────────────────────────┐
│   Application Cache (Redis)  │
│   - User profiles            │
│   - Tweet counts             │
│   - Trending topics          │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│   Database Query Cache       │
│   - Connection pooling       │
│   - Query result caching     │
│   - Database indexes         │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│   Database (PostgreSQL)      │
└──────────────────────────────┘
```

## Deployment Architecture

### Development Environment

```
Docker Host Machine
├── Docker Daemon
│   ├── API Container (Node.js)
│   ├── Client Container (Node.js + Next.js)
│   └── DB Container (PostgreSQL)
└── Docker Network (app-network)
```

### Production Environment

```
AWS/Cloud Provider
├── Load Balancer (Elastic Load Balancer)
├── Auto Scaling Group
│   └── Multiple EC2 Instances
│       ├── API Service (Docker Container)
│       └── Client Service (Docker Container)
├── RDS (Managed PostgreSQL)
├── ElastiCache (Redis for caching)
├── S3 (Media storage)
└── CloudFront (CDN)
```

## Security Architecture

```
┌────────────────────────────────┐
│     HTTPS / TLS 1.2+           │
└────────┬───────────────────────┘
         │
┌────────↓───────────────────────┐
│  WAF (Web Application Firewall)│
│  - Rate limiting               │
│  - DDoS protection             │
│  - Bot detection               │
└────────┬───────────────────────┘
         │
┌────────↓───────────────────────┐
│   API Server                   │
│  - CORS validation             │
│  - Input sanitization          │
│  - SQL injection prevention    │
│  - XSS protection              │
│  - CSRF tokens                 │
└────────┬───────────────────────┘
         │
┌────────↓───────────────────────┐
│   Authentication               │
│  - bcryptjs password hashing   │
│  - Session management          │
│  - JWT tokens (optional)       │
└────────┬───────────────────────┘
         │
┌────────↓───────────────────────┐
│   Database                     │
│  - Encrypted connections       │
│  - Parameterized queries       │
│  - Least privilege access      │
│  - Regular backups             │
└────────────────────────────────┘
```

## Performance Optimization Architecture

### Query Optimization

```
Client Request
    ↓
Apollo Cache Hit?
├─ YES → Return Cached Data
└─ NO → Continue
    ↓
GraphQL Query
    ↓
Resolver Execution
    ├─ Use DataLoader for batching
    ├─ Select only requested fields
    └─ Implement field-level caching
    ↓
Database Query
    ├─ Check indexes
    ├─ Use query optimization
    └─ Connection pooling
    ↓
Response
    ├─ Format data
    ├─ Cache result
    └─ Return to client
```

### Code Splitting Strategy

```
Frontend Bundle
├── Core Bundle (always loaded)
│   ├── Layout components
│   ├── Navigation
│   └─ Authentication flow
├── Page-specific Bundles
│   ├── Home (lazy loaded)
│   ├── Profile (lazy loaded)
│   └─ Search (lazy loaded)
└── Async Components
    ├── TweetForm (loaded on demand)
    ├── Modal dialogs (loaded on demand)
    └─ Search results (lazy loaded)
```

## Monitoring and Observability

```
┌─────────────────────────────┐
│   Application Metrics       │
│   - Request count           │
│   - Response time           │
│   - Error rate              │
└────────────┬────────────────┘
             │
┌────────────↓────────────────┐
│   Monitoring Stack          │
│   - Prometheus              │
│   - Grafana dashboards      │
│   - ELK Stack               │
└────────────┬────────────────┘
             │
┌────────────↓────────────────┐
│   Alerting                  │
│   - Email alerts            │
│   - Slack notifications     │
│   - PagerDuty escalation    │
└─────────────────────────────┘
```

## Disaster Recovery

```
┌─────────────────────────────┐
│   Primary Database          │
│   (Active)                  │
└────────────┬────────────────┘
             │
    ┌────────┴─────────────┐
    │                      │
┌───↓──────┐      ┌───────↓──┐
│Read Rep. │      │ Standby  │
│(Analytics)      │ (Failover)
└──────────┘      └──────────┘
    │                  │
    ├──────────┬───────┘
    │          │
┌───↓──────────↓──┐
│  Backup Store   │
│  (S3/Cloud)     │
└─────────────────┘
```

## Conclusion

This architecture provides:
- **Scalability**: Horizontal scaling of API servers
- **Reliability**: Database replication and backups
- **Performance**: Caching at multiple layers
- **Security**: Encrypted connections and validation
- **Maintainability**: Clear separation of concerns
- **Monitoring**: Comprehensive observability
