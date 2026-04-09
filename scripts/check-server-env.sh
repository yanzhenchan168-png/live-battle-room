#!/bin/bash
# 检查服务器环境脚本

echo "=== 检查 Node.js ==="
which node || echo "❌ Node.js 未安装"
node --version 2>&1 || echo "❌ Node.js 命令不存在"

echo ""
echo "=== 检查 pnpm ==="
which pnpm || echo "❌ pnpm 未安装"
pnpm --version 2>&1 || echo "❌ pnpm 命令不存在"

echo ""
echo "=== 检查 npm ==="
which npm || echo "❌ npm 未安装"
npm --version 2>&1 || echo "❌ npm 命令不存在"

echo ""
echo "=== 检查 Node.js 安装路径 ==="
ls -la /www/server/nvm/versions/node/ 2>&1 || echo "❌ nvm 目录不存在"

echo ""
echo "=== 检查宝塔 Node.js ==="
ls -la /www/server/nodejs/ 2>&1 || echo "❌ 宝塔 Node.js 目录不存在"

echo ""
echo "=== 检查系统 Node.js ==="
ls -la /usr/bin/node 2>&1 || echo "❌ 系统 Node.js 不存在"
ls -la /usr/local/bin/node 2>&1 || echo "❌ 本地 Node.js 不存在"
