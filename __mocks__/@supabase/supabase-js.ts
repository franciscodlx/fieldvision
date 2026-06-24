export const createClient = jest.fn(() => ({
  auth: {
    signInWithPassword: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-test-1',
          email: 'test@test.com',
          user_metadata: { name: 'Test User', role: 'technician', plan: 'free' },
        },
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      },
      error: null,
    }),
    signUp: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-test-2',
          email: 'new@test.com',
          user_metadata: { name: 'New User', role: 'technician', plan: 'free' },
        },
        session: {
          access_token: 'mock-access-token-new',
          refresh_token: 'mock-refresh-token-new',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    refreshSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
  },
}));
