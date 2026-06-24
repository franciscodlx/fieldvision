import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface SessionData {
  id: string;
  deviceId: string;
  startedAt: string;
  firmwareVersion: string;
  model: string;
}

export interface FrameData {
  base64: string;
  width: number;
  height: number;
  timestamp: number;
}

export interface Spec extends TurboModule {
  startSession(): Promise<SessionData>;
  endSession(sessionId: string): Promise<void>;
  capturePhoto(): Promise<FrameData>;
  startVideoStream(): Promise<void>;
  stopVideoStream(): Promise<void>;
  speakText(text: string): Promise<void>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeMetaGlasses');
