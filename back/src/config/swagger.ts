/**
 * OpenAPI / Swagger configuration for UnoAccess API.
 * Served at /api/docs via swagger-ui-express.
 */

export const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'UnoAccess API',
    version: '3.0.0',
    description: `
## UnoAccess — Secure SSO & Performance Monitoring API

Complete REST API reference for the UnoAccess SSO platform.

### Authentication

Most endpoints require a valid session. Two methods supported:

1. **Cookie** (browser): \`accessToken\` httpOnly cookie set after login
2. **Bearer Token** (API keys): \`Authorization: Bearer ua_your_api_key\`

### Base URL

\`\`\`
http://localhost:5000
\`\`\`

### SDK Ingestion

SDK endpoints (\`/api/monitoring/logs\`, \`/api/monitoring/events\`, \`/api/monitoring/errors\`)
use HTTP Basic auth with your \`clientId:clientSecret\`.

RUM endpoint (\`/api/monitoring/rum\`) uses clientId only — safe for browser use.
    `,
    contact: {
      name: 'UnoAccess Support',
      url: 'https://github.com/your-org/unoaccess',
    },
    license: { name: 'MIT' },
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Local development' },
    { url: 'https://your-instance.com', description: 'Production' },
  ],
  tags: [
    { name: 'Auth', description: 'Registration, login, logout, password reset, 2FA' },
    { name: 'User', description: 'Profile, sessions, API keys, audit log, preferences' },
    { name: 'OAuth', description: 'OAuth 2.0 / OpenID Connect authorization flow' },
    { name: 'Monitoring', description: 'Performance metrics ingestion and retrieval' },
    { name: 'RUM', description: 'Real User Monitoring — Core Web Vitals' },
    { name: 'Alerts', description: 'Alert rules and notification history' },
    { name: 'SLO', description: 'Service Level Objectives and compliance reports' },
    { name: 'API Keys', description: 'Personal access token management' },
    { name: 'Apps', description: 'Self-service OAuth client registration' },
    { name: 'Status', description: 'Public system status and incidents' },
    { name: 'Admin', description: 'Admin-only — client, user and announcement management' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'Session cookie set automatically after login',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Personal access token (API key) prefixed with ua_',
      },
      basicAuth: {
        type: 'http',
        scheme: 'basic',
        description: 'clientId:clientSecret (for SDK endpoints)',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Authentication required' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
          name: { type: 'string', example: 'Ada Lovelace' },
          email: { type: 'string', example: 'ada@example.com' },
          role: { type: 'string', enum: ['user', 'admin'] },
          avatarUrl: { type: 'string', nullable: true },
          twoFactorEnabled: { type: 'boolean' },
          isVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      OAuthClient: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'My App' },
          clientId: { type: 'string', example: 'ua_aba046b6c5d9401c8f441320971a8a21' },
          redirectUris: { type: 'array', items: { type: 'string' }, example: ['https://myapp.com/callback'] },
          scopes: { type: 'array', items: { type: 'string' }, example: ['openid', 'profile', 'email'] },
          isActive: { type: 'boolean' },
          website: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiKey: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'CI/CD Pipeline' },
          keyPrefix: { type: 'string', example: 'ua_5f3a1b' },
          scopes: { type: 'array', items: { type: 'string' } },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AlertRule: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'High error rate' },
          metric: { type: 'string', enum: ['error_rate', 'response_time_p95', 'response_time_avg', 'request_count'] },
          condition: { type: 'string', enum: ['greater_than', 'less_than'] },
          threshold: { type: 'number', example: 5 },
          windowMinutes: { type: 'number', example: 5 },
          channel: { type: 'string', enum: ['email', 'webhook'] },
          status: { type: 'string', enum: ['active', 'paused'] },
          lastTriggeredAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      RumVitals: {
        type: 'object',
        properties: {
          lcp:  { type: 'number', description: 'Largest Contentful Paint (ms)' },
          cls:  { type: 'number', description: 'Cumulative Layout Shift (score)' },
          inp:  { type: 'number', description: 'Interaction to Next Paint (ms)' },
          fcp:  { type: 'number', description: 'First Contentful Paint (ms)' },
          ttfb: { type: 'number', description: 'Time to First Byte (ms)' },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  paths: {
    // ── Auth ──────────────────────────────────────────────────────────────
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Ada Lovelace' },
                  email: { type: 'string', format: 'email', example: 'ada@example.com' },
                  password: { type: 'string', minLength: 8, example: 'SecurePass123!' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered — verification email sent' },
          409: { description: 'Email already in use' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with email and password',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  twoFaCode: { type: 'string', description: '6-digit TOTP code (if 2FA enabled)' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful — sets accessToken and refreshToken cookies', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, user: { $ref: '#/components/schemas/User' } } } } } },
          401: { description: 'Invalid credentials or 2FA required' },
          403: { description: 'Account locked or suspended' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out and clear session cookies',
        responses: {
          200: { description: 'Logged out successfully' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token using refresh token cookie',
        security: [],
        responses: {
          200: { description: 'New access token issued' },
          401: { description: 'Refresh token invalid or expired' },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Send password reset email',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } },
        responses: { 200: { description: 'Reset email sent if account exists' } },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token from email',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token', 'password'], properties: { token: { type: 'string' }, password: { type: 'string', minLength: 8 } } } } } },
        responses: { 200: { description: 'Password reset successfully' }, 400: { description: 'Token invalid or expired' } },
      },
    },
    // ── User ─────────────────────────────────────────────────────────────
    '/api/user/profile': {
      get: {
        tags: ['User'],
        summary: 'Get current user profile',
        responses: { 200: { description: 'User profile', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, user: { $ref: '#/components/schemas/User' } } } } } }, 401: { description: 'Not authenticated' } },
      },
      put: {
        tags: ['User'],
        summary: 'Update display name',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } },
        responses: { 200: { description: 'Profile updated' } },
      },
    },
    '/api/user/sessions': {
      get: {
        tags: ['User'],
        summary: 'List all active sessions',
        responses: { 200: { description: 'Array of active sessions with device, location, and last-active info' } },
      },
      delete: {
        tags: ['User'],
        summary: 'Revoke all other sessions (keep current)',
        responses: { 200: { description: 'All other sessions revoked' } },
      },
    },
    '/api/user/sessions/{sessionId}': {
      delete: {
        tags: ['User'],
        summary: 'Revoke a specific session by ID',
        parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Session revoked' }, 404: { description: 'Session not found' } },
      },
    },
    '/api/user/audit-log': {
      get: {
        tags: ['User'],
        summary: 'Get user audit log',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: { 200: { description: 'Paginated audit log entries' } },
      },
    },
    '/api/user/audit-log/export': {
      get: {
        tags: ['User'],
        summary: 'Export audit log as CSV or JSON file',
        parameters: [{ name: 'format', in: 'query', schema: { type: 'string', enum: ['csv', 'json'], default: 'json' } }],
        responses: { 200: { description: 'File download' } },
      },
    },
    // ── API Keys ──────────────────────────────────────────────────────────
    '/api/user/api-keys': {
      get: {
        tags: ['API Keys'],
        summary: 'List personal access tokens',
        responses: { 200: { description: 'Array of API keys (without raw key values)', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, apiKeys: { type: 'array', items: { $ref: '#/components/schemas/ApiKey' } } } } } } } },
      },
      post: {
        tags: ['API Keys'],
        summary: 'Create a new API key',
        description: 'The raw key is returned once and never shown again.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', example: 'CI/CD Pipeline' }, expiresInDays: { type: 'integer', example: 90, nullable: true } } } } } },
        responses: {
          201: { description: 'Key created — rawKey is shown only in this response' },
          400: { description: 'Validation error or 20-key limit reached' },
        },
      },
    },
    '/api/user/api-keys/{id}': {
      delete: {
        tags: ['API Keys'],
        summary: 'Revoke an API key',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Key revoked' }, 404: { description: 'Key not found' } },
      },
    },
    // ── Self-service App ──────────────────────────────────────────────────
    '/api/user/apps': {
      get: {
        tags: ['Apps'],
        summary: 'Get your registered OAuth app (1 per user)',
        responses: { 200: { description: 'App details or null if not registered', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, app: { oneOf: [{ $ref: '#/components/schemas/OAuthClient' }, { type: 'null' }] } } } } } } },
      },
      post: {
        tags: ['Apps'],
        summary: 'Register a new OAuth app',
        description: 'Each user can register 1 app. clientSecret is returned only once.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'redirectUris'], properties: { name: { type: 'string' }, redirectUris: { type: 'array', items: { type: 'string' } }, website: { type: 'string', nullable: true } } } } } },
        responses: { 201: { description: 'App registered — save clientSecret now' }, 409: { description: 'User already has an app registered' } },
      },
      put: { tags: ['Apps'], summary: 'Update app name, URIs, or website', responses: { 200: { description: 'App updated' } } },
      delete: { tags: ['Apps'], summary: 'Delete your registered app', responses: { 200: { description: 'App deleted' }, 404: { description: 'No app registered' } } },
    },
    '/api/user/apps/rotate-secret': {
      post: {
        tags: ['Apps'],
        summary: 'Rotate client secret — new secret shown once',
        responses: { 200: { description: 'New clientSecret returned — save it now' } },
      },
    },
    // ── Alerts ────────────────────────────────────────────────────────────
    '/api/user/alerts': {
      get: { tags: ['Alerts'], summary: 'List alert rules', responses: { 200: { description: 'Array of alert rules' } } },
      post: {
        tags: ['Alerts'],
        summary: 'Create an alert rule',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AlertRule' } } } },
        responses: { 201: { description: 'Alert rule created' } },
      },
    },
    '/api/user/alerts/{id}': {
      put: { tags: ['Alerts'], summary: 'Update an alert rule', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Alerts'], summary: 'Delete an alert rule', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Deleted' } } },
    },
    '/api/user/alerts/history': {
      get: { tags: ['Alerts'], summary: 'Get alert trigger history (last 100)', responses: { 200: { description: 'Array of alert history entries' } } },
    },
    // ── Monitoring ────────────────────────────────────────────────────────
    '/api/monitoring/logs': {
      post: {
        tags: ['Monitoring'],
        summary: 'Ingest performance logs from SDK',
        description: 'Called by the UnoAccess Monitor SDK. Use Basic auth with clientId:clientSecret.',
        security: [{ basicAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['logs'], properties: { logs: { type: 'array', maxItems: 1000, items: { type: 'object', properties: { endpoint: { type: 'string' }, method: { type: 'string' }, responseTime: { type: 'number' }, statusCode: { type: 'integer' }, timestamp: { type: 'string', format: 'date-time' } } } } } } } } },
        responses: { 200: { description: 'Logs ingested successfully' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/api/monitoring/rum': {
      post: {
        tags: ['RUM'],
        summary: 'Ingest Core Web Vitals from browser',
        description: 'Called from the RUM snippet in the user\'s browser. Uses clientId only — no secret needed.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clientId', 'sessionId', 'url'],
                properties: {
                  clientId: { type: 'string', example: 'ua_aba046b6c5d9401c8f441320971a8a21' },
                  sessionId: { type: 'string', description: 'Random per-session ID generated by the snippet' },
                  url: { type: 'string', description: 'Page pathname (query params stripped for privacy)' },
                  deviceType: { type: 'string', enum: ['mobile', 'tablet', 'desktop', 'unknown'] },
                  connectionType: { type: 'string', enum: ['4g', '3g', '2g', 'wifi', 'unknown'] },
                  vitals: { $ref: '#/components/schemas/RumVitals' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Vitals ingested' }, 401: { description: 'Unknown clientId' } },
      },
    },
    '/api/monitoring/{clientId}/stats': {
      get: {
        tags: ['Monitoring'],
        summary: 'Get server-side performance stats',
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'range', in: 'query', schema: { type: 'string', enum: ['1h', '24h', '7d'], default: '24h' } },
        ],
        responses: { 200: { description: 'Summary, time series, endpoint breakdown, status codes, top users' } },
      },
    },
    '/api/monitoring/{clientId}/rum': {
      get: {
        tags: ['RUM'],
        summary: 'Get aggregated RUM / Core Web Vitals stats',
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'range', in: 'query', schema: { type: 'string', enum: ['1h', '24h', '7d', '30d'], default: '24h' } },
        ],
        responses: { 200: { description: 'RUM summary, rating breakdowns, top pages, time series, device breakdown' } },
      },
    },
    // ── Status ────────────────────────────────────────────────────────────
    '/api/status': {
      get: {
        tags: ['Status'],
        summary: 'Get current system status (public)',
        security: [],
        responses: { 200: { description: 'Overall status, component statuses, active and recent incidents' } },
      },
    },
    // ── OAuth ─────────────────────────────────────────────────────────────
    '/oauth/authorize': {
      get: {
        tags: ['OAuth'],
        summary: 'Authorization endpoint — redirect user here to start OAuth flow',
        security: [],
        parameters: [
          { name: 'response_type', in: 'query', required: true, schema: { type: 'string', enum: ['code'] } },
          { name: 'client_id', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'redirect_uri', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'scope', in: 'query', schema: { type: 'string', example: 'openid profile email' } },
          { name: 'state', in: 'query', schema: { type: 'string', description: 'CSRF protection token' } },
          { name: 'prompt', in: 'query', schema: { type: 'string', enum: ['none', 'login', 'consent', 'select_account'] } },
          { name: 'login_hint', in: 'query', schema: { type: 'string', description: 'Pre-fill email from account chooser' } },
        ],
        responses: { 302: { description: 'Redirect to login, consent screen, or back to redirect_uri with code' } },
      },
    },
    '/oauth/token': {
      post: {
        tags: ['OAuth'],
        summary: 'Token endpoint — exchange code for tokens',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                required: ['grant_type', 'client_id', 'client_secret'],
                properties: {
                  grant_type: { type: 'string', enum: ['authorization_code', 'refresh_token'] },
                  code: { type: 'string', description: 'Required for authorization_code grant' },
                  redirect_uri: { type: 'string' },
                  client_id: { type: 'string' },
                  client_secret: { type: 'string' },
                  refresh_token: { type: 'string', description: 'Required for refresh_token grant' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'access_token, refresh_token, id_token, expires_in, token_type' }, 400: { description: 'Invalid request' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/oauth/userinfo': {
      get: {
        tags: ['OAuth'],
        summary: 'UserInfo endpoint — get user profile from access token',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OIDC standard claims: sub, name, email, picture, email_verified' } },
      },
    },
  },
};