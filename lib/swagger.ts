import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI configuration
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fair API',
      version: '1.0.0',
      description: 'API documentation for the Fair application',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Example',
        description: 'Example endpoints',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'healthy',
            },
            database: {
              type: 'object',
              properties: {
                connected: {
                  type: 'boolean',
                  example: true,
                },
                currentTime: {
                  type: 'string',
                  format: 'date-time',
                },
                version: {
                  type: 'string',
                  example: 'PostgreSQL 15.0',
                },
              },
            },
          },
        },
        ExampleResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    example: 1,
                  },
                  name: {
                    type: 'string',
                    example: 'Example Record',
                  },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
            },
            count: {
              type: 'integer',
              example: 1,
            },
          },
        },
      },
    },
  },
  apis: [
    './app/api/**/route.ts', // Path to the API files
  ],
};

/**
 * Generate Swagger specification
 */
export const swaggerSpec = swaggerJsdoc(options);

