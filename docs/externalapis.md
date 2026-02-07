# External API Guide

This guide explains how to interact with FAIR's External API for hackathon organizations and external integrations.

## Overview

The External API allows hackathon organizers and external systems to:
- List and inspect hackathons and polls they own
- Fetch poll results (when allowed by poll settings)
- Validate voter tokens and submit votes programmatically

**Base URL:** `https://your-domain.com/api/external/v1`

All responses are JSON. Use HTTPS in production. Authentication is required on every request via an API key.

## Authentication

### Getting an API Key

1. Log in to your admin account at `/admin/login`
2. Navigate to **Integrations** (in the sidebar under Account)
3. Click **Create API key**
4. Provide a name (e.g., "Hackathon XYZ integration") and optionally set a custom rate limit
5. **Copy the raw key immediately** - it's shown only once and never stored

### Using Your API Key

Send your API key on every request using one of these methods:

**Option 1: X-API-Key header**
```bash
curl -H "X-API-Key: fair_your_api_key_here" \
  https://your-domain.com/api/external/v1/hackathons
```

**Option 2: Authorization Bearer token**
```bash
curl -H "Authorization: Bearer fair_your_api_key_here" \
  https://your-domain.com/api/external/v1/hackathons
```

### Security Best Practices

- **Never commit API keys to version control** - use environment variables or secure secret management
- **Rotate keys regularly** - revoke old keys in Integrations and create new ones
- **Use different keys per integration** - makes it easier to revoke access if needed
- **Store keys securely** - treat them like passwords

## Rate Limits

Each API key has a **requests-per-minute** limit (default: 60). When exceeded, you'll receive:

**Status:** `429 Too Many Requests`

**Response:**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "usage": {
    "limit": 60,
    "current": 61
  }
}
```

**Headers:**
- `Retry-After: 60` (seconds to wait)

**Handling Rate Limits:**

1. Check the `Retry-After` header or `retryAfter` in the response body
2. Implement exponential backoff
3. Consider caching responses when appropriate
4. Request a higher limit when creating your API key if needed

## Endpoints

### Hackathons

#### List Hackathons

Get all hackathons owned by your organization.

**Request:**
```http
GET /api/external/v1/hackathons
X-API-Key: fair_your_api_key_here
```

**Response:**
```json
{
  "hackathons": [
    {
      "hackathon_id": "uuid",
      "name": "Summer Hackathon 2024",
      "description": "Annual summer event",
      "start_date": "2024-06-01T00:00:00Z",
      "end_date": "2024-06-03T00:00:00Z",
      "voting_closes_at": "2024-06-02T18:00:00Z",
      "created_by": "admin-uuid",
      "created_at": "2024-05-01T00:00:00Z",
      "updated_at": "2024-05-15T00:00:00Z"
    }
  ]
}
```

#### Get Hackathon

Get details for a specific hackathon (must be owned by your organization).

**Request:**
```http
GET /api/external/v1/hackathons/{hackathonId}
X-API-Key: fair_your_api_key_here
```

**Response:** Same structure as single hackathon object above.

**Errors:**
- `404` - Hackathon not found
- `403` - You don't own this hackathon

#### List Polls for Hackathon

Get all polls for a specific hackathon.

**Request:**
```http
GET /api/external/v1/hackathons/{hackathonId}/polls
X-API-Key: fair_your_api_key_here
```

**Response:**
```json
{
  "polls": [
    {
      "poll_id": "uuid",
      "hackathon_id": "uuid",
      "name": "Best Overall Project",
      "start_time": "2024-06-02T10:00:00Z",
      "end_time": "2024-06-02T18:00:00Z",
      "voting_mode": "ranked",
      "voting_permissions": "voters_and_judges",
      "is_public_results": true,
      "created_at": "2024-05-20T00:00:00Z"
    }
  ]
}
```

### Polls

#### Get Poll Details

Get detailed information about a poll (must be owned by your organization or its hackathon).

**Request:**
```http
GET /api/external/v1/polls/{pollId}
X-API-Key: fair_your_api_key_here
```

**Response:**
```json
{
  "poll": {
    "poll_id": "uuid",
    "hackathon_id": "uuid",
    "name": "Best Overall Project",
    "start_time": "2024-06-02T10:00:00Z",
    "end_time": "2024-06-02T18:00:00Z",
    "voting_mode": "ranked",
    "voting_permissions": "voters_and_judges",
    "voter_weight": 1.0,
    "judge_weight": 2.0,
    "is_public_results": true,
    "allow_self_vote": false,
    "created_at": "2024-05-20T00:00:00Z"
  }
}
```

#### Get Poll Results

Get voting results for a poll. Allowed if:
- Results are marked as public (`is_public_results: true`), OR
- Your organization owns the poll or its hackathon

**Request:**
```http
GET /api/external/v1/polls/{pollId}/results
X-API-Key: fair_your_api_key_here
```

**Response:**
```json
{
  "poll": {
    "pollId": "uuid",
    "name": "Best Overall Project",
    "votingMode": "ranked",
    "votingPermissions": "voters_and_judges",
    "voterWeight": 1.0,
    "judgeWeight": 2.0,
    "startTime": "2024-06-02T10:00:00Z",
    "endTime": "2024-06-02T18:00:00Z",
    "isPublicResults": true
  },
  "results": {
    "teams": [
      {
        "teamId": "uuid",
        "teamName": "Team Alpha",
        "totalScore": 45.5,
        "voterScore": 20.0,
        "judgeScore": 25.5,
        "voteCount": 15,
        "rankedPoints": 45.5,
        "voterVotes": 10,
        "judgeVotes": 5,
        "positionCounts": {
          "1": 3,
          "2": 2,
          "3": 1
        }
      }
    ],
    "totalVotes": 25,
    "voterVotes": 15,
    "judgeVotes": 10,
    "votes": [
      {
        "voteId": "uuid",
        "voteType": "voter",
        "votingMode": "ranked",
        "timestamp": "2024-06-02T12:00:00Z",
        "txHash": "0x...",
        "explorerUrl": "https://snowtrace.io/tx/0x...",
        "teamIdTarget": null,
        "teams": null,
        "rankings": [
          {
            "teamId": "uuid",
            "rank": 1,
            "points": 10
          }
        ]
      }
    ],
    "quorumStatus": {
      "voterQuorumMet": true,
      "judgeQuorumMet": true,
      "voterQuorumRequired": 10,
      "judgeQuorumRequired": 5,
      "voterQuorumActual": 15,
      "judgeQuorumActual": 10,
      "quorumMet": true
    }
  }
}
```

### Voting

#### Validate Voter Token

Validate a voting token and get available teams. This endpoint is useful for checking if a token is valid before submitting a vote.

**Request:**
```http
POST /api/external/v1/vote/validate
X-API-Key: fair_your_api_key_here
Content-Type: application/json

