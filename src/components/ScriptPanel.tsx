'use client';

import { useState } from 'react';
import { useBattleStore } from '@/store/battleStore';
import { cozeClient } from '@/lib/coze-client';
import { MessageSquare, Sparkles, Check, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SELLING_FORMULAS = [
  { id: 1, name: '痛点+解决方案', preview: '你是不是也遇到...？今天给你推荐...' },
  { id: 2, name: '对比法', preview: '市面上的产品要么...要么...，我们的是...' },
  { id: 3, name: '信任背书', preview: '已经有10000+姐妹买了，好评率...' },
  { id: 4, name: '限时优惠', preview: '今天直播间专属价格，仅限...' },
  { id: 5, name: '场景代入', preview: '想象一下，当你...' },
];

export default function ScriptPanel() {
  const { roiData, trafficData, scriptData, setScriptData, setPhase } = useBattleStore();
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [sellingPoint, setSellingPoint] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [price, setPrice] = useState('');
  const [selectedFormula, setSelectedFormula] = useState(1);
  const [activeTab, setActiveTab] = useState<'full' | 'shaping' | 'pricing' | 'harvesting'>('full');

  const handleGenerate = async () => {
    if (!productName || !sellingPoint) {
      alert('请填写产品名称和核心卖点');
      return;
    }

    setLoading(true);
    setPhase('script_generating');

    try {
      const payload = {
        product_name: productName,
        price: parseInt(price) || 199,
        selling_point: sellingPoint,
        target_audience: targetAudience || '通用',
        traffic_level: trafficData?.level || '10-20人',
        formula_id: selectedFormula,
        roi_target: roiData?.results?.target_roi || 3.5,
      };

      const response = await cozeClient.sendCommand('/script_gen', payload);
      setScriptData(response);
    } catch (error) {
      console.error('Script generation failed:', error);

      // 提供默认的话术模板
      const priceValue = parseInt(price) || 199;
      const formula = SELLING_FORMULAS.find(f => f.id === selectedFormula);

      const fullScript = `## 直播话术模板

### 产品信息
- **产品名称**: ${productName}
- **核心卖点**: ${sellingPoint}
- **目标人群**: ${targetAudience || '通用'}
- **价格**: ¥${priceValue}
- **卖点公式**: ${formula?.name || '痛点+解决方案'}

---

### 🎯 开场（塑品段）

【引入痛点】
有没有姐妹也遇到过这样的困扰？${sellingPoint}的问题一直解决不了，试了很多方法都不行？

【建立共鸣】
我之前也是这样，直到我发现了这款${productName}...

【产品亮相】
今天给大家推荐的就是这款${productName}，${sellingPoint}

---

### 💡 产品介绍（详细展示）

【核心卖点展示】
给大家看看${sellingPoint}的实际效果...

【使用场景】
想象一下，当你使用这款${productName}的时候，${sellingPoint}就不再是问题了...

【对比优势】
市面上的产品要么太贵，要么效果不好，我们这款${productName}...

---

### 💰 报价促单（转化段）

【价格锚定】
平时这款产品在专柜都要卖到¥${Math.round(priceValue * 2)}，今天直播间专属价格...

【限时优惠】
今天直播间专属价格，只要¥${priceValue}，仅限今天，仅限直播间！

【信任背书】
已经有10万+姐妹买了，好评率99%，大家可以看评论区...

【紧迫感营造】
库存不多，只有最后50单，抢完就没有了！

---

### 🎁 催单收割（成交段）

【再次强调】
记住，这款${productName}，${sellingPoint}，今天只要¥${priceValue}

【最后提醒】
只有最后3分钟，库存只剩最后20单，没有抢到的姐妹不要后悔！

【成交引导】
想要的姐妹扣1，我给你们上链接！

---

### 💡 话术要点总结
1. 痛点引入 - 建立共鸣
2. 产品展示 - 详细讲解
3. 对比优势 - 突出价值
4. 限时优惠 - 制造紧迫感
5. 信任背书 - 消除疑虑
6. 催单收割 - 快速成交
`;

      setScriptData({
        product: {
          name: productName,
          price: priceValue,
          selling_point: sellingPoint,
          target_audience: targetAudience || '通用',
        },
        selected_formula,
        full_script,
        structure: {
          shaping: full_script.split('---')[1] || '',
          pricing: full_script.split('---')[2] || '',
          harvesting: full_script.split('---')[3] || '',
        },
      });

      alert('话术生成完成（使用本地模板）');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('已复制到剪贴板');
    } catch (error) {
      alert('复制失败');
    }
  };

  const getTabContent = () => {
    if (!scriptData) return '';

    switch (activeTab) {
      case 'full':
        return scriptData.full_script;
      case 'shaping':
        return scriptData.structure.shaping || '暂无内容';
      case 'pricing':
        return scriptData.structure.pricing || '暂无内容';
      case 'harvesting':
        return scriptData.structure.harvesting || '暂无内容';
      default:
        return '';
    }
  };

  if (scriptData) {
    return (
      <div className="h-full flex flex-col p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            话术生成结果
          </h2>
          <button
            onClick={() => {
              setProductName('');
              setSellingPoint('');
              setTargetAudience('');
              setPrice('');
              setPhase('traffic_done');
            }}
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            重新生成
          </button>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">产品：</span>
              <span className="font-medium">{scriptData.product.name}</span>
            </div>
            <div>
              <span className="text-gray-500">价格：</span>
              <span className="font-medium">¥{scriptData.product.price}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">核心卖点：</span>
              <span className="font-medium">{scriptData.product.selling_point}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('full')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'full'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            完整话术
          </button>
          <button
            onClick={() => setActiveTab('shaping')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'shaping'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            塑品段
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'pricing'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            报价段
          </button>
          <button
            onClick={() => setActiveTab('harvesting')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'harvesting'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            收割段
          </button>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">
              {activeTab === 'full' && '完整话术'}
              {activeTab === 'shaping' && '塑品段 - 建立信任'}
              {activeTab === 'pricing' && '报价段 - 价值锚定'}
              {activeTab === 'harvesting' && '收割段 - 促成转化'}
            </h3>
            <button
              onClick={() => handleCopy(getTabContent())}
              className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              复制
            </button>
          </div>
          <div className="flex-1 overflow-y-auto prose prose-sm max-w-none">
            <ReactMarkdown>
              {getTabContent()}
            </ReactMarkdown>
          </div>
        </div>

        <div className="mt-3 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <div className="text-xs text-yellow-800">
            <strong>⚠️ 注意：</strong>请根据实际直播情况调整话术，避免使用违禁词
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          话术生成
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            产品名称
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="例如：法式茶歇裙"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            核心卖点
          </label>
          <textarea
            value={sellingPoint}
            onChange={(e) => setSellingPoint(e.target.value)}
            placeholder="例如：梨形身材遮胯，显瘦显高"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            目标人群
          </label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="例如：25-35岁职场女性"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            价格 (¥)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="199"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            选择卖点公式
          </label>
          <div className="space-y-2">
            {SELLING_FORMULAS.map((formula) => (
              <button
                key={formula.id}
                onClick={() => setSelectedFormula(formula.id)}
                className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                  selectedFormula === formula.id
                    ? 'bg-purple-100 border-2 border-purple-500'
                    : 'bg-gray-50 border-2 border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-gray-800">
                      {formula.id}. {formula.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formula.preview}
                    </div>
                  </div>
                  {selectedFormula === formula.id && (
                    <Check className="w-5 h-5 text-purple-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {trafficData && (
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
            <div className="text-xs text-purple-800">
              <strong>📊 已关联流量数据：</strong>
              <br />
              流量层级: {trafficData.level} | 
              策略: {trafficData.strategy}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !productName || !sellingPoint}
        className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {loading ? '生成中...' : '生成话术'}
      </button>
    </div>
  );
}
