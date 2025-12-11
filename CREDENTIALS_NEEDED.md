# Credentials & Configuration Required

## ✅ GOOD NEWS: NOTHING IS REQUIRED!

This Twitter clone runs **completely standalone** with **zero external dependencies**. No APIs, no credentials, no signups needed.

---

## 📋 What's Already Configured

### Database (PostgreSQL)
```
HOST: db (Docker container)
PORT: 5432
USER: twitterclone
PASSWORD: twitterclone
DATABASE: dev_twitter_clone
```
✅ **Automatically set up** - You don't need to do anything

### API Server
```
PORT: 4100
FRONTEND_URL: http://localhost:3000
NODE_ENV: development
```
✅ **Automatically configured** - Already in docker-compose.yml

### Frontend
```
API_URL: http://localhost:4100
PORT: 3000
```
✅ **Automatically configured** - Already in Next.js config

---

## 🔐 Authentication (Email/Password)

The app uses **built-in email/password authentication**. No OAuth needed.

### How It Works:
1. User signs up with email & password
2. Password is hashed with bcryptjs
3. User logs in with email & password
4. Session stored in database

### Pre-loaded Test Users:
After running `make reset-db`, these accounts exist:

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

Or create your own account during signup.

---

## 📝 Environment Variables Summary

### Server (.env)
```
FRONTEND_URL=http://localhost:3000
```
✅ Already created at: `packages/server/.env`

### Client (.env)
```
# No variables needed for client
```
✅ Already created at: `packages/client/.env`

### Docker Compose
```yaml
DATABASE_URL=postgres://twitterclone:twitterclone@db:5432/dev_twitter_clone
```
✅ Already set in docker-compose.yml

---

## 🚀 So What Do You Need To Do?

### **Option 1: Just Run It (Recommended)**
```bash
cd "d:\University (Data Science)\Semester 7\Big Data Analytics Lab\Project\twitter-app"
make dev
```

✅ That's it! Everything works automatically.

### **Option 2: Manual Run**
```bash
docker-compose up --build
```

Wait ~60 seconds, then open http://localhost:3000

---

## 🎯 What You Can Do Without Any Credentials

✅ Create accounts (sign up)
✅ Login with email/password
✅ Create tweets
✅ Like/retweet
✅ Follow users
✅ View profiles
✅ Query database
✅ See real-time updates

---

## 🔍 If You Want to Modify Configurations

### Change Database Credentials
Edit `docker-compose.yml`:
```yaml
db:
  environment:
    - POSTGRES_USER=your_user
    - POSTGRES_PASSWORD=your_password
    - POSTGRES_DB=your_db_name
```

Also update `packages/server/.env`:
```
DATABASE_URL=postgres://your_user:your_password@db:5432/your_db_name
```

### Change API Port
Edit `docker-compose.yml`:
```yaml
api:
  ports:
    - '4100:4100'  # Change first number
```

Update `TWITTER_SETUP_GUIDE.md` if you change ports.

### Change Frontend Port
Edit `docker-compose.yml`:
```yaml
client:  # Add this section if not present
  ports:
    - '3000:3000'  # Change first number
```

---

## 🔒 Security Note

**⚠️ DO NOT USE IN PRODUCTION**

These are hardcoded credentials for **local development only**:
- Weak password hashing
- No HTTPS
- Session stored in development mode
- No rate limiting
- No input validation

For production, add:
- Stronger password policies
- HTTPS/TLS
- Proper session management
- Rate limiting
- Input validation
- CORS restrictions

---

## ❓ FAQ

**Q: Do I need a Twitter API key?**
A: No! This is a complete standalone clone.

**Q: Do I need OAuth/GitHub authentication?**
A: No! Built-in email/password works.

**Q: Do I need any external services?**
A: No! Everything runs locally.

**Q: Can I run it without Docker?**
A: Yes, but you'd need to install Node.js, PostgreSQL manually. Docker is easier.

**Q: What if I want to use a cloud database?**
A: Change DATABASE_URL in docker-compose.yml to your cloud DB connection string.

**Q: Do I need to set up environment variables?**
A: Only the ones already created (.env files). No additional setup needed.

---

## 📊 Complete Setup Checklist

- ✅ Clone repository
- ✅ .env files created
- ✅ docker-compose.yml configured
- ✅ Database credentials set
- ✅ API port configured
- ✅ Frontend URL configured

**You're 100% ready to go!**

```bash
make dev
```

Open http://localhost:3000 and start using it.

---

## 🎓 Summary for Your Professor

"This Twitter clone requires **zero external credentials**. It's a completely self-contained application running on Docker with:
- PostgreSQL for data storage
- Node.js API with GraphQL
- React frontend
- Built-in authentication

Everything you need is included. Just run `make dev`."

---

**Next Step:** Run `make dev` and enjoy! 🚀
