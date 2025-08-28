# Backend API Documentation for Frontend Integration

## 🚀 Overview

This is a **Node.js/Express.js** backend API for a social media platform with video sharing capabilities. The API uses **MongoDB** as the database, **JWT** for authentication, and **Cloudinary** for file uploads.

## 📋 Tech Stack

- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **CORS**: Enabled for cross-origin requests
- **Validation**: Custom validation with error handling

## 🌐 Base Configuration

### Server Details

- **Base URL**: `http://localhost:8000` (development)
- **Port**: 8000 (configurable via PORT environment variable)
- **CORS Origin**: `http://localhost:5173` (configurable via CORS_ORIGIN)

### Environment Variables Required

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 🔐 Authentication System

### JWT Token Management

- **Access Token**: Short-lived (1 day), sent via HTTP-only cookies
- **Refresh Token**: Long-lived (7 days), sent via HTTP-only cookies
- **Token Format**: `Bearer <token>` in Authorization header (fallback)

### Cookie Configuration

```javascript
// Access Token Cookie
{
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000 // 1 day
}

// Refresh Token Cookie
{
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}
```

## 📡 API Endpoints

### 1. User Management (`/api/users`)

#### Public Routes

```javascript
// Register new user
POST /api/users/register
Body: {
  username: string (3-30 chars, alphanumeric + underscore),
  email: string (valid email format),
  password: string (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char),
  fullName?: string (optional),
  avatar?: string (URL, optional),
  coverImage?: string (URL, optional)
}

// Login user
POST /api/users/login
Body: {
  email: string,
  password: string
}

// Reset password
POST /api/users/reset-password
Body: {
  email: string
}

// Refresh access token
POST /api/users/refresh-token
Body: {
  refreshToken: string
}
```

#### Protected Routes (Require JWT)

```javascript
// Get current user profile
GET /api/users/me
Headers: Authorization: Bearer <token>

// Update user profile
PUT /api/users/profile
Headers: Authorization: Bearer <token>
Body: {
  fullName?: string,
  avatar?: string,
  coverImage?: string,
  bio?: string
}

// Change password
PUT /api/users/change-password
Headers: Authorization: Bearer <token>
Body: {
  oldPassword: string,
  newPassword: string
}

// Logout user
POST /api/users/logout
Headers: Authorization: Bearer <token>

// Delete user account
DELETE /api/users/account
Headers: Authorization: Bearer <token>

// Search users
GET /api/users/search?q=<search_term>
Headers: Authorization: Bearer <token>

// Get user by ID
GET /api/users/:userId
Headers: Authorization: Bearer <token>
```

### 2. Video Management (`/api/videos`)

#### Public Routes

```javascript
// Get all videos (with pagination)
GET /api/videos?page=1&limit=10&category=General&sortBy=createdAt&sortOrder=desc

// Get trending videos
GET /api/videos/trending?limit=10&timeRange=7d

// Search videos
GET /api/videos/search?q=<search_term>&category=General&sortBy=relevance

// Get videos by user
GET /api/videos/user/:userId?page=1&limit=10

// Get valid video categories
GET /api/videos/categories
```

#### Protected Routes (Require JWT)

```javascript
// Upload new video
POST /api/videos
Headers: Authorization: Bearer <token>
Body: FormData {
  videoFile: File (required),
  thumbnail: File (required),
  title: string (3-100 chars),
  description?: string (max 2000 chars),
  category?: string (enum values),
  tags?: string[],
  isPrivate?: boolean,
  allowComments?: boolean,
  allowLikes?: boolean
}

// Get video by ID
GET /api/videos/:videoId
Headers: Authorization: Bearer <token>

// Update video
PATCH /api/videos/:videoId
Headers: Authorization: Bearer <token>
Body: FormData {
  thumbnail?: File,
  title?: string,
  description?: string,
  category?: string,
  tags?: string[],
  isPrivate?: boolean,
  allowComments?: boolean,
  allowLikes?: boolean
}

// Delete video
DELETE /api/videos/:videoId
Headers: Authorization: Bearer <token>

// Toggle video publish status
PATCH /api/videos/toggle/publish/:videoId
Headers: Authorization: Bearer <token>

// Get video statistics
GET /api/videos/stats/:videoId
Headers: Authorization: Bearer <token>

// Get video upload status
GET /api/videos/status/:videoId
Headers: Authorization: Bearer <token>
```

