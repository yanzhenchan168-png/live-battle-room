/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  compress: true,
  
  productionBrowserSourceMaps: false,
  
  output: 'standalone',
};

module.exports = nextConfig;
