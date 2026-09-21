import type { CameraFrame, GlassesSession } from '@shared/types';
import type { GlassesDevice } from '../entities/GlassesDevice';

export interface IGlassesRepository {
  startSession(): Promise<GlassesSession>;
  endSession(sessionId: string): Promise<void>;
  getConnectedDevice(): Promise<GlassesDevice | null>;
  capturePhoto(): Promise<CameraFrame>;
  startVideoStream(onFrame: (frame: CameraFrame) => void): Promise<() => void>;
  stopVideoStream(): Promise<void>;
  speakText(text: string): Promise<void>;
  stopSpeaking(): Promise<void>;
  onConnectionChange(cb: (device: GlassesDevice) => void): () => void;
  onError(cb: (error: Error) => void): () => void;
}
