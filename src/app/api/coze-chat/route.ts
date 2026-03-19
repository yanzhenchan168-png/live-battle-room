export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, payload } = body;

    const botId = process.env.NEXT_PUBLIC_COZE_BOT_ID;
    const token = process.env.COZE_TOKEN;

    console.log('API route called:', { command, hasBotId: !!botId, hasToken: !!token });

    if (!botId || !token) {
      console.error('Missing credentials:', { hasBotId: !!botId, hasToken: !!token });
      return NextResponse.json(
        { error: 'Coze API credentials not configured', details: 'Missing bot ID or token' },
        { status: 500 }
      );
    }

    // 根据不同的命令添加系统提示词
    let systemPrompt = '';
    let content = '';

    if (command === '/roi_calc') {
      systemPrompt = '请直接进行 ROI 计算，不要询问任何问题。必须返回纯 JSON 格式，格式如下：{"results": {"target_roi": 数字, "break_even_roi": 数字, "real_net_rate_pct": 数字, "profit_per_show": 数字, "risk_level": "健康/可控/高危", "risk_title": "标题", "gap_text": "描述", "cost_breakdown": {"ad": 数字, "anchor": 数字, "operation": 数字, "rent": 数字, "goods": 数字}}, "report": "详细报告文本"}。不要包含任何对话式文本或额外说明。';
      content = `${systemPrompt}\n\n计算参数：${JSON.stringify(payload)}`;
    } else if (command === '/traffic_diag') {
      systemPrompt = '请直接进行流量诊断，不要询问任何问题。返回诊断建议和策略。';
      content = `${systemPrompt}\n\n诊断参数：${JSON.stringify(payload)}`;
    } else if (command === '/script_gen') {
      systemPrompt = `请直接生成直播话术，不要询问任何问题。

你必须按照以下三段式结构生成话术，每段用明显的标题分隔：

## 🎯 塑品段（建立购买需求）
[解决"为什么买"的问题，从痛点切入，展示产品如何解决用户问题]

---

## 💰 报价段（建立价值认知）
[解决"为什么找我买"的问题，对比市场价格，展示性价比和保障]

---

## 🎁 收割段（促成立即购买）
[解决"为什么此时此刻买"的问题，营造紧迫感，促使用户立即下单]

注意：
1. 话术要口语化，像真正的主播在说话，不要生硬
2. 要把产品卖点自然地融入到话术中，不要生搬硬套
3. 每段话术要完整、有逻辑，不要半途而废
4. 使用"姐妹们"等亲切称呼，拉近距离`;
      content = `${systemPrompt}\n\n产品信息：${JSON.stringify(payload)}`;
    } else {
      content = JSON.stringify(payload);
    }

    console.log('Calling Coze API with stream mode:', { botId, command, contentLength: content.length });

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60秒超时

    try {
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
          stream: true,  // 使用流式模式
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log('Coze API response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Coze API error:', res.status, errorText);
        return NextResponse.json(
          { error: `Coze API error: ${res.status} ${res.statusText}`, details: errorText },
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
      let allChunks = '';
      let eventCount = 0;
      let eventType = '';
      let eventStatus = '';
      const eventTypes = new Set<string>();
      const allMessages: any[] = [];

      console.log('Starting to read stream...');

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('Stream reading completed, total events:', eventCount);
          console.log('Event types seen:', Array.from(eventTypes));
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        allChunks += chunk;
        eventCount++;

        const lines = chunk.split('\n');
        let currentEventType = '';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            // 事件类型行
            currentEventType = line.slice(6).trim();
            eventTypes.add(currentEventType);
          } else if (line.startsWith('data:')) {
            // 数据行
            const data = line.startsWith('data: ') ? line.slice(6) : line.slice(5);

            try {
              const event = JSON.parse(data);

              if (currentEventType === 'conversation.message.delta') {
                // 只取最终内容，过滤掉思考过程（reasoning_content）
                if (event.content) {
                  fullContent += event.content;
                }
                // 注意：不处理 event.reasoning_content，避免泄漏内部思考过程
              } else if (currentEventType === 'conversation.message.completed') {
                // 只处理 type 为 answer 的消息，忽略 verbose（系统内部消息）
                if (event.type === 'answer' && event.content) {
                  fullContent += event.content;
                  console.log('Found answer message, content length:', event.content.length);
                } else {
                  console.log('Skipping non-answer message:', event.type);
                }
                allMessages.push(event);
              } else if (currentEventType === 'conversation.chat.completed') {
                console.log('Chat completed, final content length:', fullContent.length);
                break; // 对话完成后立即停止
              } else if (currentEventType === 'error') {
                console.error('Stream error event:', event);
                throw new Error(`Stream error: ${event.msg || 'Unknown error'}`);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      console.log('Stream completed');
      console.log('Total content length:', fullContent.length);
      console.log('Total event count:', eventCount);
      console.log('All chunks (first 500 chars):', allChunks.substring(0, 500));

      if (!fullContent) {
        console.error('No content received from stream');
        console.error('All chunks (first 1000 chars):', allChunks.substring(0, 1000));

        // 尝试从所有事件中提取 verbose 消息
        const verboseMessages: any[] = [];
        const lines = allChunks.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const event = JSON.parse(data);
              if (event.event === 'conversation.message.completed') {
                verboseMessages.push(event.data);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }

        console.log('Verbose messages found:', verboseMessages.length);

        return NextResponse.json(
          {
            error: 'No content received',
            details: 'Stream ended without content',
            debug: {
              eventCount,
              chunks: allChunks.substring(0, 1000),
              verboseMessages: verboseMessages.slice(0, 3)
            }
          },
          { status: 500 }
        );
      }

      // 解析三段式话术结构
      function parseScriptStructure(content: string) {
        const structure: { shaping?: string; pricing?: string; harvesting?: string } = {};
        
        // 使用正则匹配各段落
        const shapingMatch = content.match(/##\s*[:：]?\s*[:：]?\s*塑品段[\s\S]*?(?=---|##\s*[:：]?\s*[:：]?\s*报价段|$)/i);
        const pricingMatch = content.match(/##\s*[:：]?\s*[:：]?\s*报价段[\s\S]*?(?=---|##\s*[:：]?\s*[:：]?\s*收割段|$)/i);
        const harvestingMatch = content.match(/##\s*[:：]?\s*[:：]?\s*收割段[\s\S]*?(?=---|$)/i);
        
        if (shapingMatch) {
          structure.shaping = shapingMatch[0]
            .replace(/##\s*[:：]?\s*[:：]?\s*塑品段[：:\s]*/i, '')
            .replace(/---+/g, '')
            .trim();
        }
        if (pricingMatch) {
          structure.pricing = pricingMatch[0]
            .replace(/##\s*[:：]?\s*[:：]?\s*报价段[：:\s]*/i, '')
            .replace(/---+/g, '')
            .trim();
        }
        if (harvestingMatch) {
          structure.harvesting = harvestingMatch[0]
            .replace(/##\s*[:：]?\s*[:：]?\s*收割段[：:\s]*/i, '')
            .replace(/---+/g, '')
            .trim();
        }
        
        return structure;
      }

      // 对于话术生成命令，解析结构
      let structure = {};
      if (command === '/script_gen') {
        structure = parseScriptStructure(fullContent);
        console.log('Parsed script structure:', Object.keys(structure));
      }

      // 构造响应格式
      const response = {
        messages: [{
          role: 'assistant',
          content: fullContent,
          type: 'answer',
        }],
        // 话术生成额外返回结构
        ...(command === '/script_gen' && {
          full_script: fullContent,
          structure,
        }),
      };

      console.log('Returning response with content length:', fullContent.length);
      return NextResponse.json(response);

    } catch (fetchError) {
      clearTimeout(timeout);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Request timeout');
        return NextResponse.json(
          { error: 'Request timeout', message: 'Coze API request timed out after 60 seconds' },
          { status: 504 }
        );
      }

      console.error('Fetch error:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('API route error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