{
  "token": "voter_token_string"
}
```

**Response (new vote):**
```json
{
  "valid": true,
  "alreadyVoted": false,
  "poll": {
    "pollId": "uuid",
    "name": "Best Overall Project",
    "votingMode": "ranked",
    "votingPermissions": "voters_and_judges",
    "requireTeamNameGate": false,
    "allowSelfVote": false,
    "rankPointsConfig": {
      "1": 10,
      "2": 7,
      "3": 5
    },
    "maxRankedPositions": 5,
    "votingSequence": "simultaneous"
  },
  "voterTeam": {
    "teamId": "uuid",
    "teamName": "Team Beta"
  },
  "availableTeams": [
    {
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "projectName": "Cool Project",
      "projectDescription": "Description here",
      "pitch": "Our pitch",
      "liveSiteUrl": "https://example.com",
      "githubUrl": "https://github.com/example"
    }
  ]
}
```

**Response (already voted):**
```json
{
  "valid": true,
  "alreadyVoted": true,
  "canEdit": true,
  "poll": { ... },
  "voterTeam": { ... },
  "availableTeams": [ ... ],
  "existingVote": {
    "voteId": "uuid",
    "voteType": "voter",
    "votingMode": "ranked",
    "teamIdTarget": null,
    "teams": null,
    "rankings": [
      {
        "teamId": "uuid",
        "rank": 1,
        "points": 10
      }
    ],
    "timestamp": "2024-06-02T12:00:00Z",
    "txHash": "0x...",
    "explorerUrl": "https://snowtrace.io/tx/0x..."
  }
}
```

#### Submit Vote

Submit a vote (voter or judge). The request body depends on the voting mode:

**Single Vote Mode:**
```http
POST /api/external/v1/vote/submit
X-API-Key: fair_your_api_key_here
Content-Type: application/json

{
  "token": "voter_token_string",
  "teamIdTarget": "team-uuid"
}
```

**Multiple Vote Mode:**
```http
POST /api/external/v1/vote/submit
X-API-Key: fair_your_api_key_here
Content-Type: application/json

{
  "token": "voter_token_string",
  "teams": ["team-uuid-1", "team-uuid-2"]
}
```

**Ranked Vote Mode:**
```http
POST /api/external/v1/vote/submit
X-API-Key: fair_your_api_key_here
Content-Type: application/json

{
  "token": "voter_token_string",
  "rankings": [
    {
      "teamId": "team-uuid-1",
      "rank": 1
    },
    {
      "teamId": "team-uuid-2",
      "rank": 2
    }
  ]
}
```

**Judge Vote (any mode):**
```http
POST /api/external/v1/vote/submit
X-API-Key: fair_your_api_key_here
Content-Type: application/json

