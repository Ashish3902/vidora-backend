# User Controller Documentation

## Overview
The improved user controller provides comprehensive user management functionality with enhanced security, validation, and user experience features.

## Features

### 🔐 Enhanced Security
- **Strong Password Validation**: Requires 8+ characters with uppercase, lowercase, number, and special character
- **JWT Token Management**: Access tokens and refresh tokens with secure cookie handling
- **Password Hashing**: Secure bcrypt hashing with salt rounds
- **Input Sanitization**: Email and username normalization
- **CSRF Protection**: Secure cookie settings with sameSite and httpOnly

### 📝 Input Validation
- **Email Validation**: Proper email format validation
- **Username Validation**: 3-30 characters, alphanumeric + underscore only
- **Password Strength**: Comprehensive password requirements
- **Data Sanitization**: Trim whitespace and normalize case

### 🔄 Token Management
- **Access Tokens**: Short-lived tokens for API access
- **Refresh Tokens**: Long-lived tokens for token renewal
- **Automatic Token Refresh**: Endpoint to refresh expired access tokens
- **Secure Logout**: Clears tokens from database and cookies

## API Endpoints

### Public Routes

#### 1. Register User
```http
POST /api/users/register
```

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "coverImage": "https://example.com/cover.jpg"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "avatar": "https://example.com/avatar.jpg",
      "coverImage": "https://example.com/cover.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_token_here"
  },
  "message": "User registered successfully",
  "success": true
}
```

#### 2. Login User
```http
POST /api/users/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "avatar": "https://example.com/avatar.jpg",
      "coverImage": "https://example.com/cover.jpg"
    },
    "accessToken": "jwt_token_here"
  },
  "message": "Login successful",
  "success": true
}
```

#### 3. Reset Password
```http
POST /api/users/reset-password
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "newPassword": "NewSecurePass123!"
}
```

#### 4. Refresh Access Token
```http
POST /api/users/refresh-token
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

### Protected Routes (Require JWT Authentication)

#### 5. Get Current User
```http
GET /api/users/me
```

**Headers:**
```
Authorization: Bearer <access_token>
```

#### 6. Update User Profile
```http
PUT /api/users/profile
```

**Request Body:**
```json
{
  "fullName": "John Smith",
  "avatar": "https://example.com/new-avatar.jpg",
  "coverImage": "https://example.com/new-cover.jpg",
  "bio": "Software developer passionate about creating amazing applications"
}
```

#### 7. Change Password
```http
PUT /api/users/change-password
```

**Request Body:**
```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

#### 8. Logout User
```http
POST /api/users/logout
```

#### 9. Delete User Account
```http
DELETE /api/users/account
```

**Request Body:**
```json
{
  "password": "SecurePass123!"
}
```

### User Discovery Routes

#### 10. Search Users
```http
GET /api/users/search?query=john&limit=10&page=1
```

**Query Parameters:**
- `query` (required): Search term
- `limit` (optional): Number of results per page (default: 10)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "users": [
      {
        "id": "user_id",
        "username": "john_doe",
        "fullName": "John Doe",
        "avatar": "https://example.com/avatar.jpg"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  },
  "message": "Users fetched successfully",
  "success": true
}
```

#### 11. Get User by ID
```http
GET /api/users/:userId
```

## Error Handling

The controller uses standardized error responses:

```json
{
  "statusCode": 400,
  "message": "Invalid email format",
  "success": false,
  "errors": []
}
```

### Common Error Codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid credentials, missing token)
- `404`: Not Found (user not found)
- `409`: Conflict (user already exists)
- `500`: Internal Server Error

## Security Features

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&)

### Cookie Security
- `httpOnly`: Prevents XSS attacks
- `secure`: HTTPS only in production
- `sameSite`: Prevents CSRF attacks
- `maxAge`: Automatic expiration

### Token Security
- Access tokens expire in 1 day
- Refresh tokens expire in 7 days
- Tokens are stored securely in httpOnly cookies
- Refresh tokens are invalidated on logout

## Environment Variables Required

```env
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=7d
NODE_ENV=development
```

## Usage Examples

### Frontend Integration

```javascript
// Register user
const registerUser = async (userData) => {
  const response = await fetch('/api/users/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return response.json();
};

// Login user
const loginUser = async (credentials) => {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  return response.json();
};

// Get current user (with authentication)
const getCurrentUser = async () => {
  const response = await fetch('/api/users/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  return response.json();
};

// Update profile
const updateProfile = async (profileData) => {
  const response = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(profileData),
  });
  return response.json();
};
```

## Best Practices

1. **Always validate input** on both client and server side
2. **Use HTTPS** in production for secure cookie transmission
3. **Implement rate limiting** to prevent brute force attacks
4. **Log security events** for monitoring and debugging
5. **Regular token rotation** for enhanced security
6. **Input sanitization** to prevent injection attacks
7. **Proper error handling** without exposing sensitive information

