import { NextResponse } from 'next/server'

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Minha API',
    version: '1.0.0',
    description: 'API pública para integração',
  },
  servers: [
    { url: 'https://api.meusite.com/v1', description: 'Produção' },
    { url: 'http://localhost:3000/api/v1', description: 'Desenvolvimento' },
  ],
  security: [{ apiKey: [] }],
  components: {
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/users': {
      get: {
        summary: 'Lista usuários',
        tags: ['Users'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Lista de usuários',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    pagination: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
  },
}

export async function GET() {
  return NextResponse.json(openApiSpec)
}