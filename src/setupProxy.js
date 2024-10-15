const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/effortx', // Match the API endpoint path
    createProxyMiddleware({
      target: 'https://secure.spoors.in', // Backend server
      changeOrigin: true,
    })
  );
};
