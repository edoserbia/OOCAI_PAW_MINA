/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.bmp.ovh',
        port: '',
        pathname: '/imgs/**',
      },
      {
        protocol: 'https',
        hostname: 'img.oocstorage.icu',
        port: '',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    domains: ['img.oocstorage.icu', 'vd1261kq672.vicp.fun'],
    unoptimized: true,
  },
  // 添加API重写规则
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/contracts': path.join(__dirname, '../contracts'),
    };
    // 允许外部导入
    config.externals = {
      ...config.externals,
      '@/contracts/build/src/StoryRecord.js': 'commonjs ../../contracts/build/src/StoryRecord.js',
    };
    return config;
  },
  experimental: {
    serverActions: true,
    webpackBuildWorker: true,
  },
}

const path = require('path');
module.exports = nextConfig 