import { GlassesDevice } from '../../src/modules/glasses/domain/entities/GlassesDevice';
import type { GlassesSession } from '../../src/shared/types';

describe('GlassesDevice', () => {
  const params = { id: 'device-1', model: 'Ray-Ban Meta', firmwareVersion: '1.0.0' };

  it('creates with disconnected status', () => {
    const device = GlassesDevice.create(params);
    expect(device.status).toBe('disconnected');
  });

  it('isConnected is false when disconnected', () => {
    const device = GlassesDevice.create(params);
    expect(device.isConnected).toBe(false);
  });

  it('withStatus creates new instance without mutating', () => {
    const device = GlassesDevice.create(params);
    const connected = device.withStatus('connected');
    expect(connected.status).toBe('connected');
    expect(device.status).toBe('disconnected');
  });

  it('withSession creates connected device with session', () => {
    const session: GlassesSession = {
      id: 'sess-1',
      deviceId: 'device-1',
      startedAt: new Date(),
      status: 'connected',
    };
    const device = GlassesDevice.create(params).withSession(session);
    expect(device.status).toBe('connected');
    expect(device.session).toBe(session);
  });

  it('isReady is true when connected and has session', () => {
    const session: GlassesSession = {
      id: 'sess-1',
      deviceId: 'device-1',
      startedAt: new Date(),
      status: 'connected',
    };
    const device = GlassesDevice.create(params).withSession(session);
    expect(device.isReady).toBe(true);
  });

  it('isReady is false when connected but no session', () => {
    const device = GlassesDevice.create(params).withStatus('connected');
    expect(device.isReady).toBe(false);
  });
});
