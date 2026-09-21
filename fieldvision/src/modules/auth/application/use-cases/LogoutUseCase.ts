import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class LogoutUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(): Promise<void> {
    await this.repo.logout();
  }
}
