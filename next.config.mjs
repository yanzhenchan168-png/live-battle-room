/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产环境优化
  reactStrictMode: true,
  
  // 输出模式 - 使用 standalone 以支持更多部署平台
  output: 'standalone',
  
  // 图片优化
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // 禁用图片优化以减少构建时间（可选）
    unoptimized: false,
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
  
  // 实验性功能
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  
  // 允许访问的环境变量
  // 敏感变量请在部署平台控制台配置
  publicRuntimeConfig: {
    appName: '一站式直播作战室',
  },
};

export default nextConfig;
