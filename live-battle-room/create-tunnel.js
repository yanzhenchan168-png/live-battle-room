const localtunnel = require('localtunnel');
const http = require('http');

const PORT = 5001;

// 创建 HTTP 服务器检查服务是否正常
const checkServer = () => {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}`, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        reject(new Error(`Server returned ${res.statusCode}`));
      }
    }).on('error', reject);
  });
};

// 启动隧道
async function startTunnel() {
  console.log('🔍 检查本地服务...');
  try {
    await checkServer();
    console.log('✅ 本地服务正常运行');
  } catch (error) {
    console.error('❌ 本地服务未启动', error.message);
    process.exit(1);
  }

  console.log('🚀 正在创建隧道...');
  
  const tunnel = await localtunnel({
    port: PORT,
    subdomain: 'live-battle-room-' + Math.random().toString(36).substring(7),
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ 隧道创建成功！');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('📱 访问地址:');
  console.log(`   ${tunnel.url}`);
  console.log('');
  console.log('💡 在浏览器中打开上述地址即可访问应用');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('⚠️  隧道将在几分钟后过期，请尽快访问');
  console.log('📝 按 Ctrl+C 停止隧道');
  console.log('');

  tunnel.on('close', () => {
    console.log('🔌 隧道已关闭');
    process.exit(0);
  });

  tunnel.on('error', (err) => {
    console.error('❌ 隧道错误:', err);
    process.exit(1);
  });
}

startTunnel();
