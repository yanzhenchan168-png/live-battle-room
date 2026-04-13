'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useWorkspaceStore, 
  Mode, 
  ScriptSegment, 
  SpySnippet, 
  ProductInfo, 
  OCRData 
} from '@/lib/store';

// ==================== ModeNavigator ====================

const MODES: { id: Mode; label: string }[] = [
  { id: 'script', label: '话术创作' },
  { id: 'spy', label: '对标情报' },
  { id: 'training', label: '新人陪练' },
  { id: 'analysis', label: '投流复盘' },
];

function ModeNavigator() {
  const { currentMode, setMode } = useWorkspaceStore();

  return (
    <nav className="h-16 bg-purple-600 flex items-center px-6 shadow-md shrink-0">
      {/* Logo + 标题 */}
      <div className="flex items-center gap-3 mr-8">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-white font-bold text-lg">一站式直播作战室</h1>
          <p className="text-purple-200 text-xs">Live Battle Room 2.0</p>
        </div>
      </div>

      {/* 模式切换 */}
      <div className="flex items-center gap-2 bg-purple-700/50 rounded-lg p-1">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setMode(mode.id)}
            className={`
              relative px-4 py-2 rounded-md text-sm font-medium transition-all
              ${currentMode === mode.id ? 'text-white' : 'text-purple-200 hover:text-white'}
            `}
          >
            {currentMode === mode.id && (
              <motion.div
                layoutId="activeMode"
                className="absolute inset-0 bg-purple-700 rounded-md"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{mode.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ==================== CollapseButton ====================

function CollapseButton({
  direction,
  collapsed,
  onClick,
}: {
  direction: 'left' | 'right';
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        absolute top-1/2 -translate-y-1/2 z-10
        w-6 h-12 bg-gray-200 hover:bg-gray-300
        flex items-center justify-center
        text-gray-600 text-xs font-bold
        transition-all
        ${direction === 'left' 
          ? 'right-0 translate-x-full rounded-r-lg' 
          : 'left-0 -translate-x-full rounded-l-lg'}
        ${collapsed ? 'opacity-100' : 'opacity-60 hover:opacity-100'}
      `}
      title={collapsed ? '展开' : '折叠'}
    >
      {direction === 'left' ? (collapsed ? '>' : '<') : collapsed ? '<' : '>'}
    </button>
  );
}

// ==================== WorkspaceLayout ====================

function WorkspaceLayout({
  leftPanel,
  centerPanel,
  rightPanel,
}: {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
}) {
  const { leftCollapsed, rightCollapsed, toggleLeft, toggleRight } = useWorkspaceStore();

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-100 min-h-0">
      {/* 左栏 */}
      <aside
        className={`
          relative flex flex-col bg-gray-50 border-r border-gray-200
          transition-all duration-300 ease-in-out shrink-0
          ${leftCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-[20%] min-w-[260px] max-w-[320px]'}
        `}
      >
        <div className="flex-1 overflow-y-auto p-4">{leftPanel}</div>
        <CollapseButton direction="left" collapsed={leftCollapsed} onClick={toggleLeft} />
      </aside>

      {/* 中栏 */}
      <main className="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">{centerPanel}</div>
      </main>

      {/* 右栏 */}
      <aside
        className={`
          relative flex flex-col bg-gray-50 border-l border-gray-200
          transition-all duration-300 ease-in-out shrink-0
          ${rightCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-[20%] min-w-[260px] max-w-[320px]'}
        `}
      >
        <CollapseButton direction="right" collapsed={rightCollapsed} onClick={toggleRight} />
        <div className="flex-1 overflow-y-auto p-4">{rightPanel}</div>
      </aside>
    </div>
  );
}

// ==================== 模式1: 话术创作 ====================

function ScriptCreator() {
  const { 
    scriptContent, 
    ocrData, 
    updateSegment, 
    setProductInfo, 
    isFusing,
    isGenerating,
    generateError,
    generateScript 
  } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<'塑品' | '报价' | '收割'>('塑品');
  const [activeStyle, setActiveStyle] = useState<'憋单' | '平播' | '收割'>('平播');
  const activeSegment = scriptContent.segments.find((s) => s.type === activeTab);

  const handleProductChange = (field: keyof ProductInfo, value: any) => {
    setProductInfo({ ...scriptContent.productInfo, [field]: value });
  };

  const handleGenerate = async (style: '憋单' | '平播' | '收割' | 'refresh') => {
    if (!scriptContent.productInfo.name) {
      alert('请先填写产品名称');
      return;
    }
    if (style !== 'refresh') {
      setActiveStyle(style as '憋单' | '平播' | '收割');
    }
    await generateScript(style);
  };

  return (
    <WorkspaceLayout
      leftPanel={
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">OCR识别数据</h3>
            {ocrData ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">GMV:</span>
                  <span className="font-medium">¥{ocrData.gmv}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">在线人数:</span>
                  <span className="font-medium">{ocrData.onlineCount}人</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">转化率:</span>
                  <span className="font-medium">{ocrData.conversionRate}%</span>
                </div>
                <div className="mt-2">
                  <span className={`
                    inline-block px-2 py-1 rounded text-xs font-medium
                    ${ocrData.trafficLevel === '高流量' ? 'bg-red-100 text-red-700' : 
                      ocrData.trafficLevel === '10-50' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-green-100 text-green-700'}
                  `}>
                    {ocrData.trafficLevel}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">请上传截图识别</div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">产品信息</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">产品名称</label>
                <input
                  type="text"
                  value={scriptContent.productInfo.name}
                  onChange={(e) => handleProductChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                  placeholder="输入产品名称"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">价格</label>
                <input
                  type="number"
                  value={scriptContent.productInfo.price || ''}
                  onChange={(e) => handleProductChange('price', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                  placeholder="输入价格"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">卖点（用逗号分隔）</label>
                <textarea
                  value={scriptContent.productInfo.sellingPoints.join(', ')}
                  onChange={(e) => handleProductChange('sellingPoints', e.target.value.split(',').map((s) => s.trim()))}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm h-20 resize-none"
                  placeholder="卖点1, 卖点2, 卖点3"
                />
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 text-center">
            <p className="text-xs text-purple-600">拖拽对标片段到此处</p>
            <p className="text-xs text-gray-400 mt-1">自动融合生成话术</p>
          </div>
        </div>
      }
      centerPanel={
        <div className="h-full flex flex-col">
          <div className="flex border-b border-gray-200 px-6 pt-4">
            {(['塑品', '报价', '收割'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab 
                    ? 'border-purple-600 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'}
                `}
              >
                {tab}话术
              </button>
            ))}
          </div>

          <div className="flex-1 p-6">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400">编辑 {activeTab} 段落</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleGenerate('憋单')}
                    disabled={isGenerating}
                    className={`
                      px-3 py-1.5 text-xs rounded transition-all
                      ${activeStyle === '憋单' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                      ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {isGenerating && activeStyle === '憋单' ? (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        生成中...
                      </span>
                    ) : '憋单风格'}
                  </button>
                  <button 
                    onClick={() => handleGenerate('平播')}
                    disabled={isGenerating}
                    className={`
                      px-3 py-1.5 text-xs rounded transition-all
                      ${activeStyle === '平播' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                      ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {isGenerating && activeStyle === '平播' ? (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        生成中...
                      </span>
                    ) : '平播风格'}
                  </button>
                  <button 
                    onClick={() => handleGenerate('refresh')}
                    disabled={isGenerating}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        生成中...
                      </span>
                    ) : '换一版'}
                  </button>
                </div>
              </div>
              
              {/* 错误提示 */}
              {generateError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-600">{generateError}</span>
                </div>
              )}
              
              <textarea
                value={activeSegment?.content || ''}
                onChange={(e) => activeSegment && updateSegment(activeSegment.id, e.target.value)}
                className="flex-1 w-full p-4 border border-gray-200 rounded-lg resize-none text-gray-800 leading-relaxed"
                placeholder={`请输入${activeTab}话术...`}
              />
              
              {(isFusing || isGenerating) && (
                <div className="mt-2 flex items-center gap-2 text-sm text-purple-600">
                  <span className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  {isFusing ? '正在融合生成...' : '正在生成话术...'}
                </div>
              )}
            </div>
          </div>
        </div>
      }
      rightPanel={
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">ROI速算</h3>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-purple-600">1:3.2</div>
              <div className="text-xs text-gray-500 mt-1">预估ROI</div>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>客单价:</span>
                <span>¥{scriptContent.productInfo.price || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>预估转化率:</span>
                <span>2.5%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">流量诊断</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600">流量层级正常</span>
              </div>
              <div className="p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                建议转粉: 当前停留率偏低，可增加互动话术
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}

// ==================== 模式2: 对标情报 ====================

function SpyIntelligence() {
  const { spySnippets, spyAccounts, fuseSnippetToScript, addSpyAccount, removeSpyAccount } = useWorkspaceStore();
  const [draggedSnippet, setDraggedSnippet] = useState<SpySnippet | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newDouyinId, setNewDouyinId] = useState('');
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock数据
  const mockSnippets: SpySnippet[] = [
    {
      id: '1',
      timestamp: '14:32',
      content: '姐妹们，这款连衣裙今天直播间专属价只要99，平时都是299的价格！',
      conversionRate: 12.5,
      isHighValue: true,
    },
    {
      id: '2',
      timestamp: '14:45',
      content: '看这个面料，亲肤透气，夏天穿完全不闷热！',
      conversionRate: 8.2,
      isHighValue: false,
    },
    {
      id: '3',
      timestamp: '15:01',
      content: '库存只剩最后50件了，想要的姐妹扣1！',
      conversionRate: 15.8,
      isHighValue: true,
    },
  ];

  const handleDragStart = (snippet: SpySnippet) => {
    setDraggedSnippet(snippet);
  };

  const handleDragEnd = () => {
    setDraggedSnippet(null);
  };

  const handleAddAccount = async () => {
    if (!newDouyinId.trim() || !newName.trim()) {
      setAddError('请填写完整信息');
      return;
    }
    
    setIsSubmitting(true);
    setAddError(null);
    
    try {
      await addSpyAccount(newDouyinId, newName);
      setNewDouyinId('');
      setNewName('');
      setIsAdding(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '添加失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayAccounts = spyAccounts.length > 0 ? spyAccounts : [
    { id: 'mock1', name: 'XX女装旗舰店', douyinId: 'xxx123', isLive: true },
    { id: 'mock2', name: 'YY潮流服饰', douyinId: 'yyy456', isLive: false },
  ];

  return (
    <WorkspaceLayout
      leftPanel={
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">监控账号</h3>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加
            </button>
          </div>
          
          {/* 添加账号表单 */}
          {isAdding && (
            <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
              <div className="space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="账号名称"
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                />
                <input
                  type="text"
                  value={newDouyinId}
                  onChange={(e) => setNewDouyinId(e.target.value)}
                  placeholder="抖音号"
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                />
                {addError && (
                  <div className="text-xs text-red-500">{addError}</div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddAccount}
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-1">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        添加中...
                      </span>
                    ) : '确认添加'}
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setAddError(null);
                      setNewDouyinId('');
                      setNewName('');
                    }}
                    className="px-3 py-2 border border-gray-300 text-gray-600 text-xs rounded hover:bg-gray-50"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 账号列表 */}
          <div className="space-y-2">
            {displayAccounts.map((account) => (
              <div key={account.id} className="bg-white p-3 rounded-lg border border-gray-200 group">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{account.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`
                      w-2 h-2 rounded-full
                      ${account.isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}
                    `} />
                    {!account.id.startsWith('mock') && (
                      <button
                        onClick={() => removeSpyAccount(account.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                        title="删除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">{account.douyinId}</div>
                {account.isLive && (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    正在直播
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {spyAccounts.length === 0 && (
            <div className="text-center py-4 text-xs text-gray-400">
              暂无监控账号，点击"添加"开始
            </div>
          )}
        </div>
      }
      centerPanel={
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">话术时间轴</h2>
              <p className="text-xs text-gray-500 mt-1">自动抓取 · 实时转写 · AI拆解</p>
            </div>
            <button className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              一键融合
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            {(spySnippets.length > 0 ? spySnippets : mockSnippets).map((snippet) => (
              <div
                key={snippet.id}
                draggable
                onDragStart={() => handleDragStart(snippet)}
                onDragEnd={handleDragEnd}
                className={`
                  p-4 rounded-lg border cursor-move transition-all hover:shadow-md
                  ${snippet.isHighValue 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-white border-gray-200'}
                  ${draggedSnippet?.id === snippet.id ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{snippet.timestamp}</span>
                  {snippet.isHighValue && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded">
                      高转化 {snippet.conversionRate}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{snippet.content}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-purple-600">拖拽到话术编辑器</span>
                  <button 
                    onClick={() => fuseSnippetToScript(snippet.id, '塑品')}
                    className="text-xs text-gray-400 hover:text-purple-600 underline"
                  >
                    直接融合
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
      rightPanel={
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">话术结构拆解</h3>
          
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">开场钩子</div>
              <div className="text-sm text-gray-700">"姐妹们，今天这个价格只有直播间有"</div>
              <div className="mt-2 text-xs text-green-600">使用频次: 23次</div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">促单节奏</div>
              <div className="text-sm text-gray-700">3分钟一个循环，紧迫感递进</div>
              <div className="mt-2 text-xs text-purple-600">平均停留: 45秒</div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">违规规避</div>
              <div className="text-sm text-green-600">无违规词 detected</div>
              <div className="mt-2 text-xs text-gray-400">最近一次检查: 2分钟前</div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-600 mb-2">今日监控统计</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded border text-center">
                <div className="font-bold text-gray-800">3</div>
                <div className="text-gray-500">监控账号</div>
              </div>
              <div className="bg-white p-2 rounded border text-center">
                <div className="font-bold text-gray-800">47</div>
                <div className="text-gray-500">抓取片段</div>
              </div>
              <div className="bg-white p-2 rounded border text-center">
                <div className="font-bold text-gray-800">12</div>
                <div className="text-gray-500">高转化片段</div>
              </div>
              <div className="bg-white p-2 rounded border text-center">
                <div className="font-bold text-gray-800">8.5%</div>
                <div className="text-gray-500">平均转化率</div>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}

// ==================== 模式3: 新人陪练 ====================

function TrainingSimulator() {
  const [messages, setMessages] = useState<{role: 'ai' | 'user'; content: string; type?: 'barrage' | 'feedback'}[]>([
    { role: 'ai', content: '【AI观众-小美】这件衣服会不会显胖啊？', type: 'barrage' },
    { role: 'ai', content: '【AI观众-丽丽】包邮吗？什么快递？', type: 'barrage' },
  ]);
  const [input, setInput] = useState('');
  const [scores, setScores] = useState({ fluency: 75, coverage: 60, compliance: 100, overall: 78 });
  const [currentDay, setCurrentDay] = useState<1 | 2 | 3>(1);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: '【Bot点评】回复得体！但可以更强调产品的显瘦设计特点。建议话术："这款版型专门做了收腰设计，视觉上能显瘦5斤。"', type: 'feedback' },
        { role: 'ai', content: '【AI观众-花花】那价格方面呢？有优惠吗？', type: 'barrage' },
      ]);
      setScores({ fluency: 82, coverage: 75, compliance: 100, overall: 85 });
    }, 1500);
  };

  const courseContent = {
    1: { title: 'Day 1: 点对点', desc: '个位数直播间应对', progress: 30 },
    2: { title: 'Day 2: 平播', desc: '稳定节奏控场', progress: 0 },
    3: { title: 'Day 3: 憋单', desc: '高流量转化技巧', progress: 0 },
  };

  return (
    <WorkspaceLayout
      leftPanel={
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">3天课程</h3>
          
          <div className="space-y-2">
            {([1, 2, 3] as const).map((day) => (
              <button
                key={day}
                onClick={() => setCurrentDay(day)}
                className={`
                  w-full text-left p-3 rounded-lg border transition-all
                  ${currentDay === day 
                    ? 'bg-purple-50 border-purple-300' 
                    : 'bg-white border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="text-sm font-medium text-gray-800">{courseContent[day].title}</div>
                <div className="text-xs text-gray-500 mt-1">{courseContent[day].desc}</div>
                {currentDay === day && (
                  <>
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full" 
                        style={{ width: `${courseContent[day].progress}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-purple-600">进行中 {courseContent[day].progress}%</div>
                  </>
                )}
              </button>
            ))}
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2">总体学习进度</div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 w-[10%] rounded-full" />
            </div>
            <div className="text-xs text-gray-400 mt-1">10% 完成 (Day 1进行中)</div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="text-xs text-yellow-700 font-medium">今日目标</div>
            <ul className="text-xs text-yellow-600 mt-1 space-y-1">
              <li>• 完成10轮观众问答</li>
              <li>• 掌握3个促单话术</li>
              <li>• 合规评分保持100%</li>
            </ul>
          </div>
        </div>
      }
      centerPanel={
        <div className="h-full flex flex-col bg-gray-900">
          {/* 弹幕区域 */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`
                  max-w-[85%] p-3 rounded-lg text-sm
                  ${msg.role === 'ai' 
                    ? msg.type === 'feedback'
                      ? 'bg-purple-900/50 text-purple-100 border border-purple-700/50'
                      : 'bg-gray-700 text-white'
                    : 'bg-purple-600 text-white ml-auto'}
                `}
              >
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                <span className="text-xs ml-1">Bot评估中...</span>
              </div>
            )}
          </div>
          
          {/* 实时评分条 */}
          <div className="bg-gray-800 p-3 flex items-center gap-4 border-t border-gray-700">
            <ScoreBar label="流畅度" value={scores.fluency} color="green" />
            <ScoreBar label="卖点覆盖" value={scores.coverage} color="blue" />
            <ScoreBar label="合规" value={scores.compliance} color="red" />
            <div className="ml-auto text-white font-bold text-lg">{scores.overall}</div>
          </div>
          
          {/* 输入区 */}
          <div className="p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入主播回复..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                发送
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              提示: 快速回复观众疑问，突出产品卖点，避免违规词
            </div>
          </div>
        </div>
      }
      rightPanel={
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">实时点评</h3>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 mb-2">最新建议</div>
            <p className="text-sm text-gray-700 leading-relaxed">
              刚才的回复不错，但可以更强调产品的显瘦设计特点。
            </p>
            <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-700">
              <span className="font-medium">建议话术:</span><br/>
              "这款版型专门做了收腰设计，视觉上直接显瘦一圈！"
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-xs text-purple-600 mb-2 font-medium">标准话术对比</div>
            <p className="text-sm text-gray-700 leading-relaxed">
              "姐妹们看这个腰线设计，A字版型遮住小肚腩，视觉上直接显瘦一圈！"
            </p>
            <div className="mt-2 flex gap-2">
              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">卖点清晰</span>
              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">无违规</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 mb-3">本节课表现</div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">问答轮次</span>
                <span className="font-medium">12/20</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">平均响应时间</span>
                <span className="font-medium text-green-600">3.2秒</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">违规次数</span>
                <span className="font-medium text-green-600">0</span>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: 'green' | 'blue' | 'red' }) {
  const colorClass = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
  }[color];

  return (
    <div className="flex-1">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ==================== 模式4: 投流复盘 ====================

function PostGameAnalysis() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('14:00-15:00');
  const [attribution, setAttribution] = useState<{
    verdict: string;
    responsibility: '主播' | '流量' | '投放';
    suggestions: string[];
  } | null>({
    verdict: '流量峰值时主播在讲面料，错过转化窗口',
    responsibility: '主播',
    suggestions: [
      '流量高峰期应重点讲价格和促单话术',
      '面料介绍放在流量平稳期',
      '建议增加"限时"、"库存紧张"等紧迫感词汇'
    ]
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const timeRanges = [
    { time: '13:00-14:00', peak: 80, gmv: 3200, status: 'normal' },
    { time: '14:00-15:00', peak: 150, gmv: 1800, status: 'abnormal' },
    { time: '15:00-16:00', peak: 95, gmv: 4100, status: 'normal' },
  ];

  const handleAnalyze = (time: string) => {
    setSelectedTimeRange(time);
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1000);
  };

  return (
    <WorkspaceLayout
      leftPanel={
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">时段选择</h3>
          
          <div className="space-y-2">
            {timeRanges.map((range) => (
              <button
                key={range.time}
                onClick={() => handleAnalyze(range.time)}
                className={`
                  w-full text-left p-3 rounded-lg border transition-all
                  ${selectedTimeRange === range.time 
                    ? 'bg-purple-50 border-purple-300' 
                    : 'bg-white border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{range.time}</span>
                  {range.status === 'abnormal' && (
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  在线峰值: {range.peak}人 | GMV: ¥{range.gmv}
                </div>
                {range.status === 'abnormal' && (
                  <div className="mt-1 text-xs text-red-600">异常时段 - 需复盘</div>
                )}
              </button>
            ))}
          </div>
          
          <button className="w-full py-2 text-sm text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            上传录屏文件
          </button>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-700 font-medium">数据说明</div>
            <p className="text-xs text-blue-600 mt-1">
              选择异常时段后，系统将自动对齐流量数据与话术时间轴，AI归因分析根本原因。
            </p>
          </div>
        </div>
      }
      centerPanel={
        <div className="h-full flex flex-col p-6">
          {/* 双轴图表区域 */}
          <div className="h-64 bg-gray-50 rounded-lg border border-gray-200 mb-6 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-medium text-gray-800">流量与话术对齐分析</div>
                <div className="text-xs text-gray-500">{selectedTimeRange}</div>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-1 bg-blue-500 rounded"></span>
                  <span className="text-gray-600">在线人数</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-400 rounded"></span>
                  <span className="text-gray-600">塑品话术</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-orange-400 rounded"></span>
                  <span className="text-gray-600">促单话术</span>
                </div>
              </div>
            </div>
            
            {/* 模拟图表 */}
            <div className="h-40 relative">
              {/* Y轴标签 */}
              <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-400">
                <span>150</span>
                <span>100</span>
                <span>50</span>
                <span>0</span>
              </div>
              
              {/* 图表主体 */}
              <div className="ml-10 h-full relative">
                {/* 网格线 */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="border-t border-gray-200" />
                  ))}
                </div>
                
                {/* 流量曲线 (模拟) */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <path
                    d="M0,100 Q50,80 100,60 T200,20 T300,40 T400,80"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />
                </svg>
                
                {/* 话术节奏区块 */}
                <div className="absolute top-20 left-[15%] w-[20%] h-16 bg-green-200/50 rounded flex items-center justify-center text-xs text-green-700">
                  讲面料
                </div>
                <div className="absolute top-10 left-[40%] w-[25%] h-16 bg-orange-200/50 rounded flex items-center justify-center text-xs text-orange-700">
                  促单话术
                </div>
                <div className="absolute top-24 left-[70%] w-[20%] h-16 bg-green-200/50 rounded flex items-center justify-center text-xs text-green-700">
                  过款
                </div>
                
                {/* 峰值标记 */}
                <div className="absolute top-4 left-[40%] transform -translate-x-1/2">
                  <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                    流量峰值 150人
                  </div>
                </div>
              </div>
            </div>
            
            {/* X轴时间标签 */}
            <div className="ml-10 mt-2 flex justify-between text-xs text-gray-400">
              <span>14:00</span>
              <span>14:20</span>
              <span>14:40</span>
              <span>15:00</span>
            </div>
          </div>
          
          {/* 判定结论卡片 */}
          {isAnalyzing ? (
            <div className="p-6 rounded-lg border border-gray-200 flex items-center justify-center">
              <div className="flex items-center gap-3 text-gray-500">
                <span className="w-5 h-5 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
                <span>AI正在分析数据...</span>
              </div>
            </div>
          ) : attribution ? (
            <div className={`
              p-6 rounded-lg border-l-4 mb-6
              ${attribution.responsibility === '主播' 
                ? 'bg-orange-50 border-orange-500' 
                : attribution.responsibility === '流量'
                ? 'bg-blue-50 border-blue-500'
                : 'bg-purple-50 border-purple-500'}
            `}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">AI判定结论</span>
                <span className={`
                  px-2 py-0.5 rounded text-xs font-medium
                  ${attribution.responsibility === '主播' 
                    ? 'bg-orange-200 text-orange-800' 
                    : attribution.responsibility === '流量'
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-purple-200 text-purple-800'}
                `}>
                  {attribution.responsibility}问题
                </span>
              </div>
              <div className="text-xl font-bold text-gray-800 mb-4">
                {attribution.verdict}
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-600 font-medium">优化建议:</div>
                <ul className="space-y-1">
                  {attribution.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
          
          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              生成优化话术
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              导出复盘报告
            </button>
          </div>
        </div>
      }
      rightPanel={
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">数据对比</h3>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 mb-2">GPM对比</div>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold text-gray-800">¥1,250</div>
              <div className="text-sm text-red-500 mb-1">↓ 15%</div>
            </div>
            <div className="text-xs text-gray-400">均值: ¥1,470</div>
            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 w-[85%] rounded-full" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 mb-2">转化率对比</div>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold text-gray-800">1.8%</div>
              <div className="text-sm text-red-500 mb-1">↓ 0.7%</div>
            </div>
            <div className="text-xs text-gray-400">均值: 2.5%</div>
            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 w-[72%] rounded-full" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 mb-2">平均停留</div>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold text-gray-800">45s</div>
              <div className="text-sm text-green-500 mb-1">↑ 5s</div>
            </div>
            <div className="text-xs text-gray-400">均值: 40s</div>
            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[112%] rounded-full" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 mb-2">互动率</div>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold text-gray-800">8.5%</div>
              <div className="text-sm text-green-500 mb-1">↑ 1.2%</div>
            </div>
            <div className="text-xs text-gray-400">均值: 7.3%</div>
            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-full rounded-full" />
            </div>
          </div>
        </div>
      }
    />
  );
}

// ==================== ModeTransition ====================

function ModeTransition() {
  const { currentMode } = useWorkspaceStore();

  const modeComponents: Record<Mode, React.FC> = {
    script: ScriptCreator,
    spy: SpyIntelligence,
    training: TrainingSimulator,
    analysis: PostGameAnalysis,
  };

  const Component = modeComponents[currentMode];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentMode}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Component />
      </motion.div>
    </AnimatePresence>
  );
}

// ==================== 主页面 ====================

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-white">
      <ModeNavigator />
      <div className="flex-1 min-h-0">
        <ModeTransition />
      </div>
    </div>
  );
}
