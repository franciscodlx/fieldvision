import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class ResetPasswordUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(email: string): Promise<void> {
    if (!email || !email.includes('@')) {
      throw new Error('invalid_credentials');
    }
    await this.repo.resetPassword(email);
  }
}
