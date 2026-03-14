'use client';

import { useBattleStore } from '@/store/battleStore';
import ROIPanel from '@/components/ROIPanel';
import TrafficPanel from '@/components/TrafficPanel';
import ScriptPanel from '@/components/ScriptPanel';
import CommandBar from '@/components/CommandBar';
import { Activity, Target, MessageSquare } from 'lucide-react';

export default function Home() {
  const { phase } = useBattleStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1800px] mx-auto p-4 pb-32">
        <div className="mb-6 bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                一站式直播作战室
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                避坑提效 · 智能决策 · 数据驱动
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  phase === 'roi_done' || phase === 'traffic_done' || phase === 'script_generating' || phase === 'ready'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Target className="w-4 h-4" />
                </div>
                <span className={phase === 'roi_done' || phase === 'traffic_done' || phase === 'script_generating' || phase === 'ready'
                  ? 'text-green-600 font-medium'
                  : 'text-gray-400'
                }>
                  ROI计算
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  phase === 'traffic_done' || phase === 'script_generating' || phase === 'ready'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Activity className="w-4 h-4" />
                </div>
                <span className={phase === 'traffic_done' || phase === 'script_generating' || phase === 'ready'
                  ? 'text-green-600 font-medium'
                  : 'text-gray-400'
                }>
                  流量诊断
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  phase === 'ready'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className={phase === 'ready'
                  ? 'text-green-600 font-medium'
                  : 'text-gray-400'
                }>
                  话术生成
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          <div className="h-full">
            <ROIPanel />
          </div>
          <div className="h-full">
            <TrafficPanel />
          </div>
          <div className="h-full">
            <ScriptPanel />
          </div>
        </div>
      </div>

      <CommandBar />
    </div>
  );
}
