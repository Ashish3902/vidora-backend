# Mandatory Steps Before Deploying Your Backend

## 1. Code and Environment Preparation

**Clean up your codebase**
- Remove all console.log statements and debug code
- Remove unused dependencies and imports
- Ensure no sensitive data is hardcoded in source files
- Fix any linting warnings or errors

**Set up environment variables**
```bash
# Create production .env file
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/videodb
ACCESS_TOKEN_SECRET=your_super_secure_64_character_secret
REFRESH_TOKEN_SECRET=your_super_secure_64_character_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGIN=https://your-frontend-domain.com
```

**Verify package.json**
```json
{
  "name": "video-platform-backend",
  "version": "1.0.0",
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  },
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "main": "index.js"
}
```

## 2. Database Configuration

**Set up MongoDB Atlas production database**
- Create production cluster on MongoDB Atlas
- Configure database user with proper permissions
- Whitelist IP addresses (0.0.0.0/0 for cloud platforms)
- Get correct connection string

**Create essential database indexes**
```javascript
// Text search indexes (mandatory for search functionality)
db.videos.createIndex({ 
  title: "text", 
  description: "text", 
  tags: "text" 
});

// Performance indexes
db.videos.createIndex({ isPublished: 1, createdAt: -1 });
db.users.createIndex({ username: 1 });
db.users.createIndex({ email: 1 });
db.users.createIndex({ _id: 1 });

// Library indexes
db.watchlater.createIndex({ user: 1, video: 1 });
db.watchhistory.createIndex({ user: 1, watchedAt: -1 });
```

## 3. Security Implementation

**Update CORS configuration**
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://your-frontend-domain.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

**Implement rate limiting**
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many authentication attempts'
});

app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
```

**Add security headers**
```javascript
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      mediaSrc: ["'self'", "https:"]
    }
  }
}));
```

## 4. Error Handling and Logging

**Add global error handler**
```javascript
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  const status = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;
    
  res.status(status).json({
    success: false,
    error: message
  });
});
```

**Implement graceful shutdown**
```javascript
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});
```

## 5. API Testing and Validation

**Test all critical endpoints**
- User registration and login
- Video upload and retrieval
- Search functionality
- Library features (watch later, history)
- File upload to Cloudinary
- Database connectivity

**Create test requests**
```bash
# Test health endpoint
curl https://your-backend-url.com/api/health

# Test authentication
curl -X POST https://your-backend-url.com/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test search
curl https://your-backend-url.com/api/search/videos?query=javascript
```

## 6. Performance Optimizations

**Add compression middleware**
```javascript
import compression from 'compression';

if (process.env.NODE_ENV === 'production') {
  app.use(compression());
}
```

**Optimize MongoDB connections**
```javascript
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${process.env.DB_NAME}`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    );
    console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection failed:", error);
    process.exit(1);
  }
};
```

## 7. Health Check and Monitoring

**Add comprehensive health check**
```javascript
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await mongoose.connection.db.admin().ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## 8. File and Dependency Verification

**Verify all required files exist**
- index.js (main entry point)
- app.js (Express configuration)
- All controller files
- All route files
- All model files
- Package.json with correct dependencies

**Check dependencies**
```bash
npm audit
npm audit fix
```

**Update to stable versions**
```bash
npm update
npm ls
```

## 9. Final Pre-deployment Checklist

**Environment variables checklist**
- [ ] MONGODB_URI points to production database
- [ ] ACCESS_TOKEN_SECRET is secure (64+ characters)
- [ ] REFRESH_TOKEN_SECRET is secure (64+ characters)
- [ ] CLOUDINARY credentials are correct
- [ ] CORS_ORIGIN matches frontend domain
- [ ] NODE_ENV set to 'production'

**Security checklist**
- [ ] No sensitive data in code
- [ ] .env file not committed to git
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Helmet security headers added
- [ ] Input validation in place

**Database checklist**
- [ ] Production database created
- [ ] All indexes created
- [ ] Database user configured
- [ ] Connection string tested
- [ ] IP whitelist configured

**Testing checklist**
- [ ] All API endpoints tested
- [ ] Authentication flow working
- [ ] File uploads working
- [ ] Search functionality working
- [ ] Library features working
- [ ] Error handling working

**Performance checklist**
- [ ] Compression enabled
- [ ] Database queries optimized
- [ ] Connection pooling configured
- [ ] Memory leaks checked

## 10. Deploy-Ready Commands

**Start the application**
```bash
npm install --production
npm start
```

**Verify deployment locally**
```bash
NODE_ENV=production npm start
```

After completing all these steps, your backend will be ready for deployment on any cloud platform. These preparations ensure a smooth deployment process and stable production environment.
