/**
 * OpenAPI 3.0 spec for the External API (v1).
 * Served at GET /api/docs/external for "Try it" Swagger UI.
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const externalApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'FAIR External API',
    version: '1.0.0',
    description: 'API for hackathon organizations and external integrations. Authenticate with an API key (X-API-Key or Authorization: Bearer). Rate limits apply per key.',
  },
  servers: [{ url: `${baseUrl}/api/external/v1`, description: 'External API base' }],
  security: [{ apiKey: [] }],
  components: {
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Your API key from Integrations (or use Authorization: Bearer <key>)',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Error message' },
          retryAfter: { type: 'integer', description: 'Seconds to wait (429 only)' },
          usage: { type: 'object', description: 'Rate limit usage (429 only)' },
        },
      },
    },
  },
  paths: {
    '/hackathons': {
      get: {
        summary: 'List hackathons',
        description: 'List hackathons for the organization that owns the API key.',
        tags: ['Hackathons'],
        security: [{ apiKey: [] }],
        responses: {
          '200': { description: 'List of hackathons', content: { 'application/json': { schema: { type: 'object', properties: { hackathons: { type: 'array', items: { type: 'object' } } } } } } },
          '401': { description: 'Missing or invalid API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '429': { description: 'Rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/hackathons/{hackathonId}': {
      get: {
        summary: 'Get hackathon',
        description: 'Get one hackathon by ID. Access only if your organization owns it.',
        tags: ['Hackathons'],
        security: [{ apiKey: [] }],
        parameters: [{ name: 'hackathonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Hackathon details' },
          '403': { description: 'Access denied' },
          '404': { description: 'Hackathon not found' },
          '401': { description: 'Missing or invalid API key' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/hackathons/{hackathonId}/polls': {
      get: {
        summary: 'List polls for hackathon',
        description: 'List polls for a hackathon. Access only if your organization owns the hackathon.',
        tags: ['Hackathons'],
        security: [{ apiKey: [] }],
        parameters: [{ name: 'hackathonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'List of polls' },
          '403': { description: 'Access denied' },
          '404': { description: 'Hackathon not found' },
          '401': { description: 'Missing or invalid API key' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/polls/{pollId}': {
      get: {
        summary: 'Get poll',
        description: 'Get poll details. Access only if your organization owns the poll or its hackathon.',
        tags: ['Polls'],
        security: [{ apiKey: [] }],
        parameters: [{ name: 'pollId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Poll details' },
          '403': { description: 'Access denied' },
          '404': { description: 'Poll not found' },
          '401': { description: 'Missing or invalid API key' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/polls/{pollId}/results': {
      get: {
        summary: 'Get poll results',
        description: 'Get poll results. Allowed if results are public or your organization owns the poll.',
        tags: ['Polls'],
        security: [{ apiKey: [] }],
        parameters: [{ name: 'pollId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Poll results (teams, votes, quorum)' },
          '403': { description: 'Results not publicly available' },
          '404': { description: 'Poll not found' },
          '401': { description: 'Missing or invalid API key' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/vote/validate': {
      post: {
        summary: 'Validate voter token',
        description: 'Validate a voting token and get available teams. Body: { "token": "..." }.',
        tags: ['Vote'],
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } },
            },
          },
        },
        responses: {
          '200': { description: 'Token valid; returns poll and teams or existing vote' },
          '400': { description: 'Invalid token or already used' },
          '401': { description: 'Missing or invalid API key' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/vote/submit': {
      post: {
        summary: 'Submit vote',
        description: 'Submit a vote (voter with token, or judge with judgeEmail + pollId). Same body as the public vote API (teamIdTarget, teams, or rankings depending on mode).',
        tags: ['Vote'],
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string', description: 'Voter token' },
                  judgeEmail: { type: 'string', format: 'email' },
                  pollId: { type: 'string', format: 'uuid' },
                  teamIdTarget: { type: 'string', format: 'uuid' },
                  teams: { type: 'array', items: { type: 'string', format: 'uuid' } },
                  rankings: { type: 'array', items: { type: 'object', properties: { teamId: { type: 'string' }, rank: { type: 'integer' }, reason: { type: 'string' } } } },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Vote submitted or updated' },
          '400': { description: 'Validation failed' },
          '401': { description: 'Missing or invalid API key' },
          '403': { description: 'Not allowed (e.g. voting closed)' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
  },
} as const;
