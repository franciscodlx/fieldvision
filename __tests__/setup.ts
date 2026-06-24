// Mock del TurboModule
jest.mock('@specs/NativeMetaGlasses', () => ({
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

// Mock de NativeEventEmitter
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return jest.fn().mockImplementation(() => ({
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    removeAllListeners: jest.fn(),
  }));
});

// Mock de global.fetch para Claude API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        content: [{ text: 'SEVERIDAD: OK\nDIAGNÓSTICO: Todo en orden\nACCIÓN: Continuar' }],
      }),
  })
) as unknown as typeof fetch;
