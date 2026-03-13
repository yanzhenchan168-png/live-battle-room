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

    console.log('Calling Coze API with:', { botId, content: content.substring(0, 100) });

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30秒超时

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
          stream: false,
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

      const data = await res.json();
      console.log('Coze API response data received');
      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeout);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Request timeout');
        return NextResponse.json(
          { error: 'Request timeout', message: 'Coze API request timed out after 30 seconds' },
          { status: 504 }
        );
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('API route error:', error);
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
