import axios from 'axios';
import { VisionAIService } from '../../src/modules/vision/infrastructure/services/VisionAIService';
import {
  describeVisionError,
  MuseApiError,
  sampleFrames,
} from '../../src/modules/vision/infrastructure/services/MuseVisionClient';
import type { CameraFrame } from '../../src/shared/types';

jest.mock('@shared/config', () => {
  const actual = jest.requireActual('@shared/config');
  return {
    ...actual,
    AppConfig: {
      ...actual.AppConfig,
      VISION_PROVIDER: 'muse',
      MUSE_API_KEY: 'LLM_test-key-real',
      MUSE_VISION_MODEL: 'muse-spark-1.3',
    },
  };
});

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const frame = (i: number): CameraFrame => ({ base64: `b64_${i}`, width: 1280, height: 720, timestamp: 1000 + i });

function museReply(content: object) {
  return { data: { choices: [{ message: { content: JSON.stringify(content) } }] } };
}

interface PostedBody {
  model: string;
  response_format: { type: string };
  messages: Array<{ role: string; content: unknown }>;
}

describe('Muse Spark (VISION_PROVIDER=muse)', () => {
  let service: VisionAIService;

  beforeEach(() => {
    service = new VisionAIService();
    mockedAxios.post.mockReset();
    (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);
    mockedAxios.post.mockResolvedValue(museReply({
      severity: 'critico',
      diagnosis: 'Empalme expuesto en el tablero.',
      action: 'Desenergiza el circuito.',
      observations: ['Breaker sin etiqueta'],
      confidence: 'alta',
    }));
  });

  it('llama a la Meta Model API con json_schema y la foto como data URL', async () => {
    await service.analyzeFrame(frame(1), 'electrical');
    const [url, body, opts] = mockedAxios.post.mock.calls[0];
    expect(url).toBe('https://api.meta.ai/v1/chat/completions');
    const posted = body as PostedBody;
    expect(posted.model).toBe('muse-spark-1.3');
    expect(posted.response_format.type).toBe('json_schema');
    expect(JSON.stringify(posted.messages[1].content)).toContain('data:image/jpeg;base64,b64_1');
    expect((opts as { headers: Record<string, string> }).headers.Authorization).toBe('Bearer LLM_test-key-real');
  });

  it('mapea la respuesta estructurada a VisionAnalysis', async () => {
    const result = await service.analyzeFrame(frame(1), 'electrical');
    expect(result.severity).toBe('critical');
    expect(result.summary).toBe('Empalme expuesto en el tablero.');
    expect(result.actionItems).toEqual(['Desenergiza el circuito.']);
    expect(result.confidence).toBe(0.9);
    expect(result.details).toContain('Breaker sin etiqueta');
  });

  it('analiza un clip enviando varios fotogramas muestreados en una sola llamada', async () => {
    const frames = Array.from({ length: 20 }, (_, i) => frame(i));
    const result = await service.analyzeClip(frames, 'plumbing');
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    const posted = mockedAxios.post.mock.calls[0][1] as PostedBody;
    const parts = posted.messages[1].content as Array<{ type: string }>;
    expect(parts.filter((p) => p.type === 'image_url')).toHaveLength(8);
    expect(result.frameRef).toBe('frame_1019');
    expect(result.details).toContain('clip de 20 fotogramas');
  });

  it('lanza MuseApiError si el contenido no es JSON', async () => {
    mockedAxios.post.mockResolvedValue({ data: { choices: [{ message: { content: 'hola' } }] } });
    await expect(service.analyzeFrame(frame(1), 'generic')).rejects.toBeInstanceOf(MuseApiError);
  });
});

describe('sampleFrames', () => {
  it('devuelve todos si caben', () => {
    expect(sampleFrames([frame(1), frame(2)], 8)).toHaveLength(2);
  });
  it('incluye primero y último', () => {
    const out = sampleFrames(Array.from({ length: 30 }, (_, i) => frame(i)), 5);
    expect(out).toHaveLength(5);
    expect(out[0].timestamp).toBe(1000);
    expect(out[4].timestamp).toBe(1029);
  });
});

describe('describeVisionError', () => {
  it('traduce 401 a clave inválida', () => {
    expect(describeVisionError(new MuseApiError('x', 401))).toMatch(/clave/);
  });
  it('mensaje genérico para errores desconocidos', () => {
    expect(describeVisionError(new Error('x'))).toMatch(/Error al analizar/);
  });
});
