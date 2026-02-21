/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@gigs/shared'],
  experimental: {},
};

module.exports = nextConfig;
