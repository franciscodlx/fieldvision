import { useCallback, useEffect, useRef } from 'react';
import { createGlassesRepository } from '../../infrastructure/services/glassesRepositoryFactory';
import { VisionAIService } from '@modules/vision/infrastructure/services/VisionAIService';
import { ConnectGlassesUseCase } from '../../application/use-cases/ConnectGlassesUseCase';
import { AnalyzeFrameUseCase } from '@modules/vision/application/use-cases/AnalyzeFrameUseCase';
import { useAppStore } from '@shared/hooks/useAppStore';
import type { CameraFrame } from '@shared/types';

const glassesRepo = createGlassesRepository();
const visionService = new VisionAIService();
const connectUseCase = new ConnectGlassesUseCase(glassesRepo);
const analyzeUseCase = new AnalyzeFrameUseCase(glassesRepo, visionService);

export function useFieldVision() {
  const {
    connectionStatus,
    session,
    isAnalyzing,
    currentAnalysis,
    analyses,
    config,
    setConnectionStatus,
    setSession,
    setIsAnalyzing,
    addAnalysis,
  } = useAppStore();

  const autoCaptureRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isConnected = connectionStatus === 'connected';

  const stopAutoCapture = useCallback(() => {
    if (autoCaptureRef.current !== null) {
      clearInterval(autoCaptureRef.current);
      autoCaptureRef.current = null;
    }
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (isAnalyzing || !isConnected) return;
    setIsAnalyzing(true);
    try {
      const frame = await glassesRepo.capturePhoto();
      const { analysis } = await analyzeUseCase.execute({
        frame,
        context: config.context,
        speakResult: true,
      });
      addAnalysis(analysis);
    } catch {
      await glassesRepo.speakText('Error al analizar. Intenta de nuevo.').catch(() => {});
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, isConnected, config.context, setIsAnalyzing, addAnalysis]);

  const connect = useCallback(async () => {
    setConnectionStatus('connecting');
    try {
      const newSession = await connectUseCase.execute(config.technicianName);
      setSession(newSession);
      setConnectionStatus('connected');
    } catch (error) {
      console.log(error)
      setConnectionStatus('error');
    }
  }, [config.technicianName, setConnectionStatus, setSession]);

  const disconnect = useCallback(async () => {
    stopAutoCapture();
    if (session) {
      await connectUseCase.disconnect(session.id);
    }
    setSession(null);
    setConnectionStatus('disconnected');
  }, [session, setSession, setConnectionStatus, stopAutoCapture]);

  const analyzeFrame = useCallback(async (frame: CameraFrame) => {
    if (isAnalyzing || !isConnected) return;
    setIsAnalyzing(true);
    try {
      const { analysis } = await analyzeUseCase.execute({
        frame,
        context: config.context,
        speakResult: true,
      });
      addAnalysis(analysis);
    } catch {
      await glassesRepo.speakText('Error al analizar. Intenta de nuevo.').catch(() => {});
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, isConnected, config.context, setIsAnalyzing, addAnalysis]);

  const startAutoCapture = useCallback(() => {
    stopAutoCapture();
    autoCaptureRef.current = setInterval(() => {
      captureAndAnalyze();
    }, config.captureIntervalMs);
  }, [captureAndAnalyze, config.captureIntervalMs, stopAutoCapture]);

  const speak = useCallback(async (text: string) => {
    await glassesRepo.speakText(text);
  }, []);

  useEffect(() => {
    return stopAutoCapture;
  }, [stopAutoCapture]);

  return {
    connectionStatus,
    session,
    isConnected,
    isAnalyzing,
    currentAnalysis,
    analyses,
    config,
    connect,
    disconnect,
    captureAndAnalyze,
    analyzeFrame,
    startAutoCapture,
    stopAutoCapture,
    speak,
  };
}
