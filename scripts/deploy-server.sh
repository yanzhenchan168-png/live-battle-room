#!/bin/bash
# 阿里云服务器自动部署脚本
# 架构：GitHub → Gitee 镜像 → 服务器拉取 → PM2 运行

set -e

# 配置变量（根据实际情况修改）
PROJECT_DIR="/www/wwwroot/live-battle-room"  # 项目目录
GIT_REMOTE="gitee"                            # Git 远程名称
BRANCH="main"                                 # 分支名称
PM2_APP_NAME="live-battle-room"               # PM2 应用名称

echo "=========================================="
echo "🚀 开始部署直播作战室"
echo "=========================================="

# 进入项目目录
cd $PROJECT_DIR
echo "📁 进入项目目录: $PROJECT_DIR"

# 拉取最新代码
echo "📥 拉取最新代码..."
git fetch $GIT_REMOTE
git reset --hard $GIT_REMOTE/$BRANCH

# 安装依赖
echo "📦 安装依赖..."
npm install --legacy-peer-deps

# 构建项目
echo "🔨 构建项目..."
npm run build

# 重启 PM2 服务
echo "🔄 重启 PM2 服务..."
pm2 restart $PM2_APP_NAME --update-env

# 显示状态
echo "✅ 部署完成!"
pm2 status $PM2_APP_NAME

echo "=========================================="
echo "部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
