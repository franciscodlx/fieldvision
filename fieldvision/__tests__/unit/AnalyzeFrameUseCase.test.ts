import { AnalyzeFrameUseCase } from '../../src/modules/vision/application/use-cases/AnalyzeFrameUseCase';
import type { IGlassesRepository } from '../../src/modules/glasses/domain/repositories/IGlassesRepository';
import type { VisionAIService } from '../../src/modules/vision/infrastructure/services/VisionAIService';
import type { CameraFrame, VisionAnalysis } from '../../src/shared/types';

const mockAnalysis: VisionAnalysis = {
  id: 'test-id',
  summary: 'Todo en orden',
  details: 'SEVERIDAD: OK\nDIAGNÓSTICO: Todo en orden\nACCIÓN: Continuar',
  severity: 'info',
  actionItems: ['Continuar'],
  confidence: 0.85,
  analyzedAt: new Date(),
};

const mockFrame: CameraFrame = {
  base64: 'mockbase64',
  width: 1280,
  height: 720,
  timestamp: Date.now(),
};

describe('AnalyzeFrameUseCase', () => {
  let mockRepo: jest.Mocked<IGlassesRepository>;
  let mockVision: jest.Mocked<VisionAIService>;
  let useCase: AnalyzeFrameUseCase;

  beforeEach(() => {
    mockRepo = {
      startSession: jest.fn(),
      endSession: jest.fn(),
      getConnectedDevice: jest.fn(),
      capturePhoto: jest.fn(),
      startVideoStream: jest.fn(),
      stopVideoStream: jest.fn(),
      speakText: jest.fn().mockResolvedValue(undefined),
      stopSpeaking: jest.fn(),
      onConnectionChange: jest.fn(),
      onError: jest.fn(),
    };
    mockVision = {
      analyzeFrame: jest.fn().mockResolvedValue(mockAnalysis),
    } as unknown as jest.Mocked<VisionAIService>;
    useCase = new AnalyzeFrameUseCase(mockRepo, mockVision);
  });

  it('calls visionService.analyzeFrame', async () => {
    await useCase.execute({ frame: mockFrame, context: 'electrical' });
    expect(mockVision.analyzeFrame).toHaveBeenCalledWith(mockFrame, 'electrical');
  });

  it('calls speakText when speakResult is true', async () => {
    await useCase.execute({ frame: mockFrame, context: 'electrical', speakResult: true });
    expect(mockRepo.speakText).toHaveBeenCalled();
  });

  it('does not call speakText when speakResult is false', async () => {
    await useCase.execute({ frame: mockFrame, context: 'electrical', speakResult: false });
    expect(mockRepo.speakText).not.toHaveBeenCalled();
  });

  it('uses ALERTA CRÍTICA prefix for critical severity', async () => {
    mockVision.analyzeFrame.mockResolvedValue({ ...mockAnalysis, severity: 'critical', summary: 'Cable expuesto' });
    const { spokenText } = await useCase.execute({ frame: mockFrame, context: 'electrical' });
    expect(spokenText).toMatch(/^ALERTA CRÍTICA/);
  });

  it('uses Atención prefix for warning severity', async () => {
    mockVision.analyzeFrame.mockResolvedValue({ ...mockAnalysis, severity: 'warning', summary: 'Revisar' });
    const { spokenText } = await useCase.execute({ frame: mockFrame, context: 'electrical' });
    expect(spokenText).toMatch(/^Atención/);
  });

  it('includes actionItem in spoken text', async () => {
    const { spokenText } = await useCase.execute({ frame: mockFrame, context: 'electrical' });
    expect(spokenText).toContain('Continuar');
  });

  it('returns the analysis', async () => {
    const { analysis } = await useCase.execute({ frame: mockFrame, context: 'electrical' });
    expect(analysis).toBe(mockAnalysis);
  });

  it('speakResult defaults to true', async () => {
    await useCase.execute({ frame: mockFrame, context: 'electrical' });
    expect(mockRepo.speakText).toHaveBeenCalled();
  });
});
