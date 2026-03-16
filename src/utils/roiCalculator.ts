/**
 * ROI 计算工具
 * 纯前端实现，避免依赖 API
 */

export interface ROIInputs {
  target_gmv: number;
  ad_budget: number;
  cost_price: number;
  selling_price: number;
  return_rate: number;
  platform_fee_rate: number;
  anchor_base: number;
  anchor_commission: number;
  anchor_shows: number;
  operation_base: number;
  operation_commission: number;
  operation_shows: number;
  rent_month: number;
  other_staff_cost: number;
}

export interface ROIResults {
  real_net_rate_pct: number;
  target_roi: number;
  break_even_roi: number | string;
  profit_per_show: number;
  cost_per_show: number;
  month_receipt_gmv: number;
  month_profit: number;
  risk_level: '高危' | '可控' | '健康';
  risk_icon: string;
  risk_title: string;
  gap_text: string;
  traffic_level: string;
  suggestion: string;
  cost_breakdown: {
    ad: number;
    anchor: number;
    operation: number;
    rent: number;
    goods: number;
  };
}

export interface ROIReport {
  results: ROIResults;
  report: string;
}

export function calculateROI(inputs: ROIInputs): ROIReport {
  // 提取参数
  const {
    target_gmv,
    ad_budget,
    cost_price,
    selling_price,
    return_rate,
    platform_fee_rate = 5,
    anchor_base,
    anchor_commission,
    anchor_shows,
    operation_base,
    operation_commission,
    operation_shows,
    rent_month,
    other_staff_cost,
  } = inputs;

  // 计算逻辑
  // 1. 计算目标订单数
  const target_orders = target_gmv / selling_price;

  // 2. 计算实际销售量（考虑退货）
  const actual_sales = target_orders * (1 - return_rate / 100);

  // 3. 计算货品成本
  const goods_cost = actual_sales * cost_price;

  // 4. 计算人力成本
  const anchor_cost_per_show =
    anchor_base / anchor_shows + (target_gmv * anchor_commission) / 100;
  const operation_cost_per_show =
    operation_base / operation_shows +
    (target_gmv * operation_commission) / 100;

  // 5. 计算场地成本
  const rent_per_show = rent_month / anchor_shows;

  // 6. 计算平台费用
  const platform_fee = (target_gmv * platform_fee_rate) / 100;

  // 7. 计算总成本
  const total_cost =
    ad_budget +
    goods_cost +
    anchor_cost_per_show +
    operation_cost_per_show +
    rent_per_show +
    other_staff_cost +
    platform_fee;

  // 8. 计算利润
  const profit = target_gmv - total_cost;

  // 9. 计算 ROI
  const target_roi = ad_budget > 0 ? profit / ad_budget : 0;

  // 10. 计算盈亏平衡 ROI
  const break_even_cost =
    goods_cost +
    anchor_cost_per_show +
    operation_cost_per_show +
    rent_per_show +
    other_staff_cost +
    platform_fee;
  const break_even_roi = ad_budget > 0 ? break_even_cost / ad_budget : 0;

  // 11. 计算净利率
  const real_net_rate = target_gmv > 0 ? profit / target_gmv : 0;

  // 12. 风险评估
  let risk_level: '健康' | '可控' | '高危';
  let risk_title: string;

  if (real_net_rate >= 0.15) {
    risk_level = '健康';
    risk_title = '财务状况良好';
  } else if (real_net_rate >= 0.05) {
    risk_level = '可控';
    risk_title = '需要注意';
  } else {
    risk_level = '高危';
    risk_title = '高风险';
  }

  // 13. 成本分解
  const cost_breakdown = {
    ad: ad_budget,
    anchor: anchor_cost_per_show,
    operation: operation_cost_per_show,
    rent: rent_per_show,
    goods: goods_cost,
  };

  // 14. 计算每场总成本
  const cost_per_show = total_cost / anchor_shows;

  // 15. 生成建议
  const suggestion = getSuggestions(real_net_rate, risk_level);

  // 16. 生成报告
  const report = generateReport({
    target_gmv,
    ad_budget,
    target_roi,
    break_even_roi,
    real_net_rate,
    profit,
    risk_level,
    cost_breakdown,
  });

  return {
    results: {
      real_net_rate_pct: real_net_rate * 100,
      target_roi,
      break_even_roi,
      profit_per_show: profit,
      cost_per_show,
      month_receipt_gmv: target_gmv,
      month_profit: profit,
      risk_level,
      risk_icon: risk_level === '健康' ? '✅' : risk_level === '可控' ? '⚠️' : '❌',
      risk_title,
      gap_text: `当前 ROI ${target_roi.toFixed(1)} vs 盈亏平衡 ${break_even_roi.toFixed(1)}`,
      traffic_level: '20-50人', // 默认流量层级
      suggestion,
      cost_breakdown,
    },
    report,
  };
}

