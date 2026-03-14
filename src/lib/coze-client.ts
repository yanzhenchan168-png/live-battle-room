import { CozeChatResponse } from '@/types/battle';

export class CozeLiveClient {
  private apiUrl: string;

  constructor() {
    // 使用本地 API 路由
    this.apiUrl = '/api/coze-chat';
  }

  async sendCommand(
    command: '/roi_calc' | '/traffic_diag' | '/script_gen' | null,
    payload: any
  ): Promise<any> {
    try {
      console.log('sendCommand called:', { command, payload });

      // 添加超时控制
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000); // 90秒超时

      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, payload }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        console.error('API route error:', errorData);
        throw new Error(errorData.error || `API error: ${res.status}`);
      }

      const data: CozeChatResponse = await res.json();
      console.log('Raw API response:', JSON.stringify(data, null, 2));

      return this.parseResponse(data, command);
    } catch (error) {
      console.error('Coze API call failed:', error);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('请求超时，请稍后重试（API 响应时间过长）');
        }
        throw new Error(`请求失败: ${error.message}`);
      }

      throw new Error('未知错误，请稍后重试');
    }
  }

  private parseResponse(raw: CozeChatResponse, command: string | null): any {
    console.log('Parsing response:', JSON.stringify(raw, null, 2));

    if (!raw) {
      throw new Error('未收到响应');
    }

    if (!raw.messages || raw.messages.length === 0) {
      console.error('No messages in response. Full response:', JSON.stringify(raw, null, 2));
      throw new Error('响应为空，请稍后重试');
    }

    const content = raw.messages[0].content;
    console.log('Message content length:', content.length);
    console.log('Message content preview:', content.substring(0, 200));

    try {
      if (command === '/roi_calc') {
        // 尝试解析 JSON
        try {
          const parsed = JSON.parse(content);
          console.log('ROI calculation parsed successfully');
          return parsed;
        } catch (parseError) {
          console.error('Failed to parse ROI response as JSON:', parseError);
          console.error('Content that failed:', content);

          // 如果 JSON 解析失败，尝试从文本中提取数据
          return this.extractROIDataFromText(content);
        }
      } else if (command === '/traffic_diag') {
        return this.parseTrafficResponse(content);
      } else if (command === '/script_gen') {
        return this.parseScriptResponse(content);
      }
      return content;
    } catch (error) {
      console.error('Failed to parse response:', error);
      console.error('Content that failed to parse:', content);
      throw new Error(`解析响应失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private extractROIDataFromText(content: string) {
    console.log('Attempting to extract ROI data from text');

    // 尝试从文本中提取关键数据
    const lines = content.split('\n');
    let target_roi = 0;
    let break_even_roi = 0;
    let real_net_rate_pct = 0;
    let profit_per_show = 0;
    let risk_level = '未知';
    let risk_title = '';
    let gap_text = '';

    const cost_breakdown = {
      ad: 0,
      anchor: 0,
      operation: 0,
      rent: 0,
      goods: 0,
    };

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      if (lowerLine.includes('目标roi') || lowerLine.includes('target roi')) {
        const match = line.match(/[\d.]+/);
        if (match) target_roi = parseFloat(match[0]);
      }

      if (lowerLine.includes('盈亏平衡') || lowerLine.includes('break even')) {
        const match = line.match(/[\d.]+/);
        if (match) break_even_roi = parseFloat(match[0]);
      }

      if (lowerLine.includes('净利率') || lowerLine.includes('net rate')) {
        const match = line.match(/[\d.]+/);
        if (match) real_net_rate_pct = parseFloat(match[0]);
      }

      if (lowerLine.includes('单场净利') || lowerLine.includes('profit per')) {
        const match = line.match(/[\d.]+/);
        if (match) profit_per_show = parseFloat(match[0]);
      }

      if (lowerLine.includes('风险') || lowerLine.includes('risk')) {
        if (lowerLine.includes('健康')) risk_level = '健康';
        else if (lowerLine.includes('可控')) risk_level = '可控';
        else if (lowerLine.includes('高危')) risk_level = '高危';
      }
    }

    return {
      results: {
        target_roi,
        break_even_roi,
        real_net_rate_pct,
        profit_per_show,
        risk_level,
        risk_title: risk_level === '健康' ? '财务状况良好' : risk_level === '可控' ? '需要注意' : '高风险',
        gap_text: '基于文本提取的数据，建议核实',
        cost_breakdown,
      },
      report: content,
    };
  }

  private parseTrafficResponse(content: string) {
    const lines = content.split('\n');
    let online_count = 0;
    let level = '';
    let strategy = '';
    const key_actions: string[] = [];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('在线人数') || lowerLine.includes('在线')) {
        const match = line.match(/\d+/);
        if (match) online_count = parseInt(match[0]);
      }
      
      if (lowerLine.includes('层级') || lowerLine.includes('level')) {
        level = line.split(/[:：]/)[1]?.trim() || '';
      }
      
      if (lowerLine.includes('策略') || lowerLine.includes('strategy')) {
        strategy = line.split(/[:：]/)[1]?.trim() || '';
      }
      
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        key_actions.push(line.trim().replace(/^[-*]\s*/, ''));
      }
    }

    return {
      online_count,
      level,
      strategy,
      key_actions,
    };
  }

  private parseScriptResponse(content: string) {
    const lines = content.split('\n');
    let product = { name: '', price: 0, selling_point: '', target_audience: '' };
    let selected_formula = 0;
    let full_script = content;
    const structure: Record<string, string> = {
      shaping: '',
      pricing: '',
      harvesting: '',
    };

    let currentSection = '';
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('产品名称') || lowerLine.includes('product')) {
        product.name = line.split(/[:：]/)[1]?.trim() || '';
      }
      if (lowerLine.includes('价格') || lowerLine.includes('price')) {
        const match = line.match(/\d+/);
        if (match) product.price = parseInt(match[0]);
      }
      if (lowerLine.includes('卖点') || lowerLine.includes('selling')) {
        product.selling_point = line.split(/[:：]/)[1]?.trim() || '';
      }
      if (lowerLine.includes('目标人群')) {
        product.target_audience = line.split(/[:：]/)[1]?.trim() || '';
      }
      if (lowerLine.includes('公式')) {
        const match = line.match(/\d+/);
        if (match) selected_formula = parseInt(match[0]);
      }

      if (lowerLine.includes('塑品') || lowerLine.includes('shaping')) {
        currentSection = 'shaping';
      } else if (lowerLine.includes('报价') || lowerLine.includes('pricing')) {
        currentSection = 'pricing';
      } else if (lowerLine.includes('收割') || lowerLine.includes('harvesting')) {
        currentSection = 'harvesting';
      } else if (currentSection && line.trim()) {
        structure[currentSection] += line + '\n';
      }
    }

    return {
      product,
      selected_formula,
      full_script,
      structure: {
        shaping: structure.shaping.trim(),
        pricing: structure.pricing.trim(),
        harvesting: structure.harvesting.trim(),
      },
    };
  }
}

export const cozeClient = new CozeLiveClient();
