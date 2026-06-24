import { useAppStore } from '../../src/shared/hooks/useAppStore';
import type { VisionAnalysis } from '../../src/shared/types';

const makeAnalysis = (id: string, severity: VisionAnalysis['severity'] = 'info'): VisionAnalysis => ({
  id,
  summary: `Summary ${id}`,
  details: `Details ${id}`,
  severity,
  actionItems: [`Action ${id}`],
  confidence: 0.85,
  analyzedAt: new Date(),
});

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().clearHistory();
    useAppStore.getState().setConnectionStatus('disconnected');
    useAppStore.getState().setSession(null);
  });

  it('starts with empty analyses', () => {
    expect(useAppStore.getState().analyses).toHaveLength(0);
  });

  it('addAnalysis updates currentAnalysis', () => {
    const analysis = makeAnalysis('a1');
    useAppStore.getState().addAnalysis(analysis);
    expect(useAppStore.getState().currentAnalysis).toBe(analysis);
  });

  it('addAnalysis limits to 50', () => {
    for (let i = 0; i < 55; i++) {
      useAppStore.getState().addAnalysis(makeAnalysis(`a${i}`));
    }
    expect(useAppStore.getState().analyses).toHaveLength(50);
  });

  it('clearHistory empties analyses and currentAnalysis', () => {
    useAppStore.getState().addAnalysis(makeAnalysis('a1'));
    useAppStore.getState().clearHistory();
    expect(useAppStore.getState().analyses).toHaveLength(0);
    expect(useAppStore.getState().currentAnalysis).toBeNull();
  });

  it('setConfig merges partial config', () => {
    useAppStore.getState().setConfig({ technicianName: 'Juan' });
    expect(useAppStore.getState().config.technicianName).toBe('Juan');
    expect(useAppStore.getState().config.context).toBe('electrical');
  });

  it('setConnectionStatus updates status', () => {
    useAppStore.getState().setConnectionStatus('connected');
    expect(useAppStore.getState().connectionStatus).toBe('connected');
  });

  it('setSession updates session', () => {
    const session = { id: 's1', deviceId: 'd1', startedAt: new Date(), status: 'connected' as const };
    useAppStore.getState().setSession(session);
    expect(useAppStore.getState().session).toBe(session);
  });
});
