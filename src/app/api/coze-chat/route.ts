import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, payload } = body;

    const botId = process.env.NEXT_PUBLIC_COZE_BOT_ID;
    const token = process.env.COZE_TOKEN;

    if (!botId || !token) {
      return NextResponse.json(
        { error: 'Coze API credentials not configured' },
        { status: 500 }
      );
    }

    const content = command
      ? `${command} ${JSON.stringify(payload)}`
      : JSON.stringify(payload);

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
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Coze API error:', res.status, errorText);
      return NextResponse.json(
        { error: `Coze API error: ${res.status} ${res.statusText}`, details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
