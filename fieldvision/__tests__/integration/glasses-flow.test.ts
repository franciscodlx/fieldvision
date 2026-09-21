jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return jest.fn().mockImplementation(() => ({
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    removeAllListeners: jest.fn(),
  }));
});

jest.mock('@specs/NativeMetaGlasses', () => ({
  __esModule: true,
  default: {
    startSession: jest.fn(() =>
      Promise.resolve({
        id: 'session-test-1',
        deviceId: 'device-test-1',
        startedAt: new Date().toISOString(),
        firmwareVersion: '1.0.0-mock',
        model: 'Ray-Ban Meta Mock',
      })
    ),
    endSession: jest.fn(() => Promise.resolve()),
    capturePhoto: jest.fn(() =>
      Promise.resolve({
        base64: 'mockbase64data',
        width: 1280,
        height: 720,
        timestamp: Date.now(),
      })
    ),
    startVideoStream: jest.fn(() => Promise.resolve()),
    stopVideoStream: jest.fn(() => Promise.resolve()),
    speakText: jest.fn(() => Promise.resolve()),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({
    data: {
      content: [{ text: 'SEVERIDAD: OK\nDIAGNÓSTICO: Todo en orden\nACCIÓN: Continuar' }],
    },
  }),
  isAxiosError: jest.fn().mockReturnValue(false),
  default: {
    post: jest.fn().mockResolvedValue({
      data: {
        content: [{ text: 'SEVERIDAD: OK\nDIAGNÓSTICO: Todo en orden\nACCIÓN: Continuar' }],
      },
    }),
    isAxiosError: jest.fn().mockReturnValue(false),
  },
}));

import { MetaGlassesRepository } from '../../src/modules/glasses/infrastructure/services/MetaGlassesRepository';
import { ConnectGlassesUseCase } from '../../src/modules/glasses/application/use-cases/ConnectGlassesUseCase';
import { VisionAIService } from '../../src/modules/vision/infrastructure/services/VisionAIService';
import { AnalyzeFrameUseCase } from '../../src/modules/vision/application/use-cases/AnalyzeFrameUseCase';
import type { CameraFrame } from '../../src/shared/types';

describe('Glasses integration flow', () => {
  let repo: MetaGlassesRepository;
  let connectUseCase: ConnectGlassesUseCase;
  let visionService: VisionAIService;
  let analyzeUseCase: AnalyzeFrameUseCase;

  beforeEach(() => {
    repo = new MetaGlassesRepository();
    connectUseCase = new ConnectGlassesUseCase(repo);
    visionService = new VisionAIService();
    analyzeUseCase = new AnalyzeFrameUseCase(repo, visionService);
  });

  it('connect returns a valid session', async () => {
    const session = await connectUseCase.execute('Juan');
    expect(session.id).toBeTruthy();
    expect(session.deviceId).toBeTruthy();
    expect(session.startedAt).toBeInstanceOf(Date);
  });

  it('capturePhoto returns a valid CameraFrame', async () => {
    await connectUseCase.execute('Juan');
    const frame = await repo.capturePhoto();
    expect(frame.base64).toBeTruthy();
    expect(frame.width).toBeGreaterThan(0);
    expect(frame.height).toBeGreaterThan(0);
    expect(typeof frame.timestamp).toBe('number');
  });

  it('analyzeUseCase returns a VisionAnalysis', async () => {
    const frame: CameraFrame = { base64: 'mockbase64', width: 1280, height: 720, timestamp: Date.now() };
    const { analysis } = await analyzeUseCase.execute({ frame, context: 'electrical' });
    expect(analysis.id).toBeTruthy();
    expect(analysis.severity).toBeTruthy();
    expect(analysis.summary).toBeTruthy();
  });

  it('speakText was called after connect', async () => {
    const speakSpy = jest.spyOn(repo, 'speakText');
    await connectUseCase.execute('Juan');
    expect(speakSpy).toHaveBeenCalledWith(expect.stringContaining('Juan'));
  });

  it('disconnect resolves without error', async () => {
    const session = await connectUseCase.execute('Juan');
    await expect(connectUseCase.disconnect(session.id)).resolves.not.toThrow();
  });
});
