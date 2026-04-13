export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { style, productInfo, ocrData, currentSegments } = body;

    const botId = process.env.COZE_BOT_ID;
    const token = process.env.COZE_TOKEN;

    if (!botId || !token) {
      return NextResponse.json(
        { error: 'Coze API credentials not configured' },
        { status: 500 }
      );
    }

    // 构建系统提示词
    const stylePrompts: Record<string, string> = {
      '憋单': `你是一位擅长"憋单"技巧的女装直播话术专家。
憋单风格特点：
- 不断强调库存紧张和限时优惠
- 使用"只有X件了"、"马上没了"、"抢不到的姐妹不要怪我"等话术
- 制造紧迫感，但不直接放单
- 反复展示产品价值，让用户觉得"不抢就亏了"`,
      '平播': `你是一位擅长"平播"风格的女装直播话术专家。
平播风格特点：
- 语气平和、亲切，像朋友聊天
- 重点讲解产品卖点和穿着体验
- 不过度制造紧迫感
- 强调品质和服务保障`,
      '收割': `你是一位擅长"收割"转化的话术专家。
收割风格特点：
- 直接给出最优惠的价格
- 强调立即下单的好处
- 使用"最后一波"、"错过等一年"等话术
- 快速促单，减少用户犹豫时间`,
    };

    const systemPrompt = `${stylePrompts[style] || stylePrompts['平播']}

你必须按照以下三段式结构生成话术，只返回 JSON 格式：

{
  "segments": [
    { "type": "塑品", "content": "塑品话术内容" },
    { "type": "报价", "content": "报价话术内容" },
    { "type": "收割", "content": "收割话术内容" }
  ]
}

要求：
1. 话术要口语化，像真正的女主播在说话
2. 自然融入产品卖点，不要生硬堆砌
3. 使用"姐妹们"、"宝子们"等亲切称呼
4. 规避违规词：用"都说好"代替"全网最好"，用"直播间专属价"代替"全网最低价"
5. 每段话术控制在150-200字左右`;

    const content = `${systemPrompt}

产品信息：
- 名称：${productInfo.name || '未命名'}
- 价格：¥${productInfo.price || 0}
- 卖点：${productInfo.sellingPoints?.join(', ') || '暂无'}

${ocrData ? `直播间数据：
- 在线人数：${ocrData.onlineCount}人
- 流量层级：${ocrData.trafficLevel}` : ''}

${currentSegments?.some((s: any) => s.content) ? `当前话术（供参考）：
${currentSegments.map((s: any) => `${s.type}：${s.content?.substring(0, 50) || '空'}...`).join('\n')}` : ''}

请生成${style}风格的三段式话术，返回JSON格式。`;

    // 调用 Coze API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const res = await fetch('https://api.coze.cn/v3/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bot_id: botId,
        user_id: `user_${Date.now()}`,
        additional_messages: [{ role: 'user', content }],
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Coze API error: ${res.status}`, details: errorText },
        { status: res.status }
      );
    }

    // 处理流式响应
    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('event:')) {
          // 事件类型行
        } else if (line.startsWith('data:')) {
          const data = line.startsWith('data: ') ? line.slice(6) : line.slice(5);
          try {
            const event = JSON.parse(data);
            if (event.content) {
              fullContent += event.content;
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    if (!fullContent) {
      return NextResponse.json(
        { error: 'No content received from Coze' },
        { status: 500 }
      );
    }

    // 尝试从响应中提取 JSON
    let segments;
    try {
      // 尝试找到 JSON 块
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        segments = parsed.segments || parsed;
      } else {
        // 如果没有找到 JSON，尝试按段落分割
        const parts = fullContent.split(/塑品|报价|收割/).filter(Boolean);
        segments = [
          { type: '塑品', content: parts[0]?.trim() || '塑品话术生成中...' },
          { type: '报价', content: parts[1]?.trim() || '报价话术生成中...' },
          { type: '收割', content: parts[2]?.trim() || '收割话术生成中...' },
        ];
      }
    } catch {
      // 解析失败，使用默认结构
      segments = [
        { type: '塑品', content: fullContent.substring(0, 200) },
        { type: '报价', content: fullContent.substring(200, 400) },
        { type: '收割', content: fullContent.substring(400, 600) },
      ];
    }

    return NextResponse.json({ segments, raw: fullContent });

  } catch (error) {
    console.error('Generate script error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
