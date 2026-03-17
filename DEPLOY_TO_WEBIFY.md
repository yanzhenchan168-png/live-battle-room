# 腾讯云 Webify 部署完整指南

本文档详细说明如何将「一站式直播作战室」部署到腾讯云 Webify，让国内用户无需翻墙即可访问。

---

## 📋 目录

1. [前置准备](#前置准备)
2. [创建 Webify 应用](#创建-webify-应用)
3. [配置环境变量](#配置环境变量)
4. [部署应用](#部署应用)
5. [绑定自定义域名](#绑定自定义域名)
6. [常见问题](#常见问题)

---

## 前置准备

### 1. 账号准备

| 平台 | 用途 | 注册地址 |
|------|------|----------|
| 腾讯云 | Webify 托管平台 | https://cloud.tencent.com |
| GitHub | 代码仓库 | https://github.com |

### 2. 获取 API 密钥

#### 百度 OCR API
1. 访问 [百度智能云](https://console.bce.baidu.com/ai/)
2. 创建应用 → 选择「文字识别 OCR」
3. 获取 `API Key` 和 `Secret Key`

#### 扣子 Bot Token
1. 访问 [扣子平台](https://www.coze.cn/)
2. 创建或选择你的 Bot
3. 在 Bot 设置中获取 Bot ID
4. 在个人设置中获取 API Token

### 3. 确认代码已推送

```bash
# 检查代码状态
git status

# 推送到 GitHub
git push origin main
```

---

## 创建 Webify 应用

### 方法一：控制台创建（推荐）

#### 步骤 1：进入 Webify 控制台

访问：https://console.cloud.tencent.com/webify

![Webify 控制台](https://webify-1258344699.cos.ap-guangzhou.myqcloud.com/docs/console.png)

#### 步骤 2：点击「新建应用」

![新建应用](https://webify-1258344699.cos.ap-guangzhou.myqcloud.com/docs/new-app.png)

#### 步骤 3：选择 Git 仓库

1. 选择「Git 仓库」作为来源
2. 点击「授权 GitHub」
3. 授权后选择 `live-battle-room` 仓库

![选择仓库](https://webify-1258344699.cos.ap-guangzhou.myqcloud.com/docs/select-repo.png)

#### 步骤 4：确认构建设置

Webify 会自动检测 Next.js 框架，确认以下配置：

| 配置项 | 自动识别值 | 手动配置值 |
|--------|-----------|-----------|
| 框架 | Next.js | - |
| Node 版本 | 18 | 可在 `webify.json` 中指定 |
| 构建命令 | `next build` | - |
| 输出目录 | `.next` | - |
| 安装命令 | `npm install` | - |

![构建设置](https://webify-1258344699.cos.ap-guangzhou.myqcloud.com/docs/build-settings.png)

---

## 配置环境变量

### 步骤 1：进入环境变量设置

在应用创建页面，找到「环境变量」部分。

或在已创建应用的「设置」→「环境变量」中配置。

### 步骤 2：添加环境变量

点击「添加变量」，逐个添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `BAIDU_API_KEY` | 你的百度 API Key | 百度 OCR 识别必需 |
| `BAIDU_SECRET_KEY` | 你的百度 Secret Key | 百度 OCR 识别必需 |
| `COZE_BOT_ID` | 你的扣子 Bot ID | 话术生成必需 |
| `COZE_TOKEN` | 你的扣子 Token | API 调用必需 |

![环境变量](https://webify-1258344699.cos.ap-guangzhou.myqcloud.com/docs/env-vars.png)

### 步骤 3：保存配置

点击「保存」按钮保存环境变量配置。

⚠️ **重要提示**：
- 环境变量修改后需要重新部署才能生效
- 不要将真实密钥提交到 Git 仓库

---

## 部署应用

### 步骤 1：触发部署

配置完成后，点击「部署」按钮开始部署。

### 步骤 2：查看构建日志

在部署过程中可以查看实时构建日志：

```
> npm install
> npm run build

Creating an optimized production build...
Compiled successfully.

Linting and checking validity of types...
Creating an optimized production build...
Collecting page data...
Generating static pages (0/3)
Generating static pages (3/3)
Exporting successful
```

### 步骤 3：获取访问地址

部署成功后，Webify 会提供一个默认域名，格式为：

```
https://你的应用名-随机ID.tcloudbaseapp.com
```

### 步骤 4：验证部署

点击访问地址，检查以下功能：
- [ ] 页面正常加载
- [ ] ROI 计算功能正常
- [ ] 流量诊断功能正常
- [ ] 话术生成功能正常
- [ ] 截图识别功能正常

---

## 绑定自定义域名

### 步骤 1：进入域名管理

在应用详情页 → 「设置」→「自定义域名」

### 步骤 2：添加域名

1. 点击「添加域名」
2. 输入你的域名（如 `live.yourdomain.com`）
3. 选择域名验证方式

### 步骤 3：配置 DNS 解析

在你的域名服务商处添加 CNAME 记录：

| 记录类型 | 主机记录 | 记录值 |
|----------|----------|--------|
| CNAME | live | 你的Webify默认域名 |

以阿里云为例：

![DNS 配置](https://webify-1258344699.cos.ap-guangzhou.myqcloud.com/docs/dns-config.png)

### 步骤 4：配置 SSL

Webify 自动提供免费 SSL 证书，等待证书签发完成即可通过 HTTPS 访问。

---

## 常见问题

### Q1: 构建失败，提示依赖安装错误？

**解决方案**：
```bash
# 检查 package.json 中的依赖版本
# 确保 Node.js 版本兼容（建议 18.x）

# 本地测试构建
npm ci
npm run build
```

### Q2: 环境变量不生效？

**检查清单**：
1. 变量名是否正确（区分大小写）
2. 是否已重新部署
3. 检查 `next.config.mjs` 中的 `env` 配置

### Q3: API 调用失败（CORS 错误）？

**解决方案**：
项目中的 API 路由使用相对路径，不存在跨域问题：

```typescript
// ✅ 正确：使用相对路径
const res = await fetch('/api/analyze-screen', ...)

// ❌ 错误：使用绝对路径
const res = await fetch('https://other-domain.com/api', ...)
```

### Q4: 百度 OCR 调用失败？

**检查清单**：
1. 确认 API Key 和 Secret Key 正确
2. 检查百度云账户余额
3. 确认已开通 OCR 服务

### Q5: 扣子 API 调用失败？

**检查清单**：
1. 确认 Bot ID 正确
2. 确认 Token 有效（未过期）
3. 检查 Bot 是否已发布

### Q6: 页面加载慢？

**优化建议**：
1. Webify 默认提供 CDN 加速
2. 检查图片是否过大
3. 考虑绑定自定义域名并使用腾讯云 CDN

---

## 更新部署

### 自动部署

每次推送到 `main` 分支，Webify 会自动触发重新部署：

```bash
git add .
git commit -m "更新功能"
git push origin main
```

### 手动触发

在 Webify 控制台 → 应用详情 → 点击「重新部署」

---

## 费用说明

Webify 免费额度：
- **流量**：100GB/月
- **构建时长**：1000分钟/月
- **站点数量**：5个

超出后按量计费，详情查看：
https://cloud.tencent.com/document/product/1256/46184

---

## 技术支持

- Webify 官方文档：https://cloud.tencent.com/document/product/1256
- Webify 社区论坛：https://cloud.tencent.com/developer/tag/10593
- 项目 GitHub Issues：https://github.com/yanzhenchan168-png/live-battle-room/issues

---

## 附录：webify.json 配置说明

```json
{
  "framework": "nextjs",           // 框架类型
  "buildCommand": "next build",    // 构建命令
  "outputDirectory": ".next",      // 输出目录
  "installCommand": "npm install", // 安装命令
  "nodeVersion": "18",             // Node.js 版本
  "env": {                         // 环境变量引用
    "BAIDU_API_KEY": "@baidu-api-key",
    "BAIDU_SECRET_KEY": "@baidu-secret-key",
    "COZE_BOT_ID": "@coze-bot-id",
    "COZE_TOKEN": "@coze-token"
  }
}
```

`@变量名` 格式表示从 Webify 控制台读取环境变量值。
