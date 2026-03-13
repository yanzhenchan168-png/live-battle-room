import { create } from 'zustand';
import { BattleState, ROIInputs, ROIResults, TrafficData, ScriptData } from '@/types/battle';

interface BattleStore extends BattleState {
  setPhase: (phase: BattleState['phase']) => void;
  setROIData: (inputs: ROIInputs, results: ROIResults, report: string) => void;
  setTrafficData: (data: TrafficData) => void;
  setScriptData: (data: ScriptData) => void;
  setSuggestions: (suggestions: string[]) => void;
  reset: () => void;
}

const initialState: BattleState = {
  phase: 'idle',
  roiData: null,
  trafficData: null,
  scriptData: null,
  suggestions: [],
};

export const useBattleStore = create<BattleStore>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  setROIData: (inputs, results, report) => 
    set({ 
      roiData: { inputs, results, report },
      phase: 'roi_done',
    }),

  setTrafficData: (data) =>
    set({
      trafficData: data,
      phase: 'traffic_done',
    }),

  setScriptData: (data) =>
    set({
      scriptData: data,
      phase: 'ready',
    }),

  setSuggestions: (suggestions) => set({ suggestions }),

  reset: () => set(initialState),
}));
