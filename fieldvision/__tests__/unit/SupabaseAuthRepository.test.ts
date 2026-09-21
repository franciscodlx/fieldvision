import { SupabaseAuthRepository } from '../../src/modules/auth/infrastructure/services/SupabaseAuthRepository';

describe('SupabaseAuthRepository', () => {
  let repo: SupabaseAuthRepository;

  beforeEach(() => {
    repo = new SupabaseAuthRepository();
  });

  it('login returns AuthSession', async () => {
    const session = await repo.login({ email: 'test@test.com', password: 'password123' });
    expect(session.accessToken).toBe('mock-access-token');
    expect(session.user.email).toBe('test@test.com');
    expect(session.user.id).toBe('user-test-1');
  });

  it('register returns AuthSession', async () => {
    const session = await repo.register({
      email: 'new@test.com', password: 'password123', name: 'New User',
    });
    expect(session.accessToken).toBe('mock-access-token-new');
    expect(session.user.name).toBe('New User');
  });

  it('logout resolves', async () => {
    await expect(repo.logout()).resolves.not.toThrow();
  });

  it('getCurrentSession returns null when no session', async () => {
    const session = await repo.getCurrentSession();
    expect(session).toBeNull();
  });

  it('onAuthStateChange returns unsubscribe function', () => {
    const unsubscribe = repo.onAuthStateChange(jest.fn());
    expect(typeof unsubscribe).toBe('function');
  });
});
