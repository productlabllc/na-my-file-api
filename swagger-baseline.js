module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'My File',
    description: 'This api represents a combination of all API Gateway Lambda Proxy components for My File NYC.',
    contact: {
      email: 'pilin@nycopportunity.nyc.gov',
    },
    license: {
      name: 'Apache 2.0',
      url: 'http://www.apache.org/licenses/LICENSE-2.0.html',
    },
    version: '1.0.0',
  },
  servers: [
    {
      url: 'https://dkvtc4ni4i.execute-api.us-east-1.amazonaws.com/',
      description: 'My File NYC API (dev)',
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
