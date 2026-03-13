'use client';

import { useState } from 'react';
import { useBattleStore } from '@/store/battleStore';
import { cozeClient } from '@/lib/coze-client';
import { TrendingUp, Users, Target, CheckCircle2 } from 'lucide-react';

export default function TrafficPanel() {
  const { roiData, trafficData, setTrafficData, setPhase } = useBattleStore();
  const [loading, setLoading] = useState(false);
  const [onlineCount, setOnlineCount] = useState('');
  const [trafficStructure, setTrafficStructure] = useState('');

  const handleDiagnose = async () => {
    if (!onlineCount) {
      alert('请输入在线人数');
      return;
    }

    setLoading(true);
    setPhase('traffic_diagnosing');

    try {
      const payload = {
        online_count: parseInt(onlineCount),
        traffic_structure: trafficStructure || '不清楚',
        current_gmv: roiData?.results?.month_receipt_gmv || 0,
        roi_status: roiData?.results?.risk_level || '未知',
      };

      const response = await cozeClient.sendCommand('/traffic_diag', payload);
      setTrafficData(response);
    } catch (error) {
      console.error('Traffic diagnosis failed:', error);
      alert('流量诊断失败，请检查网络连接和配置');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = () => {
    if (!trafficData) return 'bg-gray-100 text-gray-700';
    const level = trafficData.level.toLowerCase();
    
    if (level.includes('260+') || level.includes('高')) return 'bg-green-100 text-green-700';
    if (level.includes('80') || level.includes('中')) return 'bg-yellow-100 text-yellow-700';
    if (level.includes('50') || level.includes('低')) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  if (trafficData) {
    return (
      <div className="h-full flex flex-col p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            流量诊断结果
          </h2>
          <button
            onClick={() => {
              setOnlineCount('');
              setTrafficStructure('');
              setPhase('roi_done');
            }}
            className="text-sm text-green-600 hover:text-green-800"
          >
            重新诊断
          </button>
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-xs text-gray-500">当前在线人数</div>
                <div className="text-2xl font-bold text-gray-900">{trafficData.online_count}人</div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${getLevelColor()}`}>
            <div className="text-center">
              <div className="text-xs mb-1">流量层级</div>
              <div className="text-3xl font-bold">{trafficData.level}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              匹配策略
            </h3>
            <div className="text-base font-medium text-blue-600">{trafficData.strategy}</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm flex-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              关键动作清单
            </h3>
            <ul className="space-y-2">
              {trafficData.key_actions.map((action, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {roiData && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="text-xs text-blue-800">
                <strong>💡 智能建议：</strong>
                {roiData.results.risk_level === '健康'
                  ? 'ROI表现健康，可以加大投流预算冲量。'
                  : roiData.results.risk_level === '可控'
                  ? 'ROI在可控范围，建议稳住转化率后逐步提升投放。'
                  : 'ROI较低，建议优化话术和产品展示后再增加投流。'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          流量诊断
        </h2>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            当前在线人数（开播30分钟后稳定值）
          </label>
          <input
            type="number"
            value={onlineCount}
            onChange={(e) => setOnlineCount(e.target.value)}
            placeholder="例如：15"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">
            请输入开播30分钟后的稳定在线人数，不是峰值人数
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            流量结构
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: '自然流为主', label: '自然流为主' },
              { value: '付费流为主', label: '付费流为主' },
              { value: '短视频引流', label: '短视频引流' },
              { value: '不清楚', label: '不清楚' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTrafficStructure(option.value)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  trafficStructure === option.value
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {roiData && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>📊 已关联ROI数据：</strong>
              <br />
              目标ROI: {roiData.results.target_roi.toFixed(2)} | 
              风险等级: {roiData.results.risk_level}
            </div>
          </div>
        )}

        <button
          onClick={handleDiagnose}
          disabled={loading || !onlineCount}
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? '诊断中...' : '开始流量诊断'}
        </button>
      </div>
    </div>
  );
}
