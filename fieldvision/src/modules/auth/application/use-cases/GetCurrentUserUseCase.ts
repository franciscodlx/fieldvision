import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { AuthSession } from '@shared/types';

export class GetCurrentUserUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(): Promise<AuthSession | null> {
    return this.repo.getCurrentSession();
  }
}
