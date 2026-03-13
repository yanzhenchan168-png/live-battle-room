import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '/';

  // 代理到本地 Next.js 应用
  try {
    const response = await fetch(`http://localhost:3000${path}`, {
      headers: {
        // 转发原始请求头
        'user-agent': request.headers.get('user-agent') || '',
        'accept': request.headers.get('accept') || '*/*',
        'accept-language': request.headers.get('accept-language') || 'en-US,en;q=0.9',
      },
      cache: 'no-store',
    });

    // 复制响应
    const body = await response.text();

    // 修改 HTML 中的资源路径
    let modifiedBody = body;

    // 替换相对路径为绝对路径（通过代理）
    if (path === '/' && body.includes('<html')) {
      const baseUrl = 'https://50feec69-3ab2-40b1-93ce-eae714ac1e51.dev.coze.site/api/proxy-app';

      // 替换 JavaScript 和 CSS 资源路径
      modifiedBody = body.replace(
        /href="\/_next\//g,
        `href="${baseUrl}?path=/_next/`
      ).replace(
        /src="\/_next\//g,
        `src="${baseUrl}?path=/_next/`
      );
    }

    return new NextResponse(modifiedBody, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'text/html',
        'cache-control': 'no-store, no-cache, must-revalidate',
        'access-control-allow-origin': '*',
      },
    });
  } catch (error) {
    console.error('代理错误:', error);
    return NextResponse.json(
      { error: '代理失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
