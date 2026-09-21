import type { IGlassesRepository } from '../../domain/repositories/IGlassesRepository';
import type { CameraFrame, GlassesSession } from '@shared/types';
import { GlassesDevice } from '../../domain/entities/GlassesDevice';

// 1x1 JPEG de relleno para los frames simulados.
const MOCK_FRAME_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH';

let idCounter = 0;
function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

/**
 * Repositorio de lentes 100% en JS para modo desarrollo/mock.
 * Simula la conexión, captura y TTS SIN llamar al TurboModule nativo
 * (que en iOS Nueva Arquitectura crashea con SIGSEGV).
 * Se usa automáticamente mientras META_APP_TOKEN sea placeholder.
 * El módulo nativo se reactiva con createGlassesRepository() cuando llegue el SDK real de Meta.
 */
export class MockGlassesRepository implements IGlassesRepository {
  private currentDevice: GlassesDevice | null = null;
  private streamTimer: ReturnType<typeof setInterval> | null = null;
  private connectionListeners = new Set<(device: GlassesDevice) => void>();

  async startSession(): Promise<GlassesSession> {
    // Simula el handshake de conexión (~0.5 s).
    await new Promise<void>((r) => setTimeout(() => r(), 500));
    const deviceId = makeId('device');
    const session: GlassesSession = {
      id: makeId('session'),
      deviceId,
      startedAt: new Date(),
      status: 'connected',
    };
    this.currentDevice = GlassesDevice.create({
      id: deviceId,
      model: 'Ray-Ban Meta Smart Glasses (Mock JS)',
      firmwareVersion: '1.0.0-mock',
    }).withSession(session);
    this.connectionListeners.forEach((cb) => cb(this.currentDevice as GlassesDevice));
    return session;
  }

  async endSession(_sessionId: string): Promise<void> {
    await this.stopVideoStream();
    if (this.currentDevice) {
      const disconnected = this.currentDevice.withStatus('disconnected');
      this.currentDevice = null;
      this.connectionListeners.forEach((cb) => cb(disconnected));
    }
  }

  async getConnectedDevice(): Promise<GlassesDevice | null> {
    return this.currentDevice;
  }

  async capturePhoto(): Promise<CameraFrame> {
    return {
      base64: MOCK_FRAME_BASE64,
      width: 1280,
      height: 720,
      timestamp: Date.now(),
    };
  }

  async startVideoStream(onFrame: (frame: CameraFrame) => void): Promise<() => void> {
    this.stopStreamTimer();
    this.streamTimer = setInterval(() => {
      onFrame({
        base64: MOCK_FRAME_BASE64,
        width: 1280,
        height: 720,
        timestamp: Date.now(),
      });
    }, 2000);
    return () => this.stopStreamTimer();
  }

  async stopVideoStream(): Promise<void> {
    this.stopStreamTimer();
  }

  // TTS no disponible en mock JS puro (el nativo crashea). No-op silencioso.
  async speakText(_text: string): Promise<void> {}

  async stopSpeaking(): Promise<void> {}

  onConnectionChange(cb: (device: GlassesDevice) => void): () => void {
    this.connectionListeners.add(cb);
    return () => {
      this.connectionListeners.delete(cb);
    };
  }

  onError(_cb: (error: Error) => void): () => void {
    return () => {};
  }

  private stopStreamTimer(): void {
    if (this.streamTimer !== null) {
      clearInterval(this.streamTimer);
      this.streamTimer = null;
    }
  }
}
