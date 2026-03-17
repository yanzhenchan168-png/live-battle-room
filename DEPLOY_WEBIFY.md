# 腾讯云 Webify 部署指南

## 一、前置准备

1. **腾讯云账号**：注册并登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. **GitHub 账号**：用于连接代码仓库
3. **已推送代码**：确保代码已推送到 GitHub

---

## 二、部署步骤

### 1. 进入 Webify 控制台

访问：https://console.cloud.tencent.com/webify

### 2. 创建新应用

1. 点击「新建应用」
2. 选择「从 Git 仓库导入」
3. 授权 GitHub 并选择仓库 `live-battle-room`
4. 框架类型会自动识别为 `Next.js`

### 3. 配置构建设置

在构建配置页面确认：

| 配置项 | 值 |
|--------|-----|
| 构建命令 | `npm run build` |
| 输出目录 | `.next` |
| Node 版本 | 18 |
| 安装命令 | `npm install` |

### 4. 配置环境变量

在「环境变量」设置中添加以下变量：

```
BAIDU_API_KEY=GKygd5LfLQvekpjAjFg9BfVW
BAIDU_SECRET_KEY=u0o4SQ3KGfOe5Ee27dqncj7lQko34eui
COZE_BOT_ID=7607002201290211382
COZE_TOKEN=<你的Coze Token>
```

⚠️ **重要**：
- `COZE_TOKEN` 需要在 Coze 平台获取
- 敏感信息建议使用 Webify 的「加密环境变量」功能

### 5. 开始部署

1. 点击「部署」按钮
2. 等待构建完成（约 2-5 分钟）
3. 部署成功后会获得访问域名

---

## 三、自定义域名（可选）

### 1. 添加自定义域名

1. 进入应用详情页 → 「域名管理」
2. 点击「添加域名」
3. 输入你的域名（如 `live.yourdomain.com`）

### 2. 配置 DNS 解析

在域名服务商处添加 CNAME 记录：

| 记录类型 | 主机记录 | 记录值 |
|----------|----------|--------|
| CNAME | live | 你的Webify域名 |

### 3. 配置 SSL（可选）

Webify 默认提供免费 SSL 证书，也可上传自定义证书。

---

## 四、常见问题

### Q1: 构建失败怎么办？

检查以下内容：
1. `package.json` 中的依赖版本是否兼容
2. Node.js 版本是否为 18+
3. 查看 Webify 构建日志定位具体错误

### Q2: 环境变量不生效？

1. 确认环境变量名称正确
2. 重新部署应用使环境变量生效
3. 服务端变量（如 `COZE_TOKEN`）不要带 `NEXT_PUBLIC_` 前缀

### Q3: 访问速度慢？

1. Webify 默认提供 CDN 加速
2. 如需更快速度，可绑定自定义域名并使用腾讯云 CDN

---

## 五、部署配置文件说明

项目已包含 `webify.yaml` 配置文件，包含以下设置：

```yaml
name: live-battle-room
framework: nextjs
build:
  nodeVersion: "18"
  command: npm run build
  output: .next
```

如需修改，可直接编辑此文件并推送。

---

## 六、后续维护

### 更新代码

```bash
git add .
git commit -m "更新内容"
git push origin main
```

推送后 Webify 会自动触发重新部署。

### 查看日志

在 Webify 控制台 → 应用详情 → 「运行日志」中查看实时日志。

---

## 七、费用说明

Webify 提供免费额度：
- 每月 100GB 流量
- 每月 1000 分钟构建时长

超出后按量计费，详情查看 [Webify 定价](https://cloud.tencent.com/product/webify/pricing)。
