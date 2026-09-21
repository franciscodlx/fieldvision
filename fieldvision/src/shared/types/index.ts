export type GlassesConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface GlassesSession {
  id: string;
  deviceId: string;
  startedAt: Date;
  status: GlassesConnectionStatus;
}

export interface CameraFrame {
  base64: string;
  width: number;
  height: number;
  timestamp: number;
}

export type AnalysisSeverity = 'info' | 'warning' | 'critical';

export interface VisionAnalysis {
  id: string;
  summary: string;
  details: string;
  severity: AnalysisSeverity;
  actionItems: string[];
  confidence: number;
  analyzedAt: Date;
  frameRef?: string;
}

export type FieldContext =
  | 'electrical' | 'plumbing' | 'hvac'
  | 'construction' | 'inspection' | 'generic';

export interface FieldVisionConfig {
  context: FieldContext;
  technicianName: string;
  companyName?: string;
  language: 'es' | 'en';
  autoCapture: boolean;
  captureIntervalMs: number;
}

export interface BillingPlan {
  id: 'starter' | 'pro' | 'enterprise' | 'free';
  name: string;
  priceUsd: number;
  maxTechnicians: number;
  maxAnalysesPerMonth: number;
}

// =====================
// AUTH TYPES
// =====================

export type AuthProvider = 'email' | 'google' | 'apple';

export type UserRole = 'technician' | 'admin' | 'owner';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  avatarUrl?: string;
  createdAt: Date;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  analysesThisMonth: number;
  maxAnalysesPerMonth: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  companyName?: string;
}

export type AuthError =
  | 'invalid_credentials'
  | 'email_already_in_use'
  | 'weak_password'
  | 'network_error'
  | 'session_expired'
  | 'unknown';
