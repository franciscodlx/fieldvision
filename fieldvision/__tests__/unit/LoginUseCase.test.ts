import { LoginUseCase } from '../../src/modules/auth/application/use-cases/LoginUseCase';
import type { IAuthRepository } from '../../src/modules/auth/domain/repositories/IAuthRepository';
import type { AuthSession } from '../../src/shared/types';

const mockSession: AuthSession = {
  accessToken: 'token',
  refreshToken: 'refresh',
  expiresAt: new Date(),
  user: {
    id: 'u1', email: 'test@test.com', name: 'Test', role: 'technician',
    createdAt: new Date(), plan: 'free', analysesThisMonth: 0, maxAnalysesPerMonth: 50,
  },
};

describe('LoginUseCase', () => {
  let mockRepo: jest.Mocked<IAuthRepository>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    mockRepo = {
      login: jest.fn().mockResolvedValue(mockSession),
      register: jest.fn(), logout: jest.fn(), getCurrentSession: jest.fn(),
      getCurrentUser: jest.fn(), refreshSession: jest.fn(), resetPassword: jest.fn(),
      onAuthStateChange: jest.fn(),
    } as jest.Mocked<IAuthRepository>;
    useCase = new LoginUseCase(mockRepo);
  });

  it('calls repo.login with valid credentials', async () => {
    await useCase.execute({ email: 'test@test.com', password: 'password123' });
    expect(mockRepo.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
  });

  it('throws with empty email', async () => {
    await expect(useCase.execute({ email: '', password: 'password123' }))
      .rejects.toThrow('invalid_credentials');
  });

  it('throws with invalid email', async () => {
    await expect(useCase.execute({ email: 'invalid', password: 'password123' }))
      .rejects.toThrow('invalid_credentials');
  });

  it('throws with short password', async () => {
    await expect(useCase.execute({ email: 'test@test.com', password: '123' }))
      .rejects.toThrow('invalid_credentials');
  });

  it('returns AuthSession on success', async () => {
    const result = await useCase.execute({ email: 'test@test.com', password: 'password123' });
    expect(result).toBe(mockSession);
  });
});
