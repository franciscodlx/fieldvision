import type { AuthUser, UserRole, BillingPlan } from '@shared/types';

interface AuthUserProps {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  avatarUrl?: string;
  createdAt: Date;
  plan: BillingPlan['id'];
  analysesThisMonth: number;
  maxAnalysesPerMonth: number;
}

export class AuthUserEntity {
  private constructor(private readonly props: AuthUserProps) {}

  static create(params: Omit<AuthUserProps, 'createdAt' | 'analysesThisMonth'> & Partial<Pick<AuthUserProps, 'createdAt' | 'analysesThisMonth'>>): AuthUserEntity {
    return new AuthUserEntity({
      ...params,
      createdAt: params.createdAt ?? new Date(),
      analysesThisMonth: params.analysesThisMonth ?? 0,
    });
  }

  static fromDTO(dto: AuthUser): AuthUserEntity {
    return new AuthUserEntity({
      ...dto,
      createdAt: dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt),
    });
  }

  get id(): string { return this.props.id; }
  get email(): string { return this.props.email; }
  get name(): string { return this.props.name; }
  get role(): UserRole { return this.props.role; }
  get companyId(): string | undefined { return this.props.companyId; }
  get companyName(): string | undefined { return this.props.companyName; }
  get avatarUrl(): string | undefined { return this.props.avatarUrl; }
  get createdAt(): Date { return this.props.createdAt; }
  get plan(): BillingPlan['id'] { return this.props.plan; }
  get analysesThisMonth(): number { return this.props.analysesThisMonth; }
  get maxAnalysesPerMonth(): number { return this.props.maxAnalysesPerMonth; }

  get isAdmin(): boolean { return this.props.role === 'admin' || this.props.role === 'owner'; }
  get hasReachedLimit(): boolean {
    return this.props.maxAnalysesPerMonth !== -1 &&
      this.props.analysesThisMonth >= this.props.maxAnalysesPerMonth;
  }
  get remainingAnalyses(): number {
    if (this.props.maxAnalysesPerMonth === -1) return Infinity;
    return Math.max(0, this.props.maxAnalysesPerMonth - this.props.analysesThisMonth);
  }

  toDTO(): AuthUser {
    return { ...this.props };
  }

  withIncrementedAnalysis(): AuthUserEntity {
    return new AuthUserEntity({
      ...this.props,
      analysesThisMonth: this.props.analysesThisMonth + 1,
    });
  }
}
