# API Documentation

## Base URL

All API endpoints are prefixed with `/api/v1`

## Authentication

Currently, the API does not require authentication. This should be implemented based on your requirements.

## Endpoints

### Health Check

Check the health status of the API and database connection.

**Endpoint:** `GET /api/v1/health`

**Response:**
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "currentTime": "2024-01-01T00:00:00.000Z",
    "version": "PostgreSQL 15.0"
  }
}
```

### Example

Example endpoint demonstrating database operations.

**Endpoint:** `GET /api/v1/example`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Example Record",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### Status Codes

- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

## Versioning

The API uses URL versioning. The current version is `v1`. Future versions will be available at `/api/v2`, `/api/v3`, etc.