### 3. Comments (`/api/comments`)

#### Protected Routes (Require JWT)

```javascript
// Get video comments
GET /api/comments/:videoId?page=1&limit=10&sortBy=createdAt&sortOrder=desc
Headers: Authorization: Bearer <token>

// Add comment to video
POST /api/comments/:videoId
Headers: Authorization: Bearer <token>
Body: {
  content: string (required, max 1000 chars)
}

// Update comment
PATCH /api/comments/c/:commentId
Headers: Authorization: Bearer <token>
Body: {
  content: string (required, max 1000 chars)
}

// Delete comment
DELETE /api/comments/c/:commentId
Headers: Authorization: Bearer <token>
```

### 4. Likes (`/api/likes`)

#### Protected Routes (Require JWT)

```javascript
// Toggle video like
POST /api/likes/toggle/v/:videoId
Headers: Authorization: Bearer <token>

// Toggle comment like
POST /api/likes/toggle/c/:commentId
Headers: Authorization: Bearer <token>

// Toggle tweet like
POST /api/likes/toggle/t/:tweetId
Headers: Authorization: Bearer <token>

// Get user's liked videos
GET /api/likes/videos?page=1&limit=10
Headers: Authorization: Bearer <token>
```

### 5. Playlists (`/api/playlists`)

#### Protected Routes (Require JWT)

```javascript
// Create playlist
POST /api/playlists
Headers: Authorization: Bearer <token>
Body: {
  name: string (required),
  description?: string,
  isPrivate?: boolean
}

// Get playlist by ID
GET /api/playlists/:playlistId
Headers: Authorization: Bearer <token>

// Update playlist
PATCH /api/playlists/:playlistId
Headers: Authorization: Bearer <token>
Body: {
  name?: string,
  description?: string,
  isPrivate?: boolean
}

// Delete playlist
DELETE /api/playlists/:playlistId
Headers: Authorization: Bearer <token>

// Add video to playlist
PATCH /api/playlists/add/:videoId/:playlistId
Headers: Authorization: Bearer <token>

// Remove video from playlist
PATCH /api/playlists/remove/:videoId/:playlistId
Headers: Authorization: Bearer <token>

// Get user's playlists
GET /api/playlists/user/:userId?page=1&limit=10
Headers: Authorization: Bearer <token>
```

## 📊 Response Format

### Success Response

```javascript
{
  "statusCode": 200,
  "data": {
    // Response data
  },
  "message": "Success",
  "success": true
}
```

### Error Response

```javascript
{
  "statusCode": 400,
  "data": null,
  "message": "Error message",
  "success": false,
  "errors": [] // Optional validation errors
}
```

## 🔧 Data Models

### User Model

