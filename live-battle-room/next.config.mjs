/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产环境优化
  reactStrictMode: true,
  
  // 图片优化
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // 环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: '一站式直播作战室',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  
  // 压缩
  compress: true,
  
  // 生产源码映射
  productionBrowserSourceMaps: false,
  
  // 输出模式
  output: 'standalone',
  
  // 实验性功能
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

export default nextConfig;
