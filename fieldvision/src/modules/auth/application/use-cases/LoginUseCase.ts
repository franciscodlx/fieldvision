import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { LoginCredentials, AuthSession } from '@shared/types';

export class LoginUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<AuthSession> {
    if (!credentials.email || !credentials.email.includes('@')) {
      throw new Error('invalid_credentials');
    }
    if (!credentials.password || credentials.password.length < 6) {
      throw new Error('invalid_credentials');
    }
    return this.repo.login(credentials);
  }
}
