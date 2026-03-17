# 🎯 一站式直播作战室

避坑提效 · 智能决策 · 数据驱动

## 功能特点

- **ROI 计算**：精准计算直播投资回报率，智能诊断财务健康度
- **流量诊断**：分析流量层级，匹配最优运营策略
- **话术生成**：基于产品信息智能生成三段式直播话术
- **截图识别**：上传数据大屏截图，自动识别并填充数据

## 技术栈

- Next.js 14.2.0
- React 18.2.0
- TypeScript 5.3.0
- Tailwind CSS 3.4.0
- Zustand 状态管理
- 百度 OCR API

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 填入真实密钥

# 开发模式
npm run dev

# 构建生产版本
npm run build
npm run start
```

## 部署

### Vercel 部署（海外用户）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yanzhenchan168-png/live-battle-room)

### 腾讯云 Webify 部署（国内用户推荐）

[![Deploy to Webify](https://cloudbase.net/deploy.svg)](https://console.cloud.tencent.com/webify)

详细部署步骤请查看 [DEPLOY_TO_WEBIFY.md](./DEPLOY_TO_WEBIFY.md)

## 环境变量

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `BAIDU_API_KEY` | 百度 OCR API Key | [百度智能云](https://console.bce.baidu.com/ai/) |
| `BAIDU_SECRET_KEY` | 百度 OCR Secret Key | 同上 |
| `COZE_BOT_ID` | 扣子 Bot ID | [扣子平台](https://www.coze.cn/) |
| `COZE_TOKEN` | 扣子 API Token | 同上 |

## 项目结构

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API 路由
│   │   │   ├── analyze-screen/ # OCR 识别接口
│   │   │   └── coze-chat/      # 扣子对话接口
│   │   └── page.tsx            # 主页面
│   ├── components/             # React 组件
│   │   ├── ROIPanel.tsx        # ROI 计算面板
│   │   ├── TrafficPanel.tsx    # 流量诊断面板
│   │   ├── ScriptPanel.tsx     # 话术生成面板
│   │   └── DataScreenUpload.tsx # 截图上传组件
│   ├── store/                  # Zustand 状态管理
│   ├── types/                  # TypeScript 类型定义
│   └── utils/                  # 工具函数
├── webify.json                 # Webify 配置
└── next.config.mjs             # Next.js 配置
```

## License

MIT
