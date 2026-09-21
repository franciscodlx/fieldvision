import { createClient } from '@supabase/supabase-js';
import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { LoginCredentials, RegisterCredentials, AuthSession, AuthUser } from '@shared/types';
import { AppConfig } from '@shared/config';

const supabase = createClient(AppConfig.SUPABASE_URL, AppConfig.SUPABASE_ANON_KEY);

function mapSupabaseUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }, session: { access_token: string; refresh_token: string; expires_at?: number | null }): AuthSession {
  const metadata = user.user_metadata ?? {};
  const authUser: AuthUser = {
    id: user.id,
    email: user.email ?? '',
    name: (metadata.name as string | undefined) ?? (user.email?.split('@')[0] ?? 'Técnico'),
    role: (metadata.role as AuthUser['role'] | undefined) ?? 'technician',
    companyId: metadata.company_id as string | undefined,
    companyName: metadata.company_name as string | undefined,
    avatarUrl: metadata.avatar_url as string | undefined,
    createdAt: new Date(),
    plan: (metadata.plan as AuthUser['plan'] | undefined) ?? 'free',
    analysesThisMonth: (metadata.analyses_this_month as number | undefined) ?? 0,
    maxAnalysesPerMonth: (metadata.max_analyses_per_month as number | undefined) ?? 50,
  };

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : new Date(Date.now() + 3600 * 1000),
    user: authUser,
  };
}

export class SupabaseAuthRepository implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.session || !data.user) {
      throw new Error('invalid_credentials');
    }

    return mapSupabaseUser(data.user, data.session);
  }

  async register(credentials: RegisterCredentials): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          name: credentials.name,
          company_name: credentials.companyName,
          role: 'technician',
          plan: 'free',
          analyses_this_month: 0,
          max_analyses_per_month: 50,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already')) {
        throw new Error('email_already_in_use');
      }
      throw new Error('unknown');
    }

    if (!data.session || !data.user) {
      // Email confirmation required — return a partial session
      throw new Error('confirm_email');
    }

    return mapSupabaseUser(data.user, data.session);
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const { data } = await supabase.auth.getSession();
    if (!data.session || !data.session.user) return null;
    return mapSupabaseUser(data.session.user, data.session);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await this.getCurrentSession();
    return session?.user ?? null;
  }

  async refreshSession(): Promise<AuthSession | null> {
    const { data } = await supabase.auth.refreshSession();
    if (!data.session || !data.session.user) return null;
    return mapSupabaseUser(data.session.user, data.session);
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error('network_error');
  }

  onAuthStateChange(cb: (user: AuthUser | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        cb(null);
        return;
      }
      const authSession = mapSupabaseUser(session.user, session);
      cb(authSession.user);
    });
    return () => data.subscription.unsubscribe();
  }
}
