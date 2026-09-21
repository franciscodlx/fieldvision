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

export interface IntegrationStatus {
  configured: boolean;
  /** 0 unavailable · 1 available · 2 registering · 3 registered */
  registrationState: number;
  deviceCount: number;
  /** 'granted' | 'denied' | 'unknown' */
  cameraPermission: string;
  sessionActive: boolean;
  /** Texto legible con el estado de cada par de lentes que ve Meta AI. */
  deviceDetail: string;
}

export interface Spec extends TurboModule {
  /** Qué falta para poder capturar: registro, permiso, lentes a la vista. */
  getIntegrationStatus(): Promise<IntegrationStatus>;
  /** Abre la app de Meta AI para que el usuario autorice FieldVision. */
  registerWithMetaAI(): Promise<void>;
  /** Pide el permiso de cámara de los lentes. Devuelve 'granted' | 'denied'. */
  requestCameraPermission(): Promise<string>;
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
