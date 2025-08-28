# Video Platform Backend

A robust Node.js backend for a complete video streaming platform with user authentication, video management, search functionality, and library features.

## Features

- User registration and authentication with JWT tokens
- Video upload and management system
- Full-text search for videos and users
- User library features (Watch Later, History, Liked Videos)
- Comment and like system
- User subscriptions and playlists
- File upload handling with Cloudinary integration
- Rate limiting and security middleware
- MongoDB integration with optimized queries

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **File Storage:** Cloudinary
- **Security:** Helmet, CORS, Rate Limiting
- **Environment:** dotenv for configuration

## Prerequisites

Before running this application, make sure you have:

- Node.js 18 or higher installed
- MongoDB database (local or MongoDB Atlas)
- Cloudinary account for file uploads
- npm or yarn package manager

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd video-platform-backend
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env
```

4. Configure environment variables in `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/videodb
DB_NAME=videodb
ACCESS_TOKEN_SECRET=your_super_secure_access_token_secret
REFRESH_TOKEN_SECRET=your_super_secure_refresh_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d
CORS_ORIGIN=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
PORT=5000
```

5. Start the development server
```bash
npm run dev
```

The server will start on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `POST /api/users/refresh-token` - Refresh access token

### User Management
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/profile` - Update user profile
- `PATCH /api/users/avatar` - Update user avatar
- `PATCH /api/users/cover` - Update cover image
- `GET /api/users/search` - Search users

### Videos
- `GET /api/videos` - Get all published videos
- `POST /api/videos` - Upload new video
- `GET /api/videos/:id` - Get video by ID
- `PATCH /api/videos/:id` - Update video details
- `DELETE /api/videos/:id` - Delete video

### Search
- `GET /api/search/videos` - Search videos with filters
- `GET /api/search/users` - Search users
- `GET /api/search/suggestions` - Get search suggestions

### Library Features
- `GET /api/library/watchlater` - Get watch later videos
- `POST /api/library/watchlater` - Add video to watch later
- `DELETE /api/library/watchlater/:videoId` - Remove from watch later
- `GET /api/library/history` - Get watch history
- `POST /api/library/history` - Add video to history
- `DELETE /api/library/history` - Clear all history
- `GET /api/library/liked` - Get liked videos

### Social Features
- `POST /api/likes` - Like or unlike video
- `POST /api/comments` - Add comment to video
- `POST /api/subscriptions` - Subscribe to channel

## Database Setup

### MongoDB Indexes

Create these indexes for optimal performance:

```javascript
// Text search indexes
db.videos.createIndex({ title: "text", description: "text", tags: "text" });

// Performance indexes
db.videos.createIndex({ isPublished: 1, createdAt: -1 });
db.users.createIndex({ username: 1 });
db.users.createIndex({ email: 1 });
```

### Models

The application uses these main data models:
- **User** - User accounts and profiles
- **Video** - Video content and metadata
- **Comment** - Video comments and replies
- **Like** - User likes on videos and comments
- **Playlist** - User-created playlists
- **Subscription** - Channel subscriptions
- **WatchLater** - Saved videos for later viewing
- **WatchHistory** - User viewing history

## Development

### Project Structure
```
src/
├── controllers/     # Route handlers and business logic
├── middleware/      # Custom middleware functions
├── models/         # Database models and schemas
├── routes/         # API route definitions
├── utils/          # Utility functions and helpers
├── db/            # Database connection
└── app.js         # Express app configuration
```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (if configured)

### Code Style

This project follows standard JavaScript conventions with:
- ES6+ module syntax
- Async/await for asynchronous operations
- Proper error handling with try-catch blocks
- Consistent naming conventions

## Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on authentication endpoints
- CORS configuration for cross-origin requests
- Helmet for security headers
- Input validation and sanitization
- Environment variable protection

## Error Handling

The application includes comprehensive error handling:
- Global error handler middleware
- Custom API error classes
- Detailed error logging
- User-friendly error responses
- Graceful shutdown handling

## Production Deployment

### Environment Variables for Production
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/videodb
CORS_ORIGIN=https://your-frontend-domain.com
```

### Deployment Platforms

This backend is optimized for deployment on:
- Railway (recommended)
- Render
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Heroku

### Health Check

The application provides health check endpoints:
- `GET /` - Basic status check
- `GET /api/health` - Detailed health information

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api/docs`
- Review the health status at `/api/health`

## Version History

- v1.0.0 - Initial release with core features
- v1.1.0 - Added search functionality
- v1.2.0 - Added library features (Watch Later, History)
- v2.0.0 - Complete redesign with enhanced security
