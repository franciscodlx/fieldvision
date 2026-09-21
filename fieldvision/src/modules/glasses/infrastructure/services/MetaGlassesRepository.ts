import type { IGlassesRepository } from '../../domain/repositories/IGlassesRepository';
import type { CameraFrame, GlassesSession } from '@shared/types';
import { GlassesDevice } from '../../domain/entities/GlassesDevice';
import { MetaGlassesNative } from '../native/MetaGlassesNative';

export class MetaGlassesRepository implements IGlassesRepository {
  private currentDevice: GlassesDevice | null = null;

  async startSession(): Promise<GlassesSession> {
    const data = await MetaGlassesNative.startSession();
    const session: GlassesSession = {
      id: data.id,
      deviceId: data.deviceId,
      startedAt: new Date(data.startedAt),
      status: 'connected',
    };
    this.currentDevice = GlassesDevice.create({
      id: data.deviceId,
      model: data.model,
      firmwareVersion: data.firmwareVersion,
    }).withSession(session);
    return session;
  }

  async endSession(sessionId: string): Promise<void> {
    await MetaGlassesNative.endSession(sessionId);
    this.currentDevice = null;
  }

  async getConnectedDevice(): Promise<GlassesDevice | null> {
    return this.currentDevice;
  }

  async capturePhoto(): Promise<CameraFrame> {
    const data = await MetaGlassesNative.capturePhoto();
    return {
      base64: data.base64,
      width: data.width,
      height: data.height,
      timestamp: data.timestamp,
    };
  }

  async startVideoStream(onFrame: (frame: CameraFrame) => void): Promise<() => void> {
    await MetaGlassesNative.startVideoStream();
    const sub = MetaGlassesNative.addListener('onVideoFrame', (data: unknown) => {
      const frameData = data as CameraFrame;
      onFrame(frameData);
    });
    return () => sub.remove();
  }

  async stopVideoStream(): Promise<void> {
    await MetaGlassesNative.stopVideoStream();
  }

  async speakText(text: string): Promise<void> {
    await MetaGlassesNative.speakText(text);
  }

  async stopSpeaking(): Promise<void> {
    // TTS stop — not in TurboModule spec yet, no-op for now
  }

  onConnectionChange(cb: (device: GlassesDevice) => void): () => void {
    const startSub = MetaGlassesNative.addListener('onSessionStarted', (data: unknown) => {
      const sessionData = data as { id: string; deviceId: string; startedAt: string; firmwareVersion: string; model: string };
      const session: GlassesSession = {
        id: sessionData.id,
        deviceId: sessionData.deviceId,
        startedAt: new Date(sessionData.startedAt),
        status: 'connected',
      };
      const device = GlassesDevice.create({
        id: sessionData.deviceId,
        model: sessionData.model,
        firmwareVersion: sessionData.firmwareVersion,
      }).withSession(session);
      this.currentDevice = device;
      cb(device);
    });

    const endSub = MetaGlassesNative.addListener('onSessionEnded', (_data: unknown) => {
      if (this.currentDevice) {
        const disconnected = this.currentDevice.withStatus('disconnected');
        this.currentDevice = null;
        cb(disconnected);
      }
    });

    return () => {
      startSub.remove();
      endSub.remove();
    };
  }

  onError(cb: (error: Error) => void): () => void {
    const sub = MetaGlassesNative.addListener('onError', (data: unknown) => {
      const errorData = data as { message: string };
      cb(new Error(errorData.message));
    });
    return () => sub.remove();
  }
}
