import { useCallback, useEffect, useRef } from 'react';
import { createGlassesRepository } from '../../infrastructure/services/glassesRepositoryFactory';
import { VisionAIService } from '@modules/vision/infrastructure/services/VisionAIService';
import { ConnectGlassesUseCase } from '../../application/use-cases/ConnectGlassesUseCase';
import { AnalyzeFrameUseCase } from '@modules/vision/application/use-cases/AnalyzeFrameUseCase';
import { useAppStore } from '@shared/hooks/useAppStore';
import { describeVisionError } from '@modules/vision/infrastructure/services/MuseVisionClient';
import type { CameraFrame } from '@shared/types';

/** Duración del clip de video que se graba del stream de los lentes antes de analizarlo. */
export const CLIP_DURATION_MS = 5000;

async function speakError(error: unknown): Promise<void> {
  console.warn('[FieldVision] análisis falló:', error);
  await glassesRepo.speakText(describeVisionError(error)).catch(() => {});
}

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
    setLastFrame,
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
      setLastFrame(frame);
      const { analysis } = await analyzeUseCase.execute({
        frame,
        context: config.context,
        speakResult: true,
      });
      addAnalysis(analysis);
    } catch (error) {
      await speakError(error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, isConnected, config.context, setIsAnalyzing, addAnalysis, setLastFrame]);

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
    } catch (error) {
      await speakError(error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, isConnected, config.context, setIsAnalyzing, addAnalysis]);

  /** Graba un clip corto del stream de video de los lentes y lo analiza como secuencia. */
  const recordAndAnalyzeClip = useCallback(async (durationMs: number = CLIP_DURATION_MS) => {
    if (isAnalyzing || !isConnected) return;
    setIsAnalyzing(true);
    const frames: CameraFrame[] = [];
    let stop: (() => void) | null = null;
    try {
      await glassesRepo.speakText('Grabando clip.').catch(() => {});
      stop = await glassesRepo.startVideoStream((frame) => {
        if (frame.base64) frames.push(frame);
      });
      await new Promise<void>((r) => setTimeout(() => r(), durationMs));
      stop();
      stop = null;
      await glassesRepo.stopVideoStream().catch(() => {});
      if (frames.length === 0) {
        await glassesRepo.speakText('No llegaron fotogramas del video. Intenta de nuevo.').catch(() => {});
        return;
      }
      setLastFrame(frames[frames.length - 1]);
      const { analysis } = await analyzeUseCase.executeClip({
        frames,
        context: config.context,
        speakResult: true,
      });
      addAnalysis(analysis);
    } catch (error) {
      await speakError(error);
    } finally {
      if (stop) {
        stop();
        await glassesRepo.stopVideoStream().catch(() => {});
      }
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, isConnected, config.context, setIsAnalyzing, addAnalysis, setLastFrame]);

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
    recordAndAnalyzeClip,
    startAutoCapture,
    stopAutoCapture,
    speak,
  };
}
