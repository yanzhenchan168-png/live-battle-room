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
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, payload }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `API error: ${res.status}`);
      }

      const data: CozeChatResponse = await res.json();
      return this.parseResponse(data, command);
    } catch (error) {
      console.error('Coze API call failed:', error);
      throw error;
    }
  }

  private parseResponse(raw: CozeChatResponse, command: string | null): any {
    if (!raw.messages || raw.messages.length === 0) {
      throw new Error('No messages in response');
    }

    const content = raw.messages[0].content;

    try {
      if (command === '/roi_calc') {
        return JSON.parse(content);
      } else if (command === '/traffic_diag') {
        return this.parseTrafficResponse(content);
      } else if (command === '/script_gen') {
        return this.parseScriptResponse(content);
      }
      return content;
    } catch (error) {
      console.error('Failed to parse response:', error);
      return { raw_content: content };
    }
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