function generateReport(data: {
  target_gmv: number;
  ad_budget: number;
  target_roi: number;
  break_even_roi: number;
  real_net_rate: number;
  profit: number;
  risk_level: string;
  cost_breakdown: any;
}): string {
  const suggestions = getSuggestions(data.real_net_rate, data.risk_level);

  return `## ROI 计算结果

### 核心指标
- **目标 GMV**: ¥${data.target_gmv.toLocaleString()}
- **投流预算**: ¥${data.ad_budget.toLocaleString()}
- **目标 ROI**: ${data.target_roi.toFixed(2)}
- **盈亏平衡 ROI**: ${data.break_even_roi.toFixed(2)}
- **真实净利率**: ${(data.real_net_rate * 100).toFixed(2)}%
- **单场净利**: ¥${Math.round(data.profit).toLocaleString()}
- **风险等级**: ${data.risk_level}

### 成本结构分析
- **投流成本**: ¥${data.cost_breakdown.ad.toLocaleString()} (${(data.cost_breakdown.ad / data.target_gmv * 100).toFixed(1)}%)
- **货品成本**: ¥${data.cost_breakdown.goods.toLocaleString()} (${(data.cost_breakdown.goods / data.target_gmv * 100).toFixed(1)}%)
- **主播成本**: ¥${Math.round(data.cost_breakdown.anchor).toLocaleString()} (${(data.cost_breakdown.anchor / data.target_gmv * 100).toFixed(1)}%)
- **运营成本**: ¥${Math.round(data.cost_breakdown.operation).toLocaleString()} (${(data.cost_breakdown.operation / data.target_gmv * 100).toFixed(1)}%)
- **场地成本**: ¥${Math.round(data.cost_breakdown.rent).toLocaleString()} (${(data.cost_breakdown.rent / data.target_gmv * 100).toFixed(1)}%)

### ROI 差距分析
当前 ROI ${data.target_roi.toFixed(2)} 与盈亏平衡 ROI ${data.break_even_roi.toFixed(2)} 的差距为 ${(data.target_roi - data.break_even_roi).toFixed(2)}。

${data.target_roi >= data.break_even_roi ? '✅ 当前 ROI 已超过盈亏平衡点，项目盈利。' : '⚠️ 当前 ROI 低于盈亏平衡点，项目亏损。'}

### 改进建议
${suggestions}

### 风险提示
- 当前净利率 ${(data.real_net_rate * 100).toFixed(2)}%，${data.real_net_rate >= 0.15 ? '属于健康水平，可以适度扩大规模。' : data.real_net_rate >= 0.05 ? '属于可控水平，需要优化成本结构。' : '风险较高，建议暂停扩张，优化投放策略。'}
- 建议重点关注：${data.risk_level === '健康' ? '转化率提升和用户留存' : data.risk_level === '可控' ? '人力成本和运营效率' : '投放策略和产品结构优化'}
`;
}

function getSuggestions(net_rate: number, risk_level: string): string {
  if (risk_level === '健康') {
    return `
1. **适度扩大规模**: 财务状况良好，可以考虑增加投流预算，扩大流量规模。
2. **提升转化率**: 优化直播话术和产品展示，进一步提高转化率。
3. **优化库存管理**: 根据销售数据优化库存，减少资金占用。
4. **用户留存**: 建立用户社群，提高复购率。
`;
  } else if (risk_level === '可控') {
    return `
1. **优化成本结构**: 检查人力成本占比，考虑提高运营效率。
2. **提升客单价**: 通过组合销售或高客单价产品提升整体 GMV。
3. **优化投放策略**: 分析投放效果，优化广告素材和定向。
4. **降低退货率**: 改进产品质量描述，降低用户预期落差。
`;
  } else {
    return `
1. **暂停扩张**: 停止增加投流预算，先优化现有流量。
2. **优化产品结构**: 重新评估产品定价和成本结构。
3. **提升转化率**: 优化直播间话术和产品展示，提高转化率。
4. **降低运营成本**: 优化人力配置，提高运营效率。
5. **调整投放策略**: 暂停低效投放，集中资源在高 ROI 渠道。
`;
  }
}
