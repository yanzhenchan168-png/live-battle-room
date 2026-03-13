# 一键部署到 Vercel 脚本

这个脚本会帮助你快速将应用部署到 Vercel。

## 使用方法

### 方式 1：使用 Vercel CLI（推荐）

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署
vercel

# 4. 配置环境变量
vercel env add NEXT_PUBLIC_COZE_BOT_ID
vercel env add COZE_TOKEN
vercel env add DINGTALK_WEBHOOK_URL

# 5. 生产部署
vercel --prod
```

### 方式 2：通过 Vercel 网页

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 导入你的 Git 仓库
3. 配置环境变量
4. 点击部署

## 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

```
NEXT_PUBLIC_COZE_BOT_ID=7607002201290211382
COZE_TOKEN=pat_dtlvGNjEEDXRaEjukLBpCq3gS4H5uPGAC47xEI14H5xwfdJwHlGDM1e5TEjUEfJ4
DINGTALK_WEBHOOK_URL=https://oapi.dingtalk.com/robot/send?access_token=aa451ea0ebb48a4bead46231acc24f2072f3a2f8af16aa4bd826359e6fe1c396
```

## 部署后

部署成功后，你会获得一个类似这样的域名：

```
https://live-battle-room-xxx.vercel.app
```

这个域名：
- ✅ 有 HTTPS（免费 SSL 证书）
- ✅ 有 CDN 加速
- ✅ 全球访问快速
- ✅ 可以配置自定义域名

## 自定义域名

如果需要配置自己的域名：

1. 在 Vercel 项目设置中添加域名
2. 配置 DNS 记录（CNAME 或 A 记录）
3. 等待 DNS 生效

## 常见问题

### Q: 部署后 API 调用失败？

A: 检查环境变量是否正确配置，确保 `COZE_TOKEN` 和 `NEXT_PUBLIC_COZE_BOT_ID` 已添加。

### Q: 如何查看部署日志？

A: 在 Vercel 项目页面，点击你的部署，然后点击 "View Function Logs"。

### Q: 如何回滚部署？

A: 在 Vercel 项目页面，找到之前的部署版本，点击 "Promote to Production"。

### Q: 免费额度够用吗？

A: Vercel 免费计划提供：
- 100GB 带宽/月
- 无限部署
- 100GB-edge 函数执行/月
- 全球 CDN

对于中小型应用完全够用。
