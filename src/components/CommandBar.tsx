'use client';

import { useBattleStore } from '@/store/battleStore';
import { Send, Save, FileText, Play, RotateCcw } from 'lucide-react';

export default function CommandBar() {
  const { phase, roiData, trafficData, scriptData, reset } = useBattleStore();

  const getPhaseProgress = () => {
    if (phase === 'idle') return 0;
    if (phase === 'roi_calculating' || phase === 'roi_done') return 33;
    if (phase === 'traffic_diagnosing' || phase === 'traffic_done') return 66;
    if (phase === 'script_generating' || phase === 'ready') return 100;
    return 0;
  };

  const handleSendToDingTalk = async () => {
    try {
      const response = await fetch('/api/send-dingtalk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roiData, trafficData, scriptData }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('✅ 已成功推送到钉钉！');
      } else {
        alert(`❌ 推送失败: ${result.message}`);
      }
    } catch (error) {
      console.error('推送钉钉失败:', error);
      alert('❌ 推送失败，请检查网络连接');
    }
  };

  const handleSave = () => {
    const data = {
      timestamp: new Date().toISOString(),
      roiData,
      trafficData,
      scriptData,
    };
    
    localStorage.setItem('battle-room-plan', JSON.stringify(data));
    alert('方案已保存到本地');
  };

  const handleExportReport = () => {
    const report = `
# 直播作战方案报告
生成时间: ${new Date().toLocaleString()}

## 1. 财务决策
${roiData ? `
- 目标GMV: ¥${roiData.inputs.target_gmv}
- 目标ROI: ${roiData.results.target_roi.toFixed(2)}
- 盈亏平衡ROI: ${typeof roiData.results.break_even_roi === 'number' ? roiData.results.break_even_roi.toFixed(2) : roiData.results.break_even_roi}
- 真实净利率: ${roiData.results.real_net_rate_pct.toFixed(2)}%
- 单场净利: ¥${roiData.results.profit_per_show.toFixed(0)}
- 风险等级: ${roiData.results.risk_level}

### 诊断报告
${roiData.report}
` : '未完成'}

## 2. 流量诊断
${trafficData ? `
- 在线人数: ${trafficData.online_count}人
- 流量层级: ${trafficData.level}
- 匹配策略: ${trafficData.strategy}

### 关键动作
${trafficData.key_actions.map((action, i) => `${i + 1}. ${action}`).join('\n')}
` : '未完成'}

## 3. 话术方案
${scriptData ? `
- 产品名称: ${scriptData.product.name}
- 价格: ¥${scriptData.product.price}
- 核心卖点: ${scriptData.product.selling_point}
- 卖点公式: ${scriptData.selected_formula}

### 完整话术
${scriptData.full_script}

### 三段式拆解
**塑品段:**
${scriptData.structure.shaping || '暂无'}

**报价段:**
${scriptData.structure.pricing || '暂无'}

**收割段:**
${scriptData.structure.harvesting || '暂无'}
` : '未完成'}
    `;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `直播作战方案_${new Date().toLocaleDateString()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？')) {
      reset();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-gray-700">作战进度:</div>
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${getPhaseProgress()}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {phase === 'idle' && '开始作战'}
                {(phase === 'roi_calculating' || phase === 'roi_done') && 'ROI计算中...'}
                {(phase === 'traffic_diagnosing' || phase === 'traffic_done') && '流量诊断中...'}
                {(phase === 'script_generating' || phase === 'ready') && '话术生成中...'}
              </div>
            </div>

            {phase === 'ready' && (
              <div className="flex items-center gap-2 text-sm">
                <div className={`px-3 py-1 rounded-full ${
                  roiData ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {roiData ? '✓ ROI' : '○ ROI'}
                </div>
                <div className={`px-3 py-1 rounded-full ${
                  trafficData ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {trafficData ? '✓ 流量' : '○ 流量'}
                </div>
                <div className={`px-3 py-1 rounded-full ${
                  scriptData ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {scriptData ? '✓ 话术' : '○ 话术'}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendToDingTalk}
              disabled={phase !== 'ready'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
              推送到钉钉
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
            >
              <Save className="w-4 h-4" />
              保存方案
            </button>

            <button
              onClick={handleExportReport}
              disabled={phase !== 'ready'}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FileText className="w-4 h-4" />
              导出报告
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>

            {phase === 'ready' && (
              <button className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm font-bold hover:from-orange-600 hover:to-red-600 transition-all shadow-md">
                <Play className="w-4 h-4" />
                开始直播
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
