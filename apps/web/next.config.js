/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@gigs/shared'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: '**.gigs.ma' },
      { protocol: 'https', hostname: 'gigs.ma' },
    ],
  },
  experimental: {},
};

module.exports = nextConfig;
