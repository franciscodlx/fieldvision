import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { RegisterCredentials, AuthSession } from '@shared/types';

export class RegisterUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(credentials: RegisterCredentials): Promise<AuthSession> {
    if (!credentials.email || !credentials.email.includes('@')) {
      throw new Error('email_already_in_use');
    }
    if (!credentials.password || credentials.password.length < 8) {
      throw new Error('weak_password');
    }
    if (!credentials.name || credentials.name.trim().length < 2) {
      throw new Error('invalid_credentials');
    }
    return this.repo.register(credentials);
  }
}
