import { NativeEventEmitter } from 'react-native';
import NativeMetaGlasses from '@specs/NativeMetaGlasses';
import type { SessionData, FrameData } from '@specs/NativeMetaGlasses';

export { type SessionData, type FrameData };

// Lazily initialize NativeEventEmitter to avoid module-level instantiation issues.
// Se pasa el propio TurboModule (su spec expone addListener/removeListeners);
// antes usaba NativeModules.MetaGlassesModule → undefined → crash en iOS.
let _eventEmitter: NativeEventEmitter | null = null;
function getEventEmitter(): NativeEventEmitter {
  if (!_eventEmitter) {
    _eventEmitter = new NativeEventEmitter(
      NativeMetaGlasses as unknown as ConstructorParameters<typeof NativeEventEmitter>[0]
    );
  }
  return _eventEmitter;
}

export const MetaGlassesNative = {
  startSession: (): Promise<SessionData> => NativeMetaGlasses.startSession(),
  endSession: (sessionId: string): Promise<void> => NativeMetaGlasses.endSession(sessionId),
  capturePhoto: (): Promise<FrameData> => NativeMetaGlasses.capturePhoto(),
  startVideoStream: (): Promise<void> => NativeMetaGlasses.startVideoStream(),
  stopVideoStream: (): Promise<void> => NativeMetaGlasses.stopVideoStream(),
  speakText: (text: string): Promise<void> => NativeMetaGlasses.speakText(text),
  addListener: (eventName: string, callback: (data: unknown) => void) =>
    getEventEmitter().addListener(eventName, callback),
};
