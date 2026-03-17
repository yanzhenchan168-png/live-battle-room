'use client';

import { useState } from 'react';
import { useBattleStore } from '@/store/battleStore';
import { cozeClient } from '@/lib/coze-client';
import { MessageSquare, Sparkles, Check, Copy, Send, RefreshCw, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SELLING_FORMULAS = [
  { id: 1, name: '痛点+解决方案', preview: '你是不是也遇到...？今天给你推荐...' },
  { id: 2, name: '对比法', preview: '市面上的产品要么...要么...，我们的是...' },
  { id: 3, name: '信任背书', preview: '已经有10000+姐妹买了，好评率...' },
  { id: 4, name: '限时优惠', preview: '今天直播间专属价格，仅限...' },
  { id: 5, name: '场景代入', preview: '想象一下，当你...' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ScriptPanel() {
  const { roiData, trafficData, scriptData, setScriptData, setPhase } = useBattleStore();
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState('法式茶歇裙');
  const [sellingPoint, setSellingPoint] = useState('梨形身材遮胯，显瘦显高');
  const [targetAudience, setTargetAudience] = useState('25-35岁职场女性');
  const [price, setPrice] = useState('199');
  const [selectedFormula, setSelectedFormula] = useState(1);
  const [activeTab, setActiveTab] = useState<'full' | 'shaping' | 'pricing' | 'harvesting'>('full');
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');

  const handleGenerate = async () => {
    if (!productName || !sellingPoint) {
      alert('请填写产品名称和核心卖点');
      return;
    }

    setLoading(true);
    setPhase('script_generating');

    // 根据已有信息判断是否需要更多信息
    const needMoreInfo = checkNeedMoreInfo();

    if (needMoreInfo) {
      // 开启对话模式，询问用户更多信息
      setShowChat(true);
      const question = generateQuestion();
      setMessages([
        { role: 'assistant', content: question }
      ]);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        product_name: productName,
        price: parseInt(price) || 199,
        selling_point: sellingPoint,
        target_audience: targetAudience || '通用',
        traffic_level: trafficData?.online_count || 0,
        formula_id: selectedFormula,
        roi_target: roiData?.results?.target_roi || 3.5,
      };

      const response = await cozeClient.sendCommand('/script_gen', payload);
      // 清理API返回的技术参数，并确保使用用户输入的产品信息
      if (response.full_script) {
        response.full_script = cleanTechnicalParams(response.full_script);
      }
      // 强制使用用户输入的产品信息
      setScriptData({
        ...response,
        product: {
          name: productName,
          price: parseInt(price) || 199,
          selling_point: sellingPoint,
          target_audience: targetAudience || '通用',
        },
      });
    } catch (error) {
      console.error('Script generation failed:', error);
      alert('话术生成失败，请检查网络连接后重试');
    } finally {
      setLoading(false);
    }
  };

  // 清理技术参数
  const cleanTechnicalParams = (text: string): string => {
    return text
      .replace(/formula_id[是为：\s]+\d+/gi, '')
      .replace(/ROI目标[约为：\s]+[\d.]+/gi, '')
      .replace(/用户要求[。，、]/gi, '')
      .replace(/不要询问任何问题/gi, '')
      .replace(/\d+\.\d{10,}/g, '') // 移除超长小数
      .trim();
  };

  const checkNeedMoreInfo = () => {
    // 如果信息不够充分，需要询问更多信息
    // 例如：没有填写目标人群、没有流量数据、没有ROI数据等
    if (!targetAudience || targetAudience === '通用' || targetAudience === '') {
      return true;
    }
    if (!trafficData) {
      return true;
    }
    return false;
  };

  const generateQuestion = () => {
    if (!targetAudience || targetAudience === '通用' || targetAudience === '') {
      return `我注意到你还没有详细描述目标人群的特征。\n\n为了生成更精准的话术，请告诉我：\n\n1. 你的目标客户主要是哪些年龄段？\n2. 她们的消费习惯和痛点是什么？\n3. 她们通常在什么场景下会使用这个产品？`;
    }
    if (!trafficData) {
      return `我注意到你还没有完成流量诊断。\n\n话术策略需要根据流量层级来调整，不同流量对应不同的话术节奏和促单方式。\n\n你希望：\n1. 先去完成流量诊断\n2. 或者告诉我你的预估在线人数，我来帮你判断`;
    }
    return `为了生成更优质的话术，请告诉我更多产品信息，比如：\n\n1. 产品的主要材质或成分\n2. 与竞品相比的优势\n3. 用户反馈最多的好评点`;
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, content: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setLoading(true);

    try {
      // 这里可以调用API进行多轮对话
      // 暂时使用本地逻辑
      const response = `好的，我收到了你的信息。基于你提供的内容，我来为你生成更精准的话术方案。`;
      setMessages([...newMessages, { role: 'assistant', content: response }]);
      
      // 延迟后生成话术
      setTimeout(() => {
        generateLocalScript();
        setShowChat(false);
      }, 1500);
    } catch (error) {
      console.error('Chat failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLocalScript = async () => {
    const priceValue = parseInt(price) || 199;
    
    const payload = {
      product_name: productName,
      price: priceValue,
      selling_point: sellingPoint,
      target_audience: targetAudience || '通用',
      traffic_level: trafficData?.online_count || 0,
      formula_id: selectedFormula,
      roi_target: roiData?.results?.target_roi || 3.5,
    };

    try {
      setLoading(true);
      const response = await cozeClient.sendCommand('/script_gen', payload);
      
      // 处理API返回的话术数据
      if (response) {
        // 清理技术参数
        if (response.full_script) {
          response.full_script = cleanTechnicalParams(response.full_script);
        }
        if (response.structure?.shaping) {
          response.structure.shaping = cleanTechnicalParams(response.structure.shaping);
        }
        if (response.structure?.pricing) {
          response.structure.pricing = cleanTechnicalParams(response.structure.pricing);
        }
        if (response.structure?.harvesting) {
          response.structure.harvesting = cleanTechnicalParams(response.structure.harvesting);
        }
        
        setScriptData({
          ...response,
          product: {
            name: productName,
            price: priceValue,
            selling_point: sellingPoint,
            target_audience: targetAudience || '通用',
          },
        });
        setPhase('ready');
      }
    } catch (error) {
      console.error('Script generation failed:', error);
      alert('话术生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 换一种风格重新生成
  const handleRegenerate = () => {
    generateLocalScript();
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
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              话术生成结果
            </h2>
            {scriptData.style && (
              <p className="text-xs text-gray-500 mt-1">
                当前风格：<span className="font-medium text-purple-600">{scriptData.style.split('-').join(' + ')}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="px-4 py-2 bg-white border-2 border-purple-300 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              换一种风格
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              重新输入
            </button>
          </div>
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
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          话术生成
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
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

      <div className="pt-2 pb-2 flex-shrink-0 sticky bottom-0 bg-gradient-to-br from-purple-50 to-pink-50 z-10">
        {showChat ? (
          // 对话模式界面
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-3 font-medium">💬 需要更多信息来生成优质话术</div>
            <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-3 py-2 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="输入你的回答..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !userInput.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                setShowChat(false);
                generateLocalScript();
              }}
              className="mt-2 w-full text-sm text-gray-500 hover:text-gray-700"
            >
              跳过，直接生成基础话术
            </button>
          </div>
        ) : (
          // 原有的生成按钮
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Sparkles className="w-5 h-5" />
            {loading ? '生成中...' : '✨ 生成话术'}
          </button>
        )}
      </div>
    </div>
  );
}
