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

// 直播数据解析核心函数（优化版 - 支持抖音罗盘格式）
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
    platform: detectPlatform(text),
    rawText: text // 调试时查看原始OCR文本
  };

  // 保留原始文本用于调试，同时创建清理版本用于匹配
  // 支持带逗号的数字：551,659 -> 551659
  const t = text.replace(/\s+/g, '').replace(/,/g, '');

  // ========== GMV（成交金额）==========
  // 抖音罗盘格式：¥551,659 或 成交金额 ¥551659
  const gmvPatterns = [
    // 抖音罗盘：¥符号后跟数字（支持带逗号的原始文本）
    /¥\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/,
    // 中文标签格式
    /(?:成交金额|GMV|销售额|总收入|成交)[^\d¥]*(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(万)?/,
    // 数字+万+单位
    /(\d+\.?\d*)万(?:元|GMV|成交|销售)/,
    // 纯数字后接单位（大数值优先）
    /(\d{5,})(?:元|GMV|成交|销售)/,
  ];
  
  for (const pattern of gmvPatterns) {
    const match = text.match(pattern) || t.match(pattern);
    if (match) {
      let numStr = match[1].replace(/,/g, '');
      let num = parseFloat(numStr);
      // 如果有"万"单位，乘以10000
      if (match[2] === '万' || match[0].includes('万')) {
        num = num * 10000;
      }
      // 合理的GMV范围：1000 - 1亿
      if (num >= 1000 && num <= 100000000) {
        result.gmv = num;
        break;
      }
    }
  }

  // ========== 在线人数 ==========
  // 抖音罗盘格式："平均在线" 或 "实时在线" 后面的数字
  const onlinePatterns = [
    // 平均在线/实时在线 + 数字（明确标签，优先使用）
    { pattern: /(?:平均在线|实时在线|当前在线|在线人数|在看人数)[^\d]*(\d+)/, labeled: true },
    // 数字 + 人在线/人在看/观看
    { pattern: /(\d+)[^\d]*(?:人在线|人在看|观看)/, labeled: false },
    // 独立的大数字（50-10000范围），可能是在线人数
    { pattern: /(?:^|[^\d])(\d{2,4})(?:[^\d]|$)/, labeled: false },
  ];
  
  for (const { pattern, labeled } of onlinePatterns) {
    const match = t.match(pattern);
    if (match) {
      let num = parseInt(match[1]);
      // 合理的在线人数范围：10 - 100000
      if (num >= 10 && num <= 100000) {
        // 明确标签的匹配直接使用
        if (labeled) {
          result.online = num;
          break;
        }
        // 非明确标签的匹配需要与GMV做合理性检查
        if (result.gmv) {
          // 如果数字比GMV小很多（小于GMV/50），可能是在线人数
          if (num < result.gmv / 50) {
            result.online = num;
            break;
          }
        } else {
          // 没有GMV时，优先使用较小的数字
          if (!result.online || num < result.online) {
            result.online = num;
          }
        }
      }
    }
  }

  // ========== 转化率 ==========
  // 抖音罗盘："转化率" 或 "点击-成交转化率" 后面的百分比
  const conversionPatterns = [
    /(?:转化率|成交率|下单率|点击-成交转化率)[^\d]*(\d+\.?\d*)%/,
    /(\d+\.?\d*)%[^\d]*(?:转化|成交)/,
  ];
  for (const pattern of conversionPatterns) {
    const match = t.match(pattern);
    if (match) {
      let num = parseFloat(match[1]);
      // 合理的转化率：0.01% - 50%
      if (num >= 0.01 && num <= 50) {
        result.conversion = num;
        break;
      }
    }
  }

  // ========== 客单价 ==========
  // 抖音罗盘："客单价" 或 "成交客单价"
  const pricePatterns = [
    /(?:客单价|人均消费|笔单价|成交客单价)[^\d¥]*(\d+)/,
    /(?:单价|均价)[^\d]*(\d{2,4})(?:元|¥)/,
  ];
  for (const pattern of pricePatterns) {
    const match = t.match(pattern);
    if (match) {
      let num = parseInt(match[1]);
      // 合理的客单价：10 - 10000
      if (num >= 10 && num <= 10000) {
        result.avgPrice = num;
        break;
      }
    }
  }

  // ========== 订单数/成交量 ==========
  const orderPatterns = [
    /(?:订单数|成交量|成交单|支付单|成交件数)[^\d]*(\d+)/,
    /(\d+)[^\d]*(?:单|笔)[^\d]*(?:成交|支付)/,
    /(?:成交|支付)[^\d]*(\d{2,5})[^\d]*(?:单|笔)/,
  ];
  for (const pattern of orderPatterns) {
    const match = t.match(pattern);
    if (match) {
      let num = parseInt(match[1]);
      if (num >= 1 && num <= 1000000) {
        result.orders = num;
        break;
      }
    }
  }

  // ========== 曝光人数 ==========
  const exposureMatch = t.match(/(?:曝光人数|观看次数|曝光量)[^\d]*(\d+)/);
  if (exposureMatch) result.exposure = parseInt(exposureMatch[1]);

  // ========== UV（访客数）==========
  const uvMatch = t.match(/(?:UV|访客|独立访客|商品访客数)[^\d]*(\d+)/);
  if (uvMatch) result.uv = parseInt(uvMatch[1]);

  // ========== 点击率 ==========
  const clickMatch = t.match(/(?:点击率|商品点击)[^\d]*(\d+\.?\d*)%/);
  if (clickMatch) result.clickRate = parseFloat(clickMatch[1]);

  // 如果没识别到GMV但识别了订单和客单价，自动计算
  if (!result.gmv && result.orders && result.avgPrice) {
    result.gmv = result.orders * result.avgPrice;
    result._calculated = true;
  }

  // 调试日志（部署后可删除）
  console.log('OCR解析结果:', {
    原始文本前200字: text.substring(0, 200),
    解析结果: result
  });

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
