#!/bin/bash
# 创建 HTTP 隧道（使用页面验证方式）

echo "🚀 启动隧道服务..."

# 停止现有隧道
pkill -f "serveo.net" 2>/dev/null
pkill -f "localhost.run" 2>/dev/null

sleep 2

echo "📡 正在创建隧道..."

# 使用 serveo 的 HTTP 模式
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:5001 serveo.net 2>&1 | tee logs/tunnel.log &
TUNNEL_PID=$!

echo ""
echo "⏳ 等待隧道建立..."
sleep 8

# 提取隧道地址
TUNNEL_URL=$(grep -oP 'https://[^\s]+' logs/tunnel.log | head -1)

if [ -n "$TUNNEL_URL" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "✅ 隧道创建成功！"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "📱 访问地址:"
    echo "   $TUNNEL_URL"
    echo ""
    echo "💡 如果浏览器提示不安全："
    echo "   1. 点击 '高级'"
    echo "   2. 点击 '继续访问' 或 '不安全'"
    echo "   3. 这是正常的，因为使用的是临时隧道"
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "📝 隧道进程 PID: $TUNNEL_PID"
    echo "🔒 如需停止隧道，执行: pkill -f 'serveo.net'"
    echo ""
    
    # 保存 URL 到文件
    echo "$TUNNEL_URL" > /workspace/projects/live-battle-room/tunnel-url.txt
else
    echo "❌ 隧道创建失败，请检查日志: logs/tunnel.log"
fi
