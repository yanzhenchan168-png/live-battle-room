# 一站式直播作战室

基于 Next.js 的直播诊断与决策平台，集成 ROI 计算、流量诊断和话术生成功能。

## 功能特性

### 三栏实时作战台
- **左栏 - 财务决策区**: ROI 计算器，包含成本结构可视化、盈亏预测和智能诊断报告
- **中栏 - 流量诊断区**: 基于在线人数匹配知识库策略，提供关键动作清单
- **右栏 - 话术执行区**: 三段式话术生成（塑品/报价/收割），支持多种卖点公式

### 智能联动
- ROI 计算完成 → 自动填充流量诊断的 ROI 状态
- 流量诊断完成 → 自动填充话术生成的流量层级
- 三阶段完成 → 显示"生成作战方案"按钮

### 底部指令中枢
- 推送到钉钉
- 保存方案（本地存储）
- 导出报告（Markdown 格式）
- 开始直播

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **图表**: Recharts
- **Markdown**: react-markdown
- **图标**: lucide-react

## 快速开始

### 安装依赖
```bash
pnpm install
```

### 配置环境变量
环境变量已配置完成，包含：
- **Coze API**: BOT ID 和 Token 已配置
- **钉钉 Webhook**: 推送消息已配置

### 启动开发服务器
```bash
pnpm dev
```

应用将在 `http://localhost:3000` 启动。

## 🚀 部署到生产环境

### 推荐方式：Vercel（最简单）

**为什么选择 Vercel？**
- ✅ Next.js 官方推荐
- ✅ 自动 HTTPS（免费 SSL 证书）
- ✅ 全球 CDN 加速
- ✅ 免费额度充足
- ✅ 零配置部署

**快速部署步骤：**

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署应用**
   ```bash
   vercel
   ```

4. **配置环境变量**
   ```bash
   vercel env add NEXT_PUBLIC_COZE_BOT_ID
   vercel env add COZE_TOKEN
   vercel env add DINGTALK_WEBHOOK_URL
   ```

5. **生产部署**
   ```bash
   vercel --prod
   ```

详细部署指南请查看：[部署指南.md](./部署指南.md)

### 其他部署方式

- **Netlify**: 查看 [部署指南.md](./部署指南.md)
- **云服务器**: 查看 [部署指南.md](./部署指南.md)
- **Docker**: 查看 [部署指南.md](./部署指南.md)

## 使用流程

1. **ROI 计算**
   - 填写基础参数（目标 GMV、投流预算、成本价、售价）
   - 配置人力成本（主播底薪、提成、运营成本）
   - 设置固定成本（租金、其他人员成本）
   - 点击"计算 ROI"查看财务看板

2. **流量诊断**
   - 输入开播 30 分钟后的稳定在线人数
   - 选择流量结构（自然流/付费流/短视频引流）
   - 点击"开始流量诊断"获取匹配策略

3. **话术生成**
   - 填写产品信息（名称、核心卖点、目标人群、价格）
   - 选择卖点公式（痛点解决方案、对比法、信任背书等）
   - 点击"生成话术"查看三段式话术

4. **导出/保存**
   - 点击"保存方案"保存到本地
   - 点击"导出报告"下载 Markdown 格式报告
   - 点击"推送到钉钉"发送到团队

## 项目结构

```
live-battle-room/
├── src/
│   ├── app/
│   │   └── page.tsx          # 主页面
│   ├── components/
│   │   ├── ROIPanel.tsx      # ROI 面板
│   │   ├── TrafficPanel.tsx  # 流量诊断面板
│   │   ├── ScriptPanel.tsx   # 话术生成面板
│   │   └── CommandBar.tsx    # 底部指令栏
│   ├── lib/
│   │   └── coze-client.ts    # Coze API 客户端
│   ├── store/
│   │   └── battleStore.ts    # Zustand 状态管理
│   └── types/
│       └── battle.ts         # TypeScript 类型定义
├── .env.local.example        # 环境变量示例
└── README.md
```

## API 集成

### Coze BOT 交互协议

应用通过统一 API 端点 `https://api.coze.cn/v3/chat` 与 BOT 交互，通过前缀区分意图：

- `/roi_calc`: 触发 ROI 计算工作流
- `/traffic_diag`: 触发流量诊断
- `/script_gen`: 触发话术生成

示例请求：
```javascript
{
  "bot_id": "YOUR_BOT_ID",
  "user_id": "user_1234567890",
  "additional_messages": [{
    "role": "user",
    "content": "/roi_calc {"target_gmv": 50000, ...}"
  }],
  "stream": false
}
```

## 注意事项

⚠️ **安全提醒**: 在 IM 多人群聊提问等场景中要谨防凭证泄露！

## 📚 文档

- [快速部署指南](./快速部署指南.md) - 5 分钟快速上线
- [详细部署指南](./部署指南.md) - 多种部署方式
- [Vercel 部署](./VERCEL_DEPLOY.md) - Vercel 专属指南

## 许可证

MIT
