'use client';

import { useState } from 'react';
import { useBattleStore } from '@/store/battleStore';
import { ROIInputs } from '@/types/battle';
import { calculateROI } from '@/utils/roiCalculator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertTriangle, CheckCircle, XCircle, Calculator, ChevronDown, ChevronUp } from 'lucide-react';

export default function ROIPanel() {
  const { roiData, setROIData, setPhase } = useBattleStore();
  const [showForm, setShowForm] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<ROIInputs>({
    target_gmv: 50000,
    ad_budget: 10000,
    cost_price: 80,
    selling_price: 199,
    return_rate: 30,
    platform_fee_rate: 5,
    anchor_base: 5000,
    anchor_commission: 0,
    anchor_shows: 15,
    operation_base: 3000,
    operation_commission: 0,
    operation_shows: 15,
    rent_month: 3000,
    other_staff_cost: 0,
  });

  const handleCalculate = async () => {
    setLoading(true);
    setPhase('roi_calculating');

    try {
      // 模拟计算延迟，让用户感觉在计算
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 使用纯前端计算
      const result = calculateROI(formData);

      console.log('ROI calculation completed:', result);

      if (result.results && result.report) {
        setROIData(formData, result.results, result.report);
        setShowForm(false);
        setPhase('roi_done');
        console.log('ROI calculation completed successfully');
      }
    } catch (error) {
      console.error('ROI calculation failed:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`ROI计算失败：${errorMessage}\n\n请稍后重试，如果问题持续，请联系技术支持。`);
    } finally {
      setLoading(false);
    }
  };

  const getRiskIcon = () => {
    if (!roiData) return null;
    const { risk_level } = roiData.results;
    
    if (risk_level === '健康') return <CheckCircle className="w-8 h-8 text-green-500" />;
    if (risk_level === '可控') return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
    return <XCircle className="w-8 h-8 text-red-500" />;
  };

  const getRiskColor = () => {
    if (!roiData) return 'bg-gray-100';
    const { risk_level } = roiData.results;
    
    if (risk_level === '健康') return 'bg-green-50 border-green-200';
    if (risk_level === '可控') return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getChartData = () => {
    if (!roiData) return [];
    const { cost_breakdown } = roiData.results;
    
    return [
      { name: '投流成本', value: cost_breakdown.ad, color: '#8884d8' },
      { name: '主播成本', value: cost_breakdown.anchor, color: '#82ca9d' },
      { name: '运营成本', value: cost_breakdown.operation, color: '#ffc658' },
      { name: '场地租金', value: cost_breakdown.rent, color: '#ff7300' },
      { name: '货品成本', value: cost_breakdown.goods, color: '#0088fe' },
    ];
  };

  if (roiData && !showForm) {
    return (
      <div className="h-full flex flex-col p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            财务决策看板
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            重新计算
          </button>
        </div>

        <div className={`p-4 rounded-lg border-2 mb-4 ${getRiskColor()}`}>
          <div className="flex items-center gap-3 mb-2">
            {getRiskIcon()}
            <div>
              <div className="text-2xl font-bold text-gray-900">{roiData.results.risk_title}</div>
              <div className="text-sm text-gray-600">{roiData.results.gap_text}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xs text-gray-500 mb-1">目标ROI</div>
            <div className="text-xl font-bold text-blue-600">{roiData.results.target_roi.toFixed(1)}</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xs text-gray-500 mb-1">盈亏平衡ROI</div>
            <div className="text-xl font-bold text-purple-600">
              {typeof roiData.results.break_even_roi === 'number'
                ? roiData.results.break_even_roi.toFixed(1)
                : roiData.results.break_even_roi}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xs text-gray-500 mb-1">真实净利率</div>
            <div className="text-xl font-bold text-green-600">
              {roiData.results.real_net_rate_pct.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xs text-gray-500 mb-1">单场净利</div>
            <div className="text-xl font-bold text-orange-600">
              ¥{roiData.results.profit_per_show.toFixed(0)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">成本结构分析</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={getChartData()}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {getChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `¥${value.toFixed(0)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">智能诊断报告</h3>
          </div>
          <div className="text-xs text-gray-600 whitespace-pre-wrap">
            {roiData.report}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          ROI计算器
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">基础参数</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {showForm && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">目标GMV (¥)</label>
                <input
                  type="number"
                  value={formData.target_gmv}
                  onChange={(e) => setFormData({ ...formData, target_gmv: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">投流预算 (¥)</label>
                <input
                  type="number"
                  value={formData.ad_budget}
                  onChange={(e) => setFormData({ ...formData, ad_budget: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">成本价 (¥)</label>
                  <input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">售价 (¥)</label>
                  <input
                    type="number"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">退货率 (%)</label>
                <input
                  type="number"
                  value={formData.return_rate}
                  onChange={(e) => setFormData({ ...formData, return_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">人力成本</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">主播底薪 (¥)</label>
                    <input
                      type="number"
                      value={formData.anchor_base}
                      onChange={(e) => setFormData({ ...formData, anchor_base: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">主播提成 (%)</label>
                    <input
                      type="number"
                      value={formData.anchor_commission}
                      onChange={(e) => setFormData({ ...formData, anchor_commission: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">主播场次/月</label>
                  <input
                    type="number"
                    value={formData.anchor_shows}
                    onChange={(e) => setFormData({ ...formData, anchor_shows: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">运营成本</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">运营底薪 (¥)</label>
                    <input
                      type="number"
                      value={formData.operation_base}
                      onChange={(e) => setFormData({ ...formData, operation_base: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">运营提成 (%)</label>
                    <input
                      type="number"
                      value={formData.operation_commission}
                      onChange={(e) => setFormData({ ...formData, operation_commission: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">运营场次/月</label>
                  <input
                    type="number"
                    value={formData.operation_shows}
                    onChange={(e) => setFormData({ ...formData, operation_shows: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">固定成本</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">月租金 (¥)</label>
                  <input
                    type="number"
                    value={formData.rent_month}
                    onChange={(e) => setFormData({ ...formData, rent_month: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">其他人员成本 (¥)</label>
                  <input
                    type="number"
                    value={formData.other_staff_cost}
                    onChange={(e) => setFormData({ ...formData, other_staff_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="mt-4 mb-8">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {loading ? '计算中...' : '计算 ROI'}
          </button>
        </div>
      )}
    </div>
  );
}
