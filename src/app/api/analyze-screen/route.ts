import { NextRequest, NextResponse } from 'next/server';

// 百度OCR Token缓存
let baiduTokenCache: { token: string; expires: number } | null = null;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as Blob;
    
    if (!image) {
      return NextResponse.json({ error: '请上传图片' }, { status: 400 });
    }

    // 1. 百度OCR识别
    const ocrText = await baiduOCR(image);
    
    // 2. 解析直播数据（核心代码，一劳永逸）
    const data = parseLiveData(ocrText);
    
    return NextResponse.json({ 
      success: true, 
      data,
      raw: ocrText // 调试用，稳定后可删除
    });

  } catch (error) {
    console.error('OCR失败:', error);
    return NextResponse.json(
      { error: '识别失败，请确保图片清晰且为数据大屏截图' }, 
      { status: 500 }
    );
  }
}

// 百度OCR调用
async function baiduOCR(imageBlob: Blob): Promise<string> {
  // 获取AccessToken（自动缓存）
  if (!baiduTokenCache || Date.now() > baiduTokenCache.expires) {
    const apiKey = process.env.BAIDU_API_KEY;
    const secretKey = process.env.BAIDU_SECRET_KEY;
    
    const res = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
    );
    const data = await res.json();
    baiduTokenCache = {
      token: data.access_token,
      expires: Date.now() + (data.expires_in - 300) * 1000 // 提前5分钟过期
    };
  }

  const buffer = Buffer.from(await imageBlob.arrayBuffer());
  const base64 = buffer.toString('base64');

  const res = await fetch(
    `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${baiduTokenCache.token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `image=${encodeURIComponent(base64)}&detect_direction=true`,
    }
  );

  const data = await res.json();
  
  if (data.error_code) {
    throw new Error(`百度OCR错误: ${data.error_msg}`);
  }

  return data.words_result?.map((w: any) => w.words).join(' ') || '';
}

// 直播数据解析核心函数（一劳永逸，适配抖音/快手/视频号/小红书）
function parseLiveData(text: string) {
  const result: any = {
    gmv: null,
    online: null,
    conversion: null,
    avgPrice: null,
    orders: null,
    uv: null,
    exposure: null,
    clickRate: null,
    platform: detectPlatform(text), // 自动识别平台
    rawText: text // 保留原始文本
  };

  const t = text.replace(/\s+/g, ''); // 去空格

  // GMV（成交金额）- 支持"万"单位
  const gmvPatterns = [
    /(?:成交金额|GMV|销售额|总收入)[^\d]*(\d+\.?\d*)(万)?/,
    /(\d+\.?\d*)万?\s*(?:GMV|销售额)/,
    /(?:本场|今日)[^\d]*(\d+\.?\d*)(万)?[^\d]*(?:GMV|成交)/
  ];
  for (const pattern of gmvPatterns) {
    const match = t.match(pattern);
    if (match) {
      const num = parseFloat(match[1]);
      result.gmv = match[2] === '万' ? num * 10000 : num;
      break;
    }
  }

  // 在线人数
  const onlinePatterns = [
    /(?:实时在线|当前观看|在线人数|在看人数)[^\d]*(\d+)/,
    /(\d+)[^\d]*(?:人在看|人在线|观看)/
  ];
  for (const pattern of onlinePatterns) {
    const match = t.match(pattern);
    if (match) {
      result.online = parseInt(match[1]);
      break;
    }
  }

  // 转化率（成交率）
  const convMatch = t.match(/(?:转化率|成交率|下单率)[^\d]*(\d+\.?\d*)%/);
  if (convMatch) result.conversion = parseFloat(convMatch[1]);

  // 客单价
  const priceMatch = t.match(/(?:客单价|人均消费|笔单价)[^\d]*(\d+)/);
  if (priceMatch) result.avgPrice = parseInt(priceMatch[1]);

  // 订单数/成交量
  const orderPatterns = [
    /(?:订单数|成交量|成交单|支付单)[^\d]*(\d+)/,
    /(\d+)[^\d]*(?:单|笔)[^\d]*(?:成交|支付)/
  ];
  for (const pattern of orderPatterns) {
    const match = t.match(pattern);
    if (match) {
      result.orders = parseInt(match[1]);
      break;
    }
  }

  // 曝光人数/次数
  const exposureMatch = t.match(/(?:曝光人数|观看次数|流量)[^\d]*(\d+)/);
  if (exposureMatch) result.exposure = parseInt(exposureMatch[1]);

  // UV（访客数）
  const uvMatch = t.match(/(?:UV|访客|独立访客)[^\d]*(\d+)/);
  if (uvMatch) result.uv = parseInt(uvMatch[1]);

  // 点击率
  const clickMatch = t.match(/(?:点击率|商品点击)[^\d]*(\d+\.?\d*)%/);
  if (clickMatch) result.clickRate = parseFloat(clickMatch[1]);

  // 如果没识别到GMV但识别了订单和客单价，自动计算
  if (!result.gmv && result.orders && result.avgPrice) {
    result.gmv = result.orders * result.avgPrice;
    result._calculated = true; // 标记为计算值
  }

  return result;
}

// 自动识别平台
function detectPlatform(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('抖音') || t.includes('罗盘')) return '抖音';
  if (t.includes('快手')) return '快手';
  if (t.includes('视频号')) return '视频号';
  if (t.includes('小红书')) return '小红书';
  if (t.includes('淘宝') || t.includes('天猫')) return '淘宝';
  return '未知';
}
