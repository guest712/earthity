export class AuthError extends Error {
  readonly code: string;

  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = 'AuthError';
    this.code = code;
  }
}

export function mapSupabaseAuthError(error: { message?: string; status?: number } | null): AuthError {
  const msg = (error?.message ?? '').toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return new AuthError('bad_credentials');
  }
  if (msg.includes('email not confirmed')) {
    return new AuthError('email_not_confirmed');
  }
  if (msg.includes('user already registered')) {
    return new AuthError('email_taken');
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return new AuthError('network');
  }

  return new AuthError('unknown', error?.message);
}
