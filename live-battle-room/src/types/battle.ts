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

export interface TrafficData {
  online_count: number;
  level: string;
  strategy: string;
  key_actions: string[];
}

export interface ProductInfo {
  name: string;
  price: number;
  selling_point: string;
  target_audience: string;
}

export interface ScriptData {
  product: ProductInfo;
  selected_formula: number;
  full_script: string;
  structure: {
    shaping: string;
    pricing: string;
    harvesting: string;
  };
}

export interface BattleState {
  phase: 'idle' | 'roi_calculating' | 'roi_done' | 
         'traffic_diagnosing' | 'traffic_done' | 
         'script_generating' | 'ready';
  
  roiData: {
    inputs: ROIInputs;
    results: ROIResults;
    report: string;
  } | null;
  
  trafficData: TrafficData | null;
  
  scriptData: ScriptData | null;
  
  suggestions: string[];
}

export interface CozeChatResponse {
  messages: Array<{
    role: string;
    content: string;
  }>;
  status: string;
}
