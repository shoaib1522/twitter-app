# Security Guidelines and Best Practices

## Overview

This document outlines security best practices for the Twitter clone application, covering authentication, data protection, API security, and deployment security.

## Authentication & Authorization

### Password Security

#### Storage
- **Algorithm**: bcryptjs with 10 salt rounds
- **Never store plaintext** passwords in database
- **Hash comparison**: Constant-time comparison to prevent timing attacks

```javascript
// Password hashing during signup
const hashedPassword = await bcryptjs.hash(password, 10);

// Password verification during login
const isValid = await bcryptjs.compare(inputPassword, storedHash);
```

#### Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

#### Reset Flow
1. User requests password reset
2. Send secure token via email (NOT in URL parameter)
3. Token expires after 24 hours
4. Verify token before allowing password change

### Session Management

#### Session Security
- **Storage**: Database-backed sessions via connect-session-knex
- **Duration**: 24-hour expiration
- **Secure Cookie**: HttpOnly flag prevents JavaScript access
- **HTTPS Only**: Secure flag requires HTTPS in production

```javascript
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);

app.use(session({
  store: new KnexSessionStore({ knex: db }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    httpOnly: true,                                  // No JS access
    maxAge: 24 * 60 * 60 * 1000,                    // 24 hours
    sameSite: 'Strict'                              // CSRF protection
  }
}));
```

#### Session Invalidation
- Logout immediately invalidates session
- Expired sessions automatically cleaned up
- Session hijacking detected via IP/User-Agent change

### Multi-Factor Authentication (Future Enhancement)

Planned implementation:
1. TOTP (Time-based One-Time Password) via authenticator apps
2. Email verification codes
3. SMS-based OTP

## Input Validation & Sanitization

### Server-Side Validation

#### Graphql Resolver Validation
```javascript
export const createTweet = {
  args: {
    content: {
      type: new GraphQLNonNull(GraphQLString),
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          throw new Error('Content is required');
        }
        if (value.length > 280) {
          throw new Error('Content must be 280 characters or less');
        }
        return true;
      }
    }
  },
  resolve: async (_, { content }, { db, req }) => {
    // Additional checks
    if (!req.user) throw new Error('Unauthorized');

    // Sanitize to prevent XSS
    const sanitized = sanitizeHTML(content);

    // Insert into database
    return db('tweets').insert({
      user_id: req.user.id,
      content: sanitized
    });
  }
};
```

#### Input Types to Validate
- Email: Valid format, domain exists
- URL: Valid format, safe protocol
- Numbers: Range checks
- Strings: Length, character restrictions
- Files: Type, size, virus scan

### Client-Side Validation
- Email format validation
- Password strength indicator
- Required field checks
- Real-time feedback

### SQL Injection Prevention

#### Use Parameterized Queries
```javascript
// ✅ SAFE: Parameterized query
const user = await db('users')
  .where('email', email)
  .where('password_hash', hash)
  .first();

// ✅ SAFE: Knex.js prevents injection
const tweets = await db('tweets')
  .whereIn('user_id', userIds)
  .where('created_at', '>', date);

// ❌ NEVER: String concatenation
const user = await db.raw(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### XSS (Cross-Site Scripting) Prevention

#### Content Security Policy
```javascript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://api.example.com'],
    fontSrc: ["'self'", 'https://fonts.googleapis.com'],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
}));
```

#### HTML Sanitization
```javascript
const DOMPurify = require('isomorphic-dompurify');

// Sanitize user-provided HTML
const sanitized = DOMPurify.sanitize(userContent);

// Allow only safe tags
const whitelist = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'br'],
  allowedAttributes: {
    'a': ['href', 'title']
  }
};
```

### CSRF (Cross-Site Request Forgery) Prevention

#### Token Generation
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: false });

app.use(csrfProtection);

// Include token in form
app.get('/form', csrfProtection, (req, res) => {
  res.send(`
    <form action="/process" method="POST">
      <input type="hidden" name="_csrf" value="${req.csrfToken()}">
      <!-- form fields -->
    </form>
  `);
});

// Verify token on submission
app.post('/process', csrfProtection, (req, res) => {
  // Token automatically verified
  res.send('Success!');
});
```

## API Security

### CORS (Cross-Origin Resource Sharing)

#### Safe Configuration
```javascript
const cors = require('cors');

const whitelist = [
  'https://example.com',
  'https://www.example.com',
  'http://localhost:3000' // Development only
];

app.use(cors({
  origin: (origin, callback) => {
    if (whitelist.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Rate Limiting

#### Implementation
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user && req.user.isAdmin
});

const createLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 5,                     // 5 tweets per minute
  message: 'Too many tweets created, please slow down.'
});

app.use('/graphql', limiter);
app.post('/graphql', createLimiter);
```

### HTTPS/TLS

#### Configuration
- **Minimum Version**: TLS 1.2 or higher
- **Cipher Suites**: Strong ciphers only
- **Certificate**: Valid, non-expired, wildcard or SAN
- **HSTS**: Force HTTPS redirection

```javascript
// Enforce HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// HSTS header
app.use(helmet.hsts({
  maxAge: 31536000,  // 1 year
  includeSubDomains: true,
  preload: true
}));
```

