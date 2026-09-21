import type { GlassesConnectionStatus, GlassesSession } from '@shared/types';

interface GlassesDeviceProps {
  id: string;
  model: string;
  firmwareVersion: string;
  status: GlassesConnectionStatus;
  session: GlassesSession | null;
}

export class GlassesDevice {
  private constructor(private readonly props: GlassesDeviceProps) {}

  static create(params: { id: string; model: string; firmwareVersion: string }): GlassesDevice {
    return new GlassesDevice({
      ...params,
      status: 'disconnected',
      session: null,
    });
  }

  get id(): string { return this.props.id; }
  get model(): string { return this.props.model; }
  get firmwareVersion(): string { return this.props.firmwareVersion; }
  get status(): GlassesConnectionStatus { return this.props.status; }
  get session(): GlassesSession | null { return this.props.session; }
  get isConnected(): boolean { return this.props.status === 'connected'; }
  get isReady(): boolean { return this.isConnected && this.props.session !== null; }

  withStatus(status: GlassesConnectionStatus): GlassesDevice {
    return new GlassesDevice({ ...this.props, status });
  }

  withSession(session: GlassesSession): GlassesDevice {
    return new GlassesDevice({ ...this.props, session, status: 'connected' });
  }
}
