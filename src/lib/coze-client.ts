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
        // 优先使用后端返回的结构数据
        if (raw.full_script && raw.structure) {
          console.log('Using backend parsed structure');
          return {
            full_script: raw.full_script,
            structure: raw.structure,
            product: payload, // 使用请求中的产品信息
          };
        }
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

    // 检查是否是询问信息而不是计算结果
    const questionPatterns = [
      /缺.*数/,
      /缺少.*参数/,
      /请.*提供/,
      /需要.*信息/,
      /是.*多少/,
      /请.*填写/,
      /宝，看到/,
      /再问/,
    ];

    for (const pattern of questionPatterns) {
      if (pattern.test(content)) {
        console.log('Response appears to be a question, not a calculation result');
        throw new Error('Bot 请求更多信息，但前端无法继续交互。请检查 Bot 配置或尝试更简单的输入。');
      }
    }

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

    // 检查是否提取到了有效数据
    const hasValidData = target_roi > 0 || break_even_roi > 0 || real_net_rate_pct > 0 || profit_per_show > 0;

    if (!hasValidData) {
      console.log('No valid ROI data could be extracted from text');
      throw new Error('无法从 Bot 响应中提取有效的 ROI 计算结果。Bot 可能需要更多信息或配置有问题。\n\n原始响应：\n' + content.substring(0, 500) + '...');
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
    // 初始化返回结构
    let product = { name: '', price: 0, selling_point: '', target_audience: '' };
    let selected_formula = 0;
    let full_script = content;
    const structure: Record<string, string> = {
      shaping: '',
      pricing: '',
      harvesting: '',
    };

    // 尝试解析JSON格式的响应
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.product) product = { ...product, ...parsed.product };
        if (parsed.selected_formula) selected_formula = parsed.selected_formula;
        if (parsed.structure) {
          structure.shaping = parsed.structure.shaping || '';
          structure.pricing = parsed.structure.pricing || '';
          structure.harvesting = parsed.structure.harvesting || '';
        }
        if (parsed.full_script) full_script = parsed.full_script;
        return { product, selected_formula, full_script, structure };
      }
    } catch (e) {
      console.log('Not JSON format, parsing as text');
    }

    // 按照Markdown标题或分隔符分割内容
    const sections = content.split(/(?=##\s*(?:🎯|💰|🎁|塑品|报价|收割|一、|二、|三、))/g);
    
    for (const section of sections) {
      const lowerSection = section.toLowerCase();
      const trimmedSection = section.trim();
      
      if (lowerSection.includes('塑品') || lowerSection.includes('🎯') || 
          lowerSection.includes('一、') || lowerSection.includes('第一段') ||
          lowerSection.includes('建立信任') || lowerSection.includes('痛点')) {
        structure.shaping = trimmedSection;
      } else if (lowerSection.includes('报价') || lowerSection.includes('💰') || 
                 lowerSection.includes('二、') || lowerSection.includes('第二段') ||
                 lowerSection.includes('价值') || lowerSection.includes('价格')) {
        structure.pricing = trimmedSection;
      } else if (lowerSection.includes('收割') || lowerSection.includes('🎁') || 
                 lowerSection.includes('三、') || lowerSection.includes('第三段') ||
                 lowerSection.includes('促单') || lowerSection.includes('成交')) {
        structure.harvesting = trimmedSection;
      }
    }

    // 如果没有找到分段，尝试按分隔线分割
    if (!structure.shaping && !structure.pricing && !structure.harvesting) {
      const parts = content.split(/---+\n?|\*\*\*+\n?|===+\n?/);
      if (parts.length >= 3) {
        structure.shaping = parts[0]?.trim() || '';
        structure.pricing = parts[1]?.trim() || '';
        structure.harvesting = parts.slice(2).join('\n---\n').trim();
      }
    }

    // 从内容中提取产品信息
    const lines = content.split('\n');
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('产品名称') || lowerLine.includes('产品：') || lowerLine.includes('产品:')) {
        product.name = line.split(/[:：]/)[1]?.trim().replace(/[#*]/g, '') || '';
      }
      if ((lowerLine.includes('价格') || lowerLine.includes('售价')) && !lowerLine.includes('市场')) {
        const match = line.match(/\d+/);
        if (match) product.price = parseInt(match[0]);
      }
      if (lowerLine.includes('核心卖点') || lowerLine.includes('卖点') || lowerLine.includes('核心优势')) {
        product.selling_point = line.split(/[:：]/)[1]?.trim().replace(/[#*]/g, '') || '';
      }
      if (lowerLine.includes('目标人群') || lowerLine.includes('受众')) {
        product.target_audience = line.split(/[:：]/)[1]?.trim().replace(/[#*]/g, '') || '';
      }
    }

    return {
      product,
      selected_formula,
      full_script,
      structure: {
        shaping: structure.shaping || '暂无塑品段内容',
        pricing: structure.pricing || '暂无报价段内容',
        harvesting: structure.harvesting || '暂无收割段内容',
      },
    };
  }
}

export const cozeClient = new CozeLiveClient();
