#!/bin/bash
# 部署到阿里云服务器（修复版）

set -e  # 遇到错误立即退出

# ==================== 配置区域 ====================
# 请修改为你的实际服务器信息
SERVER_USER="root"              # 服务器用户名
SERVER_IP="your-server-ip"      # 服务器IP地址 ⚠️ 请修改
PROJECT_DIR="/www/wwwroot/live-battle-room"  # 项目目录
DEPLOY_BRANCH="main"            # 部署分支

# ==================== 检查配置 ====================
if [ "$SERVER_IP" = "your-server-ip" ]; then
  echo "❌ 错误：请修改脚本中的 SERVER_IP 为你的实际服务器IP"
  exit 1
fi

echo "=========================================="
echo "开始部署到服务器: $SERVER_IP"
echo "=========================================="

# ==================== 步骤1: 本地提交和推送 ====================
echo ""
echo "【步骤1/5】推送代码到 GitHub..."
git push origin $DEPLOY_BRANCH

if [ $? -ne 0 ]; then
  echo "❌ 推送到 GitHub 失败"
  exit 1
fi

echo "✅ 代码已推送到 GitHub"

# ==================== 步骤2: 在服务器上执行部署 ====================
echo ""
echo "【步骤2/5】连接服务器并开始部署..."

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
  set -e

  echo "=========================================="
  echo "服务器端部署开始"
  echo "=========================================="

  # 进入项目目录
  cd /www/wwwroot/live-battle-room

  echo ""
  echo "【检查 Git 远程仓库】"
  # 检查是否已配置 gitee 远程仓库
  if git remote | grep -q "^gitee$"; then
    echo "✅ gitee 远程仓库已配置"
    git remote -v | grep gitee
  else
    echo "⚠️  gitee 远程仓库未配置，尝试添加..."
    # 从 origin 获取 Gitee 地址
    ORIGIN_URL=$(git remote get-url origin)
    # 将 github.com 替换为 gitee.com
    GITEE_URL=$(echo $ORIGIN_URL | sed 's|github.com|gitee.com|')
    git remote add gitee $GITEE_URL
    echo "✅ 已添加 gitee 远程仓库: $GITEE_URL"
  fi

  echo ""
  echo "【拉取最新代码】"
  # 先从 GitHub 拉取（更新更快）
  git fetch origin
  git reset --hard origin/main

  echo ""
  echo "【检查 Node.js 环境】"
  # 检查 Node.js 是否存在
  if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    echo "宝塔面板安装路径: 软件商店 → Node.js 版本管理"
    exit 1
  fi

  NODE_VERSION=$(node --version)
  echo "✅ Node.js 版本: $NODE_VERSION"
  echo "✅ Node.js 路径: $(which node)"

  echo ""
  echo "【检查包管理器】"
  if command -v pnpm &> /dev/null; then
    echo "✅ 使用 pnpm ($(pnpm --version))"
    PKG_MANAGER="pnpm"
  elif command -v npm &> /dev/null; then
    echo "✅ 使用 npm ($(npm --version))"
    PKG_MANAGER="npm"
  else
    echo "❌ 未找到包管理器 (pnpm/npm)"
    exit 1
  fi

  echo ""
  echo "【安装依赖】"
  if [ "$PKG_MANAGER" = "pnpm" ]; then
    # pnpm 安装依赖，忽略构建脚本警告
    pnpm install --ignore-scripts || pnpm install
  else
    npm install
  fi

  echo ""
  echo "【构建项目】"
  if [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm build
  else
    npm run build
  fi

  echo ""
  echo "【重启 PM2】"
  if command -v pm2 &> /dev/null; then
    pm2 restart live-battle-room || pm2 start npm --name "live-battle-room" -- start
    echo "✅ PM2 已重启"
  else
    echo "⚠️  PM2 未安装，跳过重启"
  fi

  echo ""
  echo "=========================================="
  echo "服务器端部署完成"
  echo "=========================================="
ENDSSH

if [ $? -ne 0 ]; then
  echo "❌ 服务器部署失败"
  exit 1
fi

echo "✅ 服务器部署成功"

# ==================== 步骤3: 验证部署 ====================
echo ""
echo "【步骤3/5】验证部署..."

# 等待服务启动
sleep 5

# 检查服务状态
echo "检查 PM2 状态..."
ssh $SERVER_USER@$SERVER_IP "pm2 status | grep live-battle-room"

# ==================== 完成 ====================
echo ""
echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo "访问地址: http://$SERVER_IP:3000"
echo "查看日志: ssh $SERVER_USER@$SERVER_IP 'pm2 logs live-battle-room'"
echo ""
