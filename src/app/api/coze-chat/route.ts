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

      console.log('Starting to read stream...');

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('Stream reading completed, total events:', eventCount);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        allChunks += chunk;
        eventCount++;

        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const event = JSON.parse(data);
              console.log(`Stream event ${eventCount}:`, JSON.stringify(event));

              if (event.event === 'conversation.message.delta') {
                if (event.data?.content) {
                  fullContent += event.data.content;
                  console.log(`Content added, total length: ${fullContent.length}`);
                }
              } else if (event.event === 'conversation.message.completed') {
                eventType = 'completed';
                eventStatus = event.data?.status || '';
                console.log(`Message completed, status: ${eventStatus}`);
              } else if (event.event === 'conversation.chat.completed') {
                console.log(`Chat completed, status: ${event.data?.status}`);
                if (event.data?.conversation_id) {
                  console.log(`Conversation ID: ${event.data.conversation_id}`);
                }
              } else if (event.event === 'error') {
                console.error('Stream error event:', event.data);
                throw new Error(`Stream error: ${event.data?.msg || 'Unknown error'}`);
              }
            } catch (e) {
              console.log('Failed to parse event data:', line);
            }
          }
        }
      }

      console.log('Stream completed');
      console.log('Total content length:', fullContent.length);
      console.log('Total event count:', eventCount);
      console.log('All chunks:', allChunks.substring(0, 500));

      if (!fullContent) {
        console.error('No content received from stream');
        console.error('All chunks:', allChunks);
        return NextResponse.json(
          {
            error: 'No content received',
            details: 'Stream ended without content',
            debug: {
              eventCount,
              chunks: allChunks.substring(0, 1000)
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
