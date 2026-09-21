import { AuthUserEntity } from '../../src/modules/auth/domain/entities/AuthUserEntity';

describe('AuthUserEntity', () => {
  const baseParams = {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Juan García',
    role: 'technician' as const,
    plan: 'free' as const,
    maxAnalysesPerMonth: 50,
  };

  it('creates with default values', () => {
    const user = AuthUserEntity.create(baseParams);
    expect(user.id).toBe('user-1');
    expect(user.analysesThisMonth).toBe(0);
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('isAdmin is false for technician', () => {
    const user = AuthUserEntity.create(baseParams);
    expect(user.isAdmin).toBe(false);
  });

  it('isAdmin is true for admin', () => {
    const user = AuthUserEntity.create({ ...baseParams, role: 'admin' });
    expect(user.isAdmin).toBe(true);
  });

  it('hasReachedLimit when analyses >= max', () => {
    const user = AuthUserEntity.create({ ...baseParams, analysesThisMonth: 50 });
    expect(user.hasReachedLimit).toBe(true);
  });

  it('hasReachedLimit is false for enterprise (unlimited)', () => {
    const user = AuthUserEntity.create({ ...baseParams, plan: 'enterprise', maxAnalysesPerMonth: -1 });
    expect(user.hasReachedLimit).toBe(false);
  });

  it('withIncrementedAnalysis returns new instance', () => {
    const user = AuthUserEntity.create(baseParams);
    const incremented = user.withIncrementedAnalysis();
    expect(incremented.analysesThisMonth).toBe(1);
    expect(user.analysesThisMonth).toBe(0);
  });

  it('remainingAnalyses calculates correctly', () => {
    const user = AuthUserEntity.create({ ...baseParams, analysesThisMonth: 30 });
    expect(user.remainingAnalyses).toBe(20);
  });
});
