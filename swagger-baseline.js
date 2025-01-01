module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'My File',
    description:
      process.env.APP_DESCRIPTION ||
      'This api represents a combination of all API Gateway Lambda Proxy components for My File.',
    contact: {
      email: process.env.TECHNICAL_CONTACT || 'email@example.com',
    },
    license: {
      name: 'Apache 2.0',
      url: 'http://www.apache.org/licenses/LICENSE-2.0.html',
    },
    version: '1.0.0',
  },
  servers: [
    {
      url: process.env.EXISTING_HTTP_API_ENDPOINT || 'https://example.com/api',
      description: process.env.APP_DESCRIPTION || `My File API (${process.env.DEPLOYMENT_TARGET || 'dev'})`,
    },
  ],
  tags: ['users'],
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {},
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};
