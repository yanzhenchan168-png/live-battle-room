export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { competitorSnippet, productInfo, targetSegment, currentScript } = body;

    const botId = process.env.COZE_BOT_ID;
    const token = process.env.COZE_TOKEN;

    if (!botId || !token) {
      return NextResponse.json(
        { error: 'Coze API credentials not configured' },
        { status: 500 }
      );
    }

    if (!competitorSnippet || !productInfo?.name) {
      return NextResponse.json(
        { error: 'Missing required fields: competitorSnippet or productInfo' },
        { status: 400 }
      );
    }

    const systemPrompt = `你是一位直播话术融合专家。你的任务是将竞品话术适配到用户的产品上。

融合规则：
1. 保留原话术的促单节奏和表达方式
2. 将竞品产品信息替换为用户的产品信息
3. 根据目标段落类型（塑品/报价/收割）调整话术重点
4. 规避违规词：用"都说好"代替"全网最好"，用"直播间专属"代替"全网最低"
5. 保持口语化，像真正的主播在说话

只返回融合后的话术内容，不要解释，不要JSON格式。`;

    const content = `${systemPrompt}

【竞品话术原文】
${competitorSnippet}

【用户产品信息】
- 产品名称：${productInfo.name}
- 价格：¥${productInfo.price || '待定'}
- 卖点：${productInfo.sellingPoints?.join(', ') || '暂无'}

【目标段落类型】
${targetSegment}

【当前话术上下文】（供参考，保持风格一致）
${currentScript?.map((s: any) => `${s.type}：${s.content?.substring(0, 30) || '空'}...`).join('\n') || '无'}

请直接返回适配后的${targetSegment}话术，只返回话术内容，不要任何其他说明。`;

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
        if (line.startsWith('data:')) {
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

    // 清理返回的内容
    const fusedContent = fullContent
      .replace(/^(以下是|这是|融合后的话术|适配后的话术)[：:]?\s*/i, '')
      .replace(/\*\*/g, '')  // 移除 Markdown 加粗
      .trim();

    return NextResponse.json({ 
      fusedContent,
      meta: {
        targetSegment,
        originalLength: competitorSnippet.length,
        fusedLength: fusedContent.length,
      }
    });

  } catch (error) {
    console.error('Fuse script error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
