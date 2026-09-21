import { useCallback, useEffect } from 'react';
import { useAppStore } from '@shared/hooks/useAppStore';
import { createAuthRepository } from '../../infrastructure/services/authRepositoryFactory';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { RegisterUseCase } from '../../application/use-cases/RegisterUseCase';
import { LogoutUseCase } from '../../application/use-cases/LogoutUseCase';
import { GetCurrentUserUseCase } from '../../application/use-cases/GetCurrentUserUseCase';
import { ResetPasswordUseCase } from '../../application/use-cases/ResetPasswordUseCase';
import type { LoginCredentials, RegisterCredentials, AuthError } from '@shared/types';

const authRepo = createAuthRepository();
const loginUseCase = new LoginUseCase(authRepo);
const registerUseCase = new RegisterUseCase(authRepo);
const logoutUseCase = new LogoutUseCase(authRepo);
const getCurrentUserUseCase = new GetCurrentUserUseCase(authRepo);
const resetPasswordUseCase = new ResetPasswordUseCase(authRepo);

function mapError(err: unknown): AuthError {
  const message = err instanceof Error ? err.message : 'unknown';
  const knownErrors: AuthError[] = [
    'invalid_credentials', 'email_already_in_use', 'weak_password',
    'network_error', 'session_expired',
  ];
  return knownErrors.includes(message as AuthError) ? (message as AuthError) : 'unknown';
}

export function useAuth() {
  const {
    authUser,
    authSession,
    isAuthenticated,
    isLoadingAuth,
    setAuthUser,
    setAuthSession,
    setIsLoadingAuth,
    logout: logoutStore,
  } = useAppStore();

  // Bootstrap: check for existing session on mount
  useEffect(() => {
    let cancelled = false;
    getCurrentUserUseCase.execute().then((session) => {
      if (cancelled) return;
      if (session) {
        setAuthSession(session);
        setAuthUser(session.user);
      }
      setIsLoadingAuth(false);
    }).catch(() => {
      if (!cancelled) setIsLoadingAuth(false);
    });

    // Listen to auth state changes
    const unsubscribe = authRepo.onAuthStateChange((user) => {
      if (cancelled) return;
      if (user) {
        setAuthUser(user);
      } else {
        logoutStore();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthError | null> => {
    try {
      const session = await loginUseCase.execute(credentials);
      setAuthSession(session);
      setAuthUser(session.user);
      return null;
    } catch (err) {
      return mapError(err);
    }
  }, [setAuthSession, setAuthUser]);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<AuthError | null> => {
    try {
      const session = await registerUseCase.execute(credentials);
      setAuthSession(session);
      setAuthUser(session.user);
      return null;
    } catch (err) {
      return mapError(err);
    }
  }, [setAuthSession, setAuthUser]);

  const logout = useCallback(async (): Promise<void> => {
    await logoutUseCase.execute().catch(() => {});
    logoutStore();
  }, [logoutStore]);

  const resetPassword = useCallback(async (email: string): Promise<AuthError | null> => {
    try {
      await resetPasswordUseCase.execute(email);
      return null;
    } catch (err) {
      return mapError(err);
    }
  }, []);

  return {
    authUser,
    authSession,
    isAuthenticated,
    isLoadingAuth,
    login,
    register,
    logout,
    resetPassword,
  };
}