```javascript
{
  _id: ObjectId,
  username: String (unique, 3-30 chars),
  email: String (unique, lowercase),
  password: String (hashed, select: false),
  fullName: String (optional),
  avatar: String (URL, required),
  coverImage: String (URL, optional),
  bio: String (max 500 chars, optional),
  refreshToken: String (select: false),
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Video Model

```javascript
{
  _id: ObjectId,
  videoFile: String (Cloudinary URL, required),
  thumbnail: String (Cloudinary URL, required),
  title: String (3-100 chars, required),
  description: String (max 2000 chars, optional),
  duration: Number (seconds, required),
  views: Number (default: 0),
  likes: Number (default: 0),
  dislikes: Number (default: 0),
  isPublished: Boolean (default: true),
  category: String (enum values, default: "General"),
  tags: [String] (max 50 chars each),
  owner: ObjectId (ref: User, required),
  cloudinaryVideoId: String (required),
  cloudinaryThumbnailId: String,
  resolution: String,
  format: String,
  size: Number (bytes),
  watchTime: Number (seconds, default: 0),
  averageWatchTime: Number (seconds, default: 0),
  isPrivate: Boolean (default: false),
  allowComments: Boolean (default: true),
  allowLikes: Boolean (default: true),
  metaTitle: String (max 60 chars),
  metaDescription: String (max 160 chars),
  createdAt: Date,
  updatedAt: Date
}
```

### Video Categories

```javascript
[
  "General",
  "Music",
  "Gaming",
  "Education",
  "Entertainment",
  "Sports",
  "Technology",
  "Travel",
  "Food",
  "Fitness",
  "Comedy",
  "News",
  "How-to",
  "Vlog",
  "Other",
];
```

## 📁 File Upload

### Video Upload Requirements

- **Video File**: MP4, MOV, AVI, etc. (handled by Cloudinary)
- **Thumbnail**: JPG, PNG, WebP (handled by Cloudinary)
- **Max File Size**: 50MB (configurable)
- **Storage**: Cloudinary cloud storage

### Upload Process

1. Files are temporarily stored using Multer
2. Uploaded to Cloudinary for permanent storage
3. Cloudinary URLs are stored in database
4. Temporary files are cleaned up

## 🔒 Security Features

### Authentication

- JWT-based authentication
- HTTP-only cookies for token storage
- Refresh token rotation
- Password hashing with bcrypt
- Password validation requirements

### Input Validation

- Email format validation
- Password strength requirements
- Username format validation
- File type and size validation
- XSS protection

### CORS Configuration

- Configurable origin
- Credentials support
- Secure cookie settings

## 🚨 Error Handling

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `500`: Internal Server Error

### Error Response Structure

```javascript
{
  "statusCode": 400,
  "data": null,
  "message": "Validation failed",
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## 📝 Frontend Integration Tips

### 1. Authentication Flow

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch("/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Important for cookies
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

// Protected requests
const fetchProtectedData = async (url) => {
  const response = await fetch(url, {
    credentials: "include", // Include cookies
    headers: {
      Authorization: `Bearer ${accessToken}`, // Fallback
    },
  });
  return response.json();
};
```

### 2. File Upload

```javascript
const uploadVideo = async (formData) => {
  const response = await fetch("/api/videos", {
    method: "POST",
    credentials: "include",
    body: formData, // Don't set Content-Type header
  });
  return response.json();
};
```

### 3. Error Handling

```javascript
const handleApiError = (error) => {
  if (error.statusCode === 401) {
    // Redirect to login or refresh token
    refreshToken();
  } else if (error.statusCode === 400) {
    // Show validation errors
    showValidationErrors(error.errors);
  }
};
```

### 4. Pagination

```javascript
const fetchVideos = async (page = 1, limit = 10) => {
  const response = await fetch(`/api/videos?page=${page}&limit=${limit}`, {
    credentials: "include",
  });
  return response.json();
};
```

## 🔄 State Management Considerations

### User State

- Store user profile data
- Handle authentication state
- Manage token refresh logic

### Video State

- Cache video data
- Handle video upload progress
- Manage video player state

### UI State

- Loading states for API calls
- Error states and messages
- Pagination state

## 🎯 Best Practices

1. **Always include credentials** in fetch requests
2. **Handle token refresh** automatically
3. **Validate inputs** on frontend before sending
4. **Show loading states** during API calls
5. **Handle errors gracefully** with user-friendly messages
6. **Implement proper pagination** for large datasets
7. **Cache frequently accessed data**
8. **Use proper HTTP methods** (GET, POST, PUT, DELETE, PATCH)

This documentation provides all the essential information needed to integrate a frontend application with this social media backend API.
