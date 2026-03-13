#!/bin/bash
# 使用不同的隧道服务

echo "🚀 尝试多种隧道方案..."

# 方案 1: tunnelto.dev
echo "📡 尝试 tunnelto.dev..."
timeout 3 bash -c 'curl -s https://tunnelto.dev' 2>/dev/null && echo "tunnelto 可用" || echo "tunnelto 不可用"

# 方案 2: ngrok (如果已安装)
if command -v ngrok &> /dev/null; then
    echo "📡 使用 ngrok 创建隧道..."
    ngrok http 5001 --log=stdout > logs/ngrok.log 2>&1 &
    NGROK_PID=$!
    sleep 5
    echo "✅ ngrok 隧道已启动"
    echo "📝 进程 PID: $NGROK_PID"
else
    echo "❌ ngrok 未安装"
fi

# 方案 3: 使用 localtunnel
echo "📡 尝试 localtunnel..."
node -e "
const lt = require('localtunnel');
lt(5001, { subdomain: 'livebattle' + Math.random().toString(36).substring(7) })
  .then(tunnel => {
    console.log('✅ localtunnel URL:', tunnel.url);
    console.log('保存到文件...');
    require('fs').writeFileSync('tunnel-url.txt', tunnel.url);
    tunnel.on('error', err => console.error('错误:', err));
  })
  .catch(err => console.error('失败:', err));
" &