## Data Protection

### Encryption at Rest

#### Database Encryption
```sql
-- PostgreSQL full-disk encryption
-- Use dm-crypt (Linux) or BitLocker (Windows)

-- Column-level encryption
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  email_encrypted TEXT  -- pgcrypto
);

-- Encrypt sensitive data
UPDATE users SET email_encrypted = pgp_sym_encrypt(email, 'secret_key');
```

#### Sensitive Data Masking
```javascript
// Never log passwords or tokens
const logger = (req, res, next) => {
  const log = { ...req.body };
  delete log.password;
  delete log.token;
  console.log(log);
  next();
};
```

### Encryption in Transit

#### HTTPS Enforcement
- All API endpoints require HTTPS
- Redirect HTTP to HTTPS
- HSTS headers force browser compliance

#### API Key Security
```javascript
// Store API keys in environment variables
const apiKey = process.env.STRIPE_API_KEY;

// Never commit secrets
// .env file in .gitignore
process.env.SECRET_KEY = 'never-hardcode-secrets';

// Use AWS Secrets Manager or HashiCorp Vault
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

const secret = await secretsManager.getSecretValue({
  SecretId: 'twitter-app/db-password'
}).promise();
```

## Dependency Security

### Dependency Scanning

#### Regular Updates
```bash
# Check for vulnerable packages
npm audit

# Fix automatically
npm audit fix

# Manual review
npm audit fix --dry-run

# Update dependencies safely
npm update
```

#### Package Lock Files
- Always commit package-lock.json
- Ensures reproducible builds
- Prevents supply-chain attacks

#### Trusted Sources Only
```json
{
  "registry": "https://registry.npmjs.org/",
  "npmRegistryUrl": "https://registry.npmjs.org/"
}
```

## Database Security

### Access Control

#### User Permissions
```sql
-- Create limited user for application
CREATE USER twitter_app WITH PASSWORD 'strong_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE twitter TO twitter_app;
GRANT USAGE ON SCHEMA public TO twitter_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO twitter_app;

-- Remove excessive permissions
REVOKE SUPERUSER ON DATABASE postgres FROM twitter_app;
```

#### Connection Security
- Require password authentication
- Use SSL connections
- Whitelist IP addresses in production

```javascript
// PostgreSQL connection with SSL
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false // Only in production with valid cert
    }
  }
});
```

### Data Backups

#### Backup Security
```bash
# Encrypted backup
pg_dump -U postgres -d twitter | gpg --symmetric > backup.sql.gpg

# Store in secure location (S3 with encryption)
aws s3 cp backup.sql.gpg s3://secure-backups/ --sse AES256

# Retention policy: Keep 30 days
```

#### Backup Testing
- Test restores monthly
- Verify data integrity
- Time recovery procedures

## Monitoring & Logging

### Security Logging

#### What to Log
- Failed login attempts
- Unauthorized API access
- Rate limit violations
- Data modification operations
- Admin actions

```javascript
const logger = require('winston');

// Log security events
logger.warn('Failed login attempt', {
  email: req.body.email,
  ip: req.ip,
  timestamp: new Date()
});

logger.error('Unauthorized API access', {
  userId: req.user?.id,
  endpoint: req.path,
  ip: req.ip
});
```

#### Log Retention
- Keep security logs for 90+ days
- Encrypt logs at rest
- Audit log access

### Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet()); // Sets multiple security headers

// Individual headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

## Incident Response

### Security Incident Procedures

1. **Detection**: Monitor for unusual activity
2. **Containment**: Isolate affected systems
3. **Investigation**: Determine root cause
4. **Eradication**: Remove threats
5. **Recovery**: Restore normal operations
6. **Post-Incident**: Review and improve

### Password Breach Response

```javascript
// Force password reset for affected users
app.post('/force-password-reset/:userId', async (req, res) => {
  // Verify admin privilege
  if (!req.user?.isAdmin) throw new Error('Unauthorized');

  // Mark password as expired
  await db('users')
    .where('id', req.params.userId)
    .update({ password_reset_required: true });

  // Send reset email
  await sendPasswordResetEmail(user.email);

  res.json({ success: true });
});
```

### Data Breach Response

1. Notify affected users within 72 hours
2. Document what data was compromised
3. Describe measures being taken
4. Provide credit monitoring if needed

## Security Checklist

### Development
- [ ] Use environment variables for secrets
- [ ] Input validation on all endpoints
- [ ] Output encoding/escaping
- [ ] SQL injection prevention
- [ ] CSRF token usage
- [ ] Secure session handling
- [ ] Password hashing (bcryptjs)
- [ ] HTTPS enforcement

### Deployment
- [ ] Database user with limited privileges
- [ ] Encrypted database connections
- [ ] HTTPS with valid certificate
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Dependency audit passed
- [ ] Secrets in environment variables

### Ongoing
- [ ] Regular dependency updates
- [ ] Security log monitoring
- [ ] Monthly backup testing
- [ ] Quarterly penetration testing
- [ ] Annual security audit
- [ ] User access reviews
- [ ] Incident response plan updated

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax-lexical.html)
- [GraphQL Security](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
