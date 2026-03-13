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

    const content = command
      ? `${command} ${JSON.stringify(payload)}`
      : JSON.stringify(payload);

    console.log('Calling Coze API with stream mode:', { botId, content: content.substring(0, 100) });

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
                // 检查 content 或 reasoning_content
                if (event.content) {
                  fullContent += event.content;
                } else if (event.reasoning_content) {
                  fullContent += event.reasoning_content;
                }
              } else if (currentEventType === 'conversation.message.completed') {
                eventType = 'completed';
                eventStatus = event.status || '';
                allMessages.push(event);
              } else if (currentEventType === 'conversation.chat.completed') {
                console.log('Chat completed');
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

      // 构造响应格式
      const response = {
        messages: [{
          role: 'assistant',
          content: fullContent,
          type: 'answer',
        }],
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
