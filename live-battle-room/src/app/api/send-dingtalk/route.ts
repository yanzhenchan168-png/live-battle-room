import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roiData, trafficData, scriptData } = body;

    const webhookUrl = process.env.DINGTALK_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: '钉钉 Webhook 未配置' },
        { status: 500 }
      );
    }

    // 构建钉钉消息
    const message = {
      msgtype: 'markdown',
      markdown: {
        title: '🎬 直播作战方案',
        text: `## 🎬 直播作战方案报告
生成时间: ${new Date().toLocaleString()}

---

### 1. 财务决策
${roiData ? `
- **目标GMV**: ¥${roiData.inputs.target_gmv}
- **目标ROI**: ${roiData.results.target_roi.toFixed(2)}
- **盈亏平衡ROI**: ${typeof roiData.results.break_even_roi === 'number' ? roiData.results.break_even_roi.toFixed(2) : roiData.results.break_even_roi}
- **真实净利率**: ${roiData.results.real_net_rate_pct.toFixed(2)}%
- **单场净利**: ¥${roiData.results.profit_per_show.toFixed(0)}
- **风险等级**: ${roiData.results.risk_level}
` : '❌ 未完成'}

---

### 2. 流量诊断
${trafficData ? `
- **在线人数**: ${trafficData.online_count}人
- **流量层级**: ${trafficData.level}
- **匹配策略**: ${trafficData.strategy}

**关键动作**:
${trafficData.key_actions.map((action: string, i: number) => `${i + 1}. ${action}`).join('\n')}
` : '❌ 未完成'}

---

### 3. 话术方案
${scriptData ? `
- **产品名称**: ${scriptData.product.name}
- **价格**: ¥${scriptData.product.price}
- **核心卖点**: ${scriptData.product.selling_point}
- **卖点公式**: ${scriptData.selected_formula}

**完整话术**:
\`\`\`
${scriptData.full_script.substring(0, 500)}${scriptData.full_script.length > 500 ? '...' : ''}
\`\`\`
` : '❌ 未完成'}

---
📱 由一站式直播作战室生成`,
      },
    };

    // 发送钉钉消息
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.errcode !== 0) {
      throw new Error(result.errmsg || '钉钉发送失败');
    }

    return NextResponse.json({ success: true, message: '已推送到钉钉' });
  } catch (error) {
    console.error('发送钉钉消息失败:', error);
    return NextResponse.json(
      { error: '发送失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
