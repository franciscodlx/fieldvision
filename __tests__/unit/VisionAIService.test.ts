import axios from 'axios';
import { VisionAIService } from '../../src/modules/vision/infrastructure/services/VisionAIService';
import type { CameraFrame } from '../../src/shared/types';

// Sin una key real, el servicio corta a "modo demo" y nunca llama a la API.
// (react-native-dotenv inlinea `@env` en tiempo de compilación, así que la key
// se fuerza sobre AppConfig, no sobre el módulo de entorno.)
// Esta suite prueba la ruta real contra la API; el modo demo vive en VisionAIService.demo.test.ts.
jest.mock('@shared/config', () => {
  const actual = jest.requireActual('@shared/config');
  return {
    ...actual,
    AppConfig: { ...actual.AppConfig, CLAUDE_API_KEY: 'sk-ant-test-key-real' },
  };
});

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockFrame: CameraFrame = {
  base64: 'mockbase64',
  width: 1280,
  height: 720,
  timestamp: Date.now(),
};

describe('VisionAIService', () => {
  let service: VisionAIService;

  beforeEach(() => {
    service = new VisionAIService();
    mockedAxios.post.mockResolvedValue({
      data: {
        content: [{ text: 'SEVERIDAD: OK\nDIAGNÓSTICO: Todo en orden\nACCIÓN: Continuar' }],
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockedAxios as any).isAxiosError = jest.fn().mockReturnValue(false);
  });

  it('parses severity OK as info', async () => {
    const result = await service.analyzeFrame(mockFrame, 'electrical');
    expect(result.severity).toBe('info');
  });

  it('parses CRÍTICO as critical', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        content: [{ text: 'SEVERIDAD: CRÍTICO\nDIAGNÓSTICO: Cable expuesto\nACCIÓN: Cortar corriente' }],
      },
    });
    const result = await service.analyzeFrame(mockFrame, 'electrical');
    expect(result.severity).toBe('critical');
  });

  it('parses ATENCIÓN as warning', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        content: [{ text: 'SEVERIDAD: ATENCIÓN\nDIAGNÓSTICO: Conexión suelta\nACCIÓN: Revisar terminales' }],
      },
    });
    const result = await service.analyzeFrame(mockFrame, 'electrical');
    expect(result.severity).toBe('warning');
  });

  it('extracts DIAGNÓSTICO as summary', async () => {
    const result = await service.analyzeFrame(mockFrame, 'electrical');
    expect(result.summary).toBe('Todo en orden');
  });

  it('extracts ACCIÓN as actionItems[0]', async () => {
    const result = await service.analyzeFrame(mockFrame, 'electrical');
    expect(result.actionItems[0]).toBe('Continuar');
  });

  it('does not throw with unformatted text', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { content: [{ text: 'Texto sin formato especial' }] },
    });
    const result = await service.analyzeFrame(mockFrame, 'generic');
    expect(result.summary).toBe('Texto sin formato especial');
  });

  it('id is not empty', async () => {
    const result = await service.analyzeFrame(mockFrame, 'electrical');
    expect(result.id).toBeTruthy();
  });

  it('analyzedAt is a Date', async () => {
    const result = await service.analyzeFrame(mockFrame, 'electrical');
    expect(result.analyzedAt).toBeInstanceOf(Date);
  });
});
