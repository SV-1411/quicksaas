/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false,
    externalDir: true,
  },
  outputFileTracingRoot: require('path').join(__dirname, '..', '..'),
};

module.exports = nextConfig;
