# File Organizer System - API Specification

## API Overview

The File Organizer System exposes a RESTful API that enables the frontend to interact with the backend services. The API follows standard REST conventions and uses JSON for data exchange.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All API endpoints require authentication except for the authentication endpoints themselves. Authentication is implemented using JSON Web Tokens (JWT).

### Authentication Endpoints

#### Login

```
POST /auth/login
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string"
  },
  "expiresAt": "string (ISO date)"
}
```

**Status Codes:**
- 200: Success
- 401: Invalid credentials
- 422: Validation error

#### Register

```
POST /auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string"
  },
  "expiresAt": "string (ISO date)"
}
```

**Status Codes:**
- 201: Created
- 409: Username or email already exists
- 422: Validation error

#### Refresh Token

```
POST /auth/refresh
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "token": "string",
  "expiresAt": "string (ISO date)"
}
```

**Status Codes:**
- 200: Success
- 401: Invalid or expired token

## User Endpoints

#### Get User Profile

```
GET /users/me
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "number",
  "username": "string",
  "email": "string",
  "created_at": "string (ISO date)",
  "updated_at": "string (ISO date)",
  "settings": {
    "theme": "string",
    "notifications": "boolean"
  }
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

#### Update User Settings

```
PATCH /users/me/settings
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "settings": {
    "theme": "string",
    "notifications": "boolean"
  }
}
```

**Response:**
```json
{
  "id": "number",
  "settings": {
    "theme": "string",
    "notifications": "boolean"
  },
  "updated_at": "string (ISO date)"
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 422: Validation error

## Folder Endpoints

#### List Folders

```
GET /folders
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
parent_id: number (optional, filter by parent folder)
```

**Response:**
```json
{
  "folders": [
    {
      "id": "number",
      "name": "string",
      "parent_id": "number or null",
      "created_at": "string (ISO date)",
      "updated_at": "string (ISO date)",
      "metadata": "object"
    }
  ]
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

#### Get Folder Details

```
GET /folders/{id}
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "number",
  "name": "string",
  "parent_id": "number or null",
  "created_at": "string (ISO date)",
  "updated_at": "string (ISO date)",
  "metadata": "object",
  "path": "string",
  "child_count": "number",
  "file_count": "number"
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: Folder not found

#### Create Folder

```
POST /folders
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "string",
  "parent_id": "number or null",
  "metadata": "object (optional)"
}
```

**Response:**
```json
{
  "id": "number",
  "name": "string",
  "parent_id": "number or null",
  "created_at": "string (ISO date)",
  "updated_at": "string (ISO date)",
  "metadata": "object"
}
```

**Status Codes:**
- 201: Created
- 401: Unauthorized
- 404: Parent folder not found
- 409: Folder with same name exists in parent
- 422: Validation error

#### Update Folder

```
PATCH /folders/{id}
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "parent_id": "number or null (optional)",
  "metadata": "object (optional)"
}
```

**Response:**
```json
{
  "id": "number",
  "name": "string",
  "parent_id": "number or null",
  "created_at": "string (ISO date)",
  "updated_at": "string (ISO date)",
  "metadata": "object"
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: Folder not found
- 409: Folder with same name exists in parent
- 422: Validation error

#### Delete Folder

```
DELETE /folders/{id}
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
recursive: boolean (default: false)
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- 200: Success
- 400: Folder contains items and recursive=false
- 401: Unauthorized
- 404: Folder not found

## File Endpoints

#### List Files

```
GET /files
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
folder_id: number (optional, filter by folder)
mime_type: string (optional, filter by MIME type)
page: number (optional, pagination)
limit: number (optional, pagination)
sort: string (optional, sort field)
order: string (optional, sort order)
```

**Response:**
```json
{
  "files": [
    {
      "id": "number",
      "name": "string",
      "folder_id": "number",
      "mime_type": "string",
      "file_size": "number",
      "created_at": "string (ISO date)",
      "updated_at": "string (ISO date)",
      "metadata": "object"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

#### Get File Details

```
GET /files/{id}
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "number",
  "name": "string",
  "folder_id": "number",
  "folder_path": "string",
  "mime_type": "string",
  "file_size": "number",
  "file_path": "string",
  "created_at": "string (ISO date)",
  "updated_at": "string (ISO date)",
  "metadata": "object",
  "tags": [
    {
      "id": "number",
      "name": "string",
      "category": "string",
      "confidence": "number"
    }
  ]
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: File not found

#### Upload File

```
POST /files/upload
```

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**
```
file: File (required)
folder_id: number (optional)
analyze: boolean (optional, default: true)
```

**Response:**
```json
{
  "id": "number",
  "name": "string",
  "folder_id": "number",
  "mime_type": "string",
  "file_size": "number",
  "file_path": "string",
  "created_at": "string (ISO date)",
  "upload_id": "string (for tracking analysis status)"
}
```

**Status Codes:**
- 201: Created
- 401: Unauthorized
- 404: Folder not found
- 413: File too large
- 415: Unsupported file type
- 422: Validation error

#### Check Analysis Status

```
GET /files/analysis/{upload_id}
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "string (pending, analyzing, complete, failed)",
  "progress": "number (0-100)",
  "file_id": "number",
  "suggestions": {
    "suggested_path": "string",
    "confidence": "number",
    "alternative_paths": ["string"],
    "suggested_tags": ["string"],
    "content_summary": "string"
  }
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: Analysis job not found

#### Apply Organization Suggestion

```
POST /files/{id}/organize
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "folder_id": "number",
  "tags": [
    {
      "name": "string",
      "category": "string (optional)"
    }
  ]
}
```

**Response:**
```json
{
  "id": "number",
  "name": "string",
  "folder_id": "number",
  "folder_path": "string",
  "updated_at": "string (ISO date)"
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: File or folder not found
- 422: Validation error

#### Download File

```
GET /files/{id}/download
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
- File content with appropriate Content-Type and Content-Disposition headers

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: File not found

#### Delete File

```
DELETE /files/{id}
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: File not found

## Search Endpoints

#### Search Files

```
GET /search
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
query: string (required)
type: string (optional, "semantic" or "keyword", default: both)
folder_id: number (optional, scope to folder and subfolders)
mime_type: string (optional, filter by MIME type)
page: number (optional, pagination)
limit: number (optional, pagination)
```

**Response:**
```json
{
  "results": [
    {
      "id": "number",
      "name": "string",
      "folder_id": "number",
      "folder_path": "string",
      "mime_type": "string",
      "file_size": "number",
      "created_at": "string (ISO date)",
      "updated_at": "string (ISO date)",
      "metadata": "object",
      "relevance_score": "number",
      "match_context": "string (text snippet showing match)",
      "tags": [
        {
          "id": "number",
          "name": "string"
        }
      ]
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 422: Validation error

## Tag Endpoints

#### List Tags

```
GET /tags
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
category: string (optional, filter by category)
```

**Response:**
```json
{
  "tags": [
    {
      "id": "number",
      "name": "string",
      "category": "string",
      "file_count": "number"
    }
  ]
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

#### Get Files by Tag

```
GET /tags/{id}/files
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
page: number (optional, pagination)
limit: number (optional, pagination)
```

**Response:**
```json
{
  "tag": {
    "id": "number",
    "name": "string",
    "category": "string"
  },
  "files": [
    {
      "id": "number",
      "name": "string",
      "folder_id": "number",
      "folder_path": "string",
      "mime_type": "string",
      "file_size": "number",
      "created_at": "string (ISO date)",
      "updated_at": "string (ISO date)"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: Tag not found

## System Endpoints

#### Get System Status

```
GET /system/status
```

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "string",
  "version": "string",
  "components": {
    "database": "string (online/offline)",
    "storage": "string (online/offline)",
    "llm_service": "string (online/offline)",
    "vector_db": "string (online/offline)"
  },
  "stats": {
    "total_files": "number",
    "total_folders": "number",
    "storage_used": "number (bytes)",
    "user_count": "number"
  }
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

## Error Handling

All endpoints return standardized error objects in case of failure:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

Common error codes:
- `validation_error`: Invalid input data
- `not_found`: Resource not found
- `unauthorized`: Authentication required
- `forbidden`: Permission denied
- `conflict`: Resource conflict
- `server_error`: Internal server error

## Rate Limiting

The API implements rate limiting to prevent abuse. Limits are as follows:

- Authentication endpoints: 10 requests per minute per IP
- Regular endpoints: 60 requests per minute per user

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1620000000
```

When a rate limit is exceeded, the API returns a 429 (Too Many Requests) response.

## Pagination

List endpoints support pagination through the following query parameters:
- `page`: Page number (1-based)
- `limit`: Items per page (default: 20, max: 100)

Pagination details are included in the response as shown in the respective endpoint examples.

## Versioning

The API uses URL versioning (v1). Future versions will be made available under new paths (e.g., /api/v2/) while maintaining backward compatibility for a reasonable period. 