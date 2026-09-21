import type { IGlassesRepository } from '../../domain/repositories/IGlassesRepository';
import type { GlassesSession } from '@shared/types';

export class ConnectGlassesUseCase {
  constructor(private readonly repo: IGlassesRepository) {}

  async execute(name: string): Promise<GlassesSession> {
    const session = await this.repo.startSession();
    await this.repo.speakText(`Hola ${name}. FieldVision conectado.`);
    return session;
  }

  async disconnect(sessionId: string): Promise<void> {
    await this.repo.speakText('Desconectando. Hasta luego.');
    await this.repo.endSession(sessionId);
  }
}
