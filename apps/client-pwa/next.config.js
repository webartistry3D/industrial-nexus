const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@industrial-nexus/maps', 'maplibre-gl'],
  images: {
    unoptimized: true,
  },
};

module.exports = withPWA(nextConfig);
