import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================== 类型定义 ====================

export type Mode = 'script' | 'spy' | 'training' | 'analysis';

export interface ScriptSegment {
  id: string;
  type: '塑品' | '报价' | '收割';
  content: string;
  isViolation?: boolean;
}

export interface SpySnippet {
  id: string;
  timestamp: string;
  content: string;
  conversionRate: number;
  isHighValue: boolean;
}

export interface ProductInfo {
  name: string;
  price: number;
  sellingPoints: string[];
}

export interface OCRData {
  gmv: number;
  onlineCount: number;
  conversionRate: number;
  trafficLevel: '个位数' | '10-50' | '高流量';
}

export interface SpyAccount {
  id: string;
  douyinId: string;
  name: string;
  isLive: boolean;
  lastRecordAt?: string;
}

// ==================== Store 接口 ====================

interface WorkspaceState {
  currentMode: Mode;
  setMode: (mode: Mode) => void;
  
  scriptContent: {
    segments: ScriptSegment[];
    productInfo: ProductInfo;
  };
  updateSegment: (id: string, content: string) => void;
  setProductInfo: (info: ProductInfo) => void;
  
  // 话术生成
  isGenerating: boolean;
  generateError: string | null;
  generateScript: (style: '憋单' | '平播' | '收割' | 'refresh') => Promise<void>;
  
  ocrData: OCRData | null;
  setOCRData: (data: OCRData | null) => void;
  
  // 对标情报
  spyAccounts: SpyAccount[];
  addSpyAccount: (douyinId: string, name: string) => Promise<void>;
  removeSpyAccount: (id: string) => void;
  
  spySnippets: SpySnippet[];
  addSpySnippet: (snippet: SpySnippet) => void;
  
  isFusing: boolean;
  fuseError: string | null;
  fuseSnippetToScript: (snippetId: string, targetSegment: '塑品' | '报价' | '收割') => Promise<void>;
  
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  toggleLeft: () => void;
  toggleRight: () => void;
}

// ==================== Zustand Store ====================

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      currentMode: 'script',
      setMode: (mode) => set({ currentMode: mode }),
      
      scriptContent: {
        segments: [
          { id: '1', type: '塑品', content: '' },
          { id: '2', type: '报价', content: '' },
          { id: '3', type: '收割', content: '' },
        ],
        productInfo: { name: '', price: 0, sellingPoints: [] },
      },
      updateSegment: (id, content) => set((state) => ({
        scriptContent: {
          ...state.scriptContent,
          segments: state.scriptContent.segments.map((s) =>
            s.id === id ? { ...s, content } : s
          ),
        },
      })),
      setProductInfo: (info) => set((state) => ({
        scriptContent: { ...state.scriptContent, productInfo: info },
      })),
      
      // 话术生成
      isGenerating: false,
      generateError: null,
      generateScript: async (style) => {
        set({ isGenerating: true, generateError: null });
        
        try {
          const res = await fetch('/api/bot/generate-script', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              style,
              productInfo: get().scriptContent.productInfo,
              ocrData: get().ocrData,
              currentSegments: get().scriptContent.segments,
            }),
          });
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || '生成失败');
          }
          
          const { segments } = await res.json();
          
          // 更新所有段落
          segments.forEach((seg: ScriptSegment) => {
            const existing = get().scriptContent.segments.find((s) => s.type === seg.type);
            if (existing) {
              get().updateSegment(existing.id, seg.content);
            }
          });
        } catch (err) {
          set({ generateError: err instanceof Error ? err.message : '生成失败' });
          // 3秒后自动清除错误
          setTimeout(() => set({ generateError: null }), 3000);
        } finally {
          set({ isGenerating: false });
        }
      },
      
      ocrData: null,
      setOCRData: (data) => set({ ocrData: data }),
      
      // 对标账号管理
      spyAccounts: [],
      addSpyAccount: async (douyinId, name) => {
        if (!douyinId.trim() || !name.trim()) {
          throw new Error('抖音号和名称不能为空');
        }
        
        // 检查是否已存在
        const exists = get().spyAccounts.find((a) => a.douyinId === douyinId.trim());
        if (exists) {
          throw new Error('该账号已在监控列表中');
        }
        
        const newAccount: SpyAccount = {
          id: Date.now().toString(),
          douyinId: douyinId.trim(),
          name: name.trim(),
          isLive: false,
        };
        
        set((state) => ({
          spyAccounts: [...state.spyAccounts, newAccount],
        }));
        
        // 可选：调用后端API开始监控
        try {
          await fetch('/api/spy/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAccount),
          });
        } catch {
          // 后端调用失败不影响前端存储
        }
      },
      removeSpyAccount: (id) => {
        set((state) => ({
          spyAccounts: state.spyAccounts.filter((a) => a.id !== id),
        }));
      },
      
      spySnippets: [],
      addSpySnippet: (snippet) => set((state) => ({
        spySnippets: [...state.spySnippets, snippet],
      })),
      
      isFusing: false,
      fuseError: null,
      fuseSnippetToScript: async (snippetId, targetSegment) => {
        const snippet = get().spySnippets.find((s) => s.id === snippetId);
        if (!snippet) return;
        
        set({ isFusing: true, fuseError: null });
        
        try {
          const res = await fetch('/api/bot/fuse-script', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              competitorSnippet: snippet.content,
              productInfo: get().scriptContent.productInfo,
              targetSegment,
              currentScript: get().scriptContent.segments,
            }),
          });
          
          if (!res.ok) throw new Error('融合失败');
          
          const { fusedContent } = await res.json();
          const segment = get().scriptContent.segments.find((s) => s.type === targetSegment);
          if (segment) {
            get().updateSegment(segment.id, fusedContent);
          }
        } catch (err) {
          set({ fuseError: err instanceof Error ? err.message : '融合失败' });
          setTimeout(() => set({ fuseError: null }), 3000);
        } finally {
          set({ isFusing: false });
        }
      },
      
      leftCollapsed: false,
      rightCollapsed: false,
      toggleLeft: () => set((state) => ({ leftCollapsed: !state.leftCollapsed })),
      toggleRight: () => set((state) => ({ rightCollapsed: !state.rightCollapsed })),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        scriptContent: state.scriptContent,
        spySnippets: state.spySnippets,
        spyAccounts: state.spyAccounts,
      }),
    }
  )
);
