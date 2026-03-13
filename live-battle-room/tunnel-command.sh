#!/bin/bash
# 快速重启隧道脚本

echo "🚀 启动隧道服务..."

# 停止现有隧道（如果有）
pkill -f "serveo.net"

sleep 2

# 创建新隧道
echo "📡 正在创建隧道..."
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R live-battle-room-$(date +%s):80:localhost:5001 serveo.net 2>&1 | tee logs/tunnel.log &
TUNNEL_PID=$!

echo ""
echo "⏳ 等待隧道建立..."
sleep 5

# 提取隧道地址
TUNNEL_URL=$(grep "Forwarding HTTP traffic" logs/tunnel.log | awk '{print $5}')

if [ -n "$TUNNEL_URL" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "✅ 隧道创建成功！"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "📱 访问地址:"
    echo "   $TUNNEL_URL"
    echo ""
    echo "💡 在浏览器中打开上述地址即可访问应用"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "📝 隧道进程 PID: $TUNNEL_PID"
    echo "🔒 如需停止隧道，执行: pkill -f 'serveo.net'"
    echo ""
else
    echo "❌ 隧道创建失败，请检查日志: logs/tunnel.log"
fi
