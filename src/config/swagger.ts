export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Bank Licensing & Compliance Portal API',
    description: 'API for managing bank licensing applications, reviews, and document uploads.',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Use JWT token from /auth/login in Authorization header as Bearer token',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          code: { type: 'string', nullable: true },
          errors: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
            nullable: true,
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', example: 'strongpassword123' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', example: 'APPLICANT' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOi...' },
              user: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },
      AuthMeResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/User' },
        },
      },
      CreateApplicationRequest: {
        type: 'object',
        required: ['institutionName', 'licenseType'],
        properties: {
          institutionName: { type: 'string', example: 'Example Bank Ltd.' },
          licenseType: { type: 'string', example: 'COMMERCIAL_BANK' },
          description: { type: 'string', example: 'Application to operate a commercial banking license.' },
        },
      },
      Application: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          institutionName: { type: 'string' },
          licenseType: { type: 'string' },
          description: { type: 'string', nullable: true },
          state: {
            type: 'string',
            enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
          },
          version: { type: 'integer' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              role: { type: 'string' },
            },
          },
          reviewedBy: {
            type: ['object', 'null'],
            nullable: true,
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
            },
          },
          approvedBy: {
            type: ['object', 'null'],
            nullable: true,
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Document: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          applicationId: { type: 'string', format: 'uuid' },
          fileName: { type: 'string' },
          fileType: { type: 'string' },
          filePath: { type: 'string' },
          uploadedAt: { type: 'string', format: 'date-time' },
        },
      },
      DocumentListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Document' },
          },
        },
      },
      ApplicationListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Application' },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in and receive a JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          400: {
            description: 'Invalid login payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Return authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User profile returned successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthMeResponse' },
              },
            },
          },
          401: {
            description: 'Missing or invalid JWT',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/applications': {
      get: {
        tags: ['Applications'],
        summary: 'List applications available to the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Applications returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApplicationListResponse' },
              },
            },
          },
          401: {
            description: 'Unauthorized request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Applications'],
        summary: 'Create a new bank license application',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateApplicationRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Application created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Application' },
              },
            },
          },
          400: {
            description: 'Invalid payload or missing data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'Unauthorized request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/applications/{id}': {
      get: {
        tags: ['Applications'],
        summary: 'Fetch a single application by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Application details returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Application' },
              },
            },
          },
          401: {
            description: 'Unauthorized request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Application not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/applications/{id}/submit': {
      post: {
        tags: ['Workflow'],
        summary: 'Submit an application for review',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Application submitted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Application' },
              },
            },
          },
          401: {
            description: 'Unauthorized request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'Insufficient permissions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/applications/{id}/review': {
      post: {
        tags: ['Workflow'],
        summary: 'Move application into review stage',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Application marked for review',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Application' },
              },
            },
          },
          403: {
            description: 'Reviewer access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/applications/{id}/request-more-info': {
      post: {
        tags: ['Workflow'],
        summary: 'Request additional information from applicant',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'More information requested',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Application' },
              },
            },
          },
          403: {
            description: 'Reviewer access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/applications/{id}/approve': {
      post: {
        tags: ['Workflow'],
        summary: 'Approve a submitted application',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Application approved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Application' },
              },
            },
          },
          403: {
            description: 'Approver access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/applications/{id}/reject': {
      post: {
        tags: ['Workflow'],
        summary: 'Reject a submitted application',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: {
                  reason: { type: 'string', example: 'Incomplete financial disclosures.' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Application rejected',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Application' },
              },
            },
          },
          403: {
            description: 'Approver access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/applications/{id}/documents': {
      get: {
        tags: ['Documents'],
        summary: 'List documents attached to an application',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Documents returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentListResponse' },
              },
            },
          },
          401: {
            description: 'Unauthorized request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Documents'],
        summary: 'Upload a document for an application',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Document uploaded successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Document' },
              },
            },
          },
          400: {
            description: 'Missing file or invalid upload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/applications/{id}/documents/{documentId}': {
      get: {
        tags: ['Documents'],
        summary: 'Fetch a single document record',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'documentId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Document metadata returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Document' },
              },
            },
          },
          401: {
            description: 'Unauthorized request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Document not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
};
