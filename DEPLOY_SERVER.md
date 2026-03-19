# 阿里云服务器部署指南

## 部署架构

```
GitHub (代码仓库)
    ↓ 镜像同步
Gitee (国内镜像)
    ↓ git pull
阿里云轻量服务器 (宝塔面板)
    ↓ PM2 守护
Next.js 应用运行在 3000 端口
```

---

## 一、服务器环境要求

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | 18.x+ | 运行环境 |
| npm/pnpm | 最新版 | 包管理器 |
| PM2 | 全局安装 | 进程守护 |
| Git | 最新版 | 代码拉取 |
| Nginx | 可选 | 反向代理 |

---

## 二、首次部署

### 1. 克隆代码

```bash
# 进入网站目录
cd /www/wwwroot

# 从 Gitee 克隆
git clone https://gitee.com/chen-yanzhen168/live-battle-room.git
cd live-battle-room
```

### 2. 配置环境变量

```bash
# 创建环境变量文件
nano .env.local
```

填入以下内容：

```env
BAIDU_API_KEY=GKygd5LfLQvekpjAjFg9BfVW
BAIDU_SECRET_KEY=u0o4SQ3KGfOe5Ee27dqncj7lQko34eui
COZE_BOT_ID=7607002201290211382
COZE_TOKEN=pat_YBIiHGh8Rm6Kp2eS9jqGqt809ZDeBZsIEIFG2EjXHI2pUInZuti51GUvVvuT7MxU
NEXT_PUBLIC_COZE_BOT_ID=7607002201290211382
```

### 3. 安装依赖并构建

```bash
npm install --legacy-peer-deps
npm run build
```

### 4. 使用 PM2 启动

```bash
# 创建 PM2 配置文件
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'live-battle-room',
    script: 'npm',
    args: 'start',
    cwd: '/www/wwwroot/live-battle-room',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/www/wwwroot/live-battle-room/logs/error.log',
    out_file: '/www/wwwroot/live-battle-room/logs/out.log',
    log_file: '/www/wwwroot/live-battle-room/logs/combined.log',
    time: true
  }]
};
```

```bash
# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 5. Nginx 反向代理（可选但推荐）

在宝塔面板创建网站，然后修改 Nginx 配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 支持
    location /_next/webpack-hmr {
        proxy_pass http://127.0.0.1:5000/_next/webpack-hmr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 三、日常更新部署

### 手动部署

```bash
cd /www/wwwroot/live-battle-room
bash scripts/deploy-server.sh
```

### 一键部署命令

```bash
cd /www/wwwroot/live-battle-room && git pull gitee main && npm install --legacy-peer-deps && npm run build && pm2 restart live-battle-room
```

---

## 四、自动部署（Webhook）

### 1. 在 Gitee 配置 Webhook

1. 进入 Gitee 仓库 → 管理 → WebHooks
2. 添加 WebHook：
   - URL: `http://你的服务器IP:端口/webhook`
   - 密码: 设置一个密码

### 2. 在服务器创建 Webhook 服务

```bash
# 安装 webhook 工具
npm install -g webhook

# 创建 webhook 配置
mkdir -p /opt/webhook
nano /opt/webhook/hooks.json
```

```json
[
  {
    "id": "deploy-live-battle-room",
    "execute-command": "/www/wwwroot/live-battle-room/scripts/deploy-server.sh",
    "command-working-directory": "/www/wwwroot/live-battle-room",
    "response-message": "Deploying...",
    "trigger-rule": {
      "match": {
        "type": "payload-hmac-sha256",
        "secret": "你的Webhook密码",
        "parameter": {
          "source": "header",
          "name": "X-Gitee-Token"
        }
      }
    }
  }
]
```

```bash
# 启动 webhook 服务
webhook -hooks /opt/webhook/hooks.json -verbose -port 9000
```

---

## 五、常用命令

### PM2 管理

```bash
pm2 status                    # 查看状态
pm2 logs live-battle-room     # 查看日志
pm2 restart live-battle-room  # 重启应用
pm2 stop live-battle-room     # 停止应用
pm2 delete live-battle-room   # 删除应用
pm2 monit                     # 监控面板
```

### 日志查看

```bash
tail -f logs/error.log        # 错误日志
tail -f logs/out.log          # 输出日志
tail -f logs/combined.log     # 合并日志
```

### Nginx 管理（宝塔面板）

```bash
# 在宝塔面板 → 软件商店 → Nginx → 重载配置
# 或命令行
nginx -t                      # 测试配置
nginx -s reload               # 重载配置
```

---

## 六、故障排查

### 应用无法启动

```bash
# 检查端口占用
lsof -i:5000

# 检查 Node 版本
node -v  # 应该是 18.x+

# 检查环境变量
cat .env.local
```

### API 调用失败

```bash
# 检查环境变量是否正确加载
pm2 env live-battle-room

# 检查网络连接
curl -I https://api.coze.cn
```

### 内存不足

```bash
# 查看内存使用
free -h

# 增加 swap（如果需要）
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

---

## 七、监控与告警

### PM2 监控

```bash
# 安装 pm2-logrotate 自动切割日志
pm2 install pm2-logrotate

# 设置日志保留天数
pm2 set pm2-logrotate:retain 7
```

### 简单健康检查脚本

```bash
nano /www/wwwroot/live-battle-room/scripts/health-check.sh
```

```bash
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000)
if [ "$RESPONSE" != "200" ]; then
    echo "应用异常，正在重启..."
    pm2 restart live-battle-room
    # 可以添加钉钉/邮件通知
fi
```

```bash
# 添加定时任务（每分钟检查）
crontab -e
# 添加：* * * * * /www/wwwroot/live-battle-room/scripts/health-check.sh
```

---

## 八、备份策略

```bash
# 备份脚本
nano /www/wwwroot/live-battle-room/scripts/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/www/backup/live-battle-room"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份环境变量
cp /www/wwwroot/live-battle-room/.env.local $BACKUP_DIR/.env.local.$DATE

# 保留最近7天的备份
find $BACKUP_DIR -name "*.local.*" -mtime +7 -delete

echo "备份完成: $DATE"
```

```bash
# 每天凌晨3点备份
crontab -e
# 添加：0 3 * * * /www/wwwroot/live-battle-room/scripts/backup.sh
```

---

## 九、安全建议

1. **防火墙**：只开放必要端口（80, 443, SSH端口）
2. **SSH加固**：禁用密码登录，使用密钥
3. **定期更新**：`npm audit fix` 检查漏洞
4. **HTTPS**：使用 Let's Encrypt 免费证书
5. **敏感信息**：不要将 `.env.local` 提交到 Git

---

## 十、联系支持

- 项目仓库：https://github.com/yanzhenchan168-png/live-battle-room
- Gitee 镜像：https://gitee.com/你的用户名/live-battle-room
