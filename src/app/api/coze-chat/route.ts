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
          stream: false,  // 临时改为非流式模式测试
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

      // 处理非流式响应
      const data = await res.json();
      console.log('Coze API response:', JSON.stringify(data, null, 2));

      if (data.code !== 0) {
        console.error('Coze API returned error code:', data);
        return NextResponse.json(
          { error: `Coze API error: ${data.code}`, message: data.msg || 'Unknown error' },
          { status: 500 }
        );
      }

      // 检查响应中的消息
      if (!data.data?.messages || data.data.messages.length === 0) {
        console.error('No messages in response:', JSON.stringify(data, null, 2));
        return NextResponse.json(
          { error: 'No messages in response', details: 'Coze returned empty messages' },
          { status: 500 }
        );
      }

      // 找到助手的回复消息
      const assistantMessage = data.data.messages.find((msg: any) => msg.role === 'assistant' && msg.type === 'answer');
      if (!assistantMessage || !assistantMessage.content) {
        console.error('No assistant message found:', JSON.stringify(data.data.messages, null, 2));
        return NextResponse.json(
          { error: 'No assistant message found', details: 'No assistant reply in response' },
          { status: 500 }
        );
      }

      const fullContent = assistantMessage.content;
      console.log('Response content length:', fullContent.length);

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
      console.error('Fetch error:', fetchError);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Request timeout');
        return NextResponse.json(
          { error: 'Request timeout', message: 'Coze API request timed out after 60 seconds' },
          { status: 504 }
        );
      }
      
      console.error('Fetch error details:', {
        name: fetchError instanceof Error ? fetchError.name : 'Unknown',
        message: fetchError instanceof Error ? fetchError.message : String(fetchError),
        stack: fetchError instanceof Error ? fetchError.stack : undefined
      });
      
      return NextResponse.json(
        { 
          error: 'Fetch failed', 
          message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          stack: fetchError instanceof Error ? fetchError.stack : undefined
        },
        { status: 500 }
      );
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
