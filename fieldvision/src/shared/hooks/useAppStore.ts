import { create } from 'zustand';
import type {
  GlassesConnectionStatus, GlassesSession, CameraFrame,
  VisionAnalysis, FieldVisionConfig,
  AuthUser, AuthSession,
} from '../types';

// ─── Slices ───────────────────────────────────────────────────────────────────

interface AuthSlice {
  authUser: AuthUser | null;
  authSession: AuthSession | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  setAuthUser: (user: AuthUser | null) => void;
  setAuthSession: (session: AuthSession | null) => void;
  setIsLoadingAuth: (v: boolean) => void;
  logout: () => void;
}

interface GlassesSlice {
  connectionStatus: GlassesConnectionStatus;
  session: GlassesSession | null;
  /** Última foto capturada por los lentes, para poder verla en pantalla. */
  lastFrame: CameraFrame | null;
  setConnectionStatus: (s: GlassesConnectionStatus) => void;
  setSession: (s: GlassesSession | null) => void;
  setLastFrame: (f: CameraFrame | null) => void;
}

interface VisionSlice {
  analyses: VisionAnalysis[];
  currentAnalysis: VisionAnalysis | null;
  isAnalyzing: boolean;
  addAnalysis: (a: VisionAnalysis) => void;
  setCurrentAnalysis: (a: VisionAnalysis | null) => void;
  setIsAnalyzing: (v: boolean) => void;
  clearHistory: () => void;
}

interface ConfigSlice {
  config: FieldVisionConfig;
  setConfig: (partial: Partial<FieldVisionConfig>) => void;
}

type AppStore = AuthSlice & GlassesSlice & VisionSlice & ConfigSlice;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set) => ({
  // Auth
  authUser: null,
  authSession: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  setAuthUser: (authUser) => set({ authUser, isAuthenticated: authUser !== null }),
  setAuthSession: (authSession) => set({ authSession }),
  setIsLoadingAuth: (isLoadingAuth) => set({ isLoadingAuth }),
  logout: () => set({
    authUser: null,
    authSession: null,
    isAuthenticated: false,
    isLoadingAuth: false,
    // Reset app state on logout
    analyses: [],
    currentAnalysis: null,
    session: null,
    connectionStatus: 'disconnected',
    lastFrame: null,
  }),

  // Glasses
  connectionStatus: 'disconnected',
  session: null,
  lastFrame: null,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setSession: (session) => set({ session }),
  setLastFrame: (lastFrame) => set({ lastFrame }),

  // Vision
  analyses: [],
  currentAnalysis: null,
  isAnalyzing: false,
  addAnalysis: (analysis) => set((state) => ({
    analyses: [analysis, ...state.analyses].slice(0, 50),
    currentAnalysis: analysis,
  })),
  setCurrentAnalysis: (currentAnalysis) => set({ currentAnalysis }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  clearHistory: () => set({ analyses: [], currentAnalysis: null }),

  // Config
  config: {
    context: 'electrical',
    technicianName: 'Técnico',
    language: 'es',
    autoCapture: false,
    captureIntervalMs: 5000,
  },
  setConfig: (partial) => set((state) => ({ config: { ...state.config, ...partial } })),
}));
