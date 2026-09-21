import axios from 'axios';
import { VisionAIService } from '../../src/modules/vision/infrastructure/services/VisionAIService';
import type { CameraFrame } from '../../src/shared/types';

// Aquí NO se sobreescribe @env: la key sigue siendo el PLACEHOLDER de __mocks__/env.ts,
// así que el servicio debe responder con el análisis simulado sin tocar la red.
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockFrame: CameraFrame = {
  base64: 'mockbase64',
  width: 1280,
  height: 720,
  timestamp: Date.now(),
};

describe('VisionAIService (modo demo, sin key de IA)', () => {
  let service: VisionAIService;

  beforeEach(() => {
    service = new VisionAIService();
    mockedAxios.post.mockClear();
  });

  it('no llama a la API de IA', async () => {
    await service.analyzeFrame(mockFrame, 'electrical');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('devuelve un análisis simulado válido', async () => {
    const result = await service.analyzeFrame(mockFrame, 'electrical');
    expect(['info', 'warning', 'critical']).toContain(result.severity);
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.actionItems).toHaveLength(1);
    expect(result.details).toContain('Resultado simulado');
  });

  it('usa los diagnósticos del contexto pedido', async () => {
    const result = await service.analyzeFrame(mockFrame, 'plumbing');
    expect(result.details).toMatch(/SEVERIDAD: (OK|ATENCIÓN|CRÍTICO)/);
    expect(result.frameRef).toBe(`frame_${mockFrame.timestamp}`);
  });
});