{
  "judgeEmail": "judge@example.com",
  "pollId": "poll-uuid",
  "teamIdTarget": "team-uuid",
  "reason": "Excellent implementation and design"
}
```

**Response:**
```json
{
  "voteId": "uuid",
  "txHash": "0x...",
  "explorerUrl": "https://snowtrace.io/tx/0x...",
  "timestamp": "2024-06-02T12:00:00Z",
  "message": "Vote submitted successfully",
  "isUpdate": false
}
```

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "error": "Token is required"
}
```
Invalid request body or validation failed. Check the `error` field for details.

**401 Unauthorized**
```json
{
  "error": "Missing API key. Provide X-API-Key header or Authorization: Bearer <key>."
}
```
Missing or invalid API key. Ensure your key is correct and not revoked.

**403 Forbidden**
```json
{
  "error": "Access denied"
}
```
Valid API key but no access to the resource (e.g., you don't own the hackathon/poll, or results aren't public).

**404 Not Found**
```json
{
  "error": "Hackathon not found"
}
```
Resource doesn't exist or you don't have access to it.

**429 Too Many Requests**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "usage": {
    "limit": 60,
    "current": 61
  }
}
```
Rate limit exceeded. Wait for the `retryAfter` period before retrying.

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```
Server error. Retry with exponential backoff.

### Best Practices

1. **Always check status codes** - Don't assume success based on response body alone
2. **Handle rate limits gracefully** - Implement retry logic with backoff
3. **Validate responses** - Check that expected fields exist before using them
4. **Log errors** - Include request details (endpoint, method, status) for debugging
5. **Use idempotent operations** - Some endpoints support retries safely

## Code Examples

### JavaScript/TypeScript (fetch)

```typescript
const API_KEY = process.env.FAIR_API_KEY;
const BASE_URL = 'https://your-domain.com/api/external/v1';

async function getHackathons() {
  const response = await fetch(`${BASE_URL}/hackathons`, {
    headers: {
      'X-API-Key': API_KEY,
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      const data = await response.json();
      throw new Error(`Rate limited. Retry after ${data.retryAfter}s`);
    }
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

async function getPollResults(pollId: string) {
  const response = await fetch(`${BASE_URL}/polls/${pollId}/results`, {
    headers: {
      'X-API-Key': API_KEY,
    },
  });

  if (response.status === 403) {
    throw new Error('Results not publicly available or access denied');
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

async function submitVote(token: string, teamId: string) {
  const response = await fetch(`${BASE_URL}/vote/submit`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      teamIdTarget: teamId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}
```

### Python (requests)

```python
import os
import requests
from typing import Dict, List, Optional

API_KEY = os.environ.get('FAIR_API_KEY')
BASE_URL = 'https://your-domain.com/api/external/v1'

headers = {
    'X-API-Key': API_KEY,
}

def get_hackathons() -> Dict:
    """Get all hackathons for the organization."""
    response = requests.get(f'{BASE_URL}/hackathons', headers=headers)
    response.raise_for_status()
    return response.json()

def get_poll_results(poll_id: str) -> Dict:
    """Get poll results."""
    response = requests.get(f'{BASE_URL}/polls/{poll_id}/results', headers=headers)
    
    if response.status_code == 403:
        raise ValueError('Results not publicly available or access denied')
    
    response.raise_for_status()
    return response.json()

def submit_vote(token: str, team_id: str) -> Dict:
    """Submit a single vote."""
    response = requests.post(
        f'{BASE_URL}/vote/submit',
        headers={**headers, 'Content-Type': 'application/json'},
        json={
            'token': token,
            'teamIdTarget': team_id,
        }
    )
    response.raise_for_status()
    return response.json()
```

### cURL

```bash
# Set your API key
export FAIR_API_KEY="fair_your_api_key_here"

# List hackathons
curl -H "X-API-Key: $FAIR_API_KEY" \
  https://your-domain.com/api/external/v1/hackathons

# Get poll results
curl -H "X-API-Key: $FAIR_API_KEY" \
  https://your-domain.com/api/external/v1/polls/{pollId}/results

# Submit vote
curl -X POST \
  -H "X-API-Key: $FAIR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"token": "voter_token", "teamIdTarget": "team-uuid"}' \
  https://your-domain.com/api/external/v1/vote/submit
```

## Charging & Usage

Usage is tracked per API key for billing purposes. Each request is recorded (endpoint and timestamp); no personally identifiable information is stored.

### Pricing Tiers

- **Free tier:** Limited requests per month; suitable for small hackathons and testing
- **Paid tiers:** Higher rate limits and monthly request quotas; contact us for pricing and SLA

Rate limits are enforced in real time. If you need a custom plan or higher limits, contact us via the main docs or FAIR website.

## Additional Resources

- **Interactive API docs:** Visit `/docs/external-api` for a detailed reference
- **Try it out:** Use `/docs/external-api/try` for Swagger UI with live testing
- **Manage API keys:** Go to `/admin/integrations` to create, view, and revoke keys

## Support

For questions, issues, or feature requests related to the External API:
- Check the interactive documentation at `/docs/external-api`
- Review error messages and status codes
- Contact support through the main FAIR website
