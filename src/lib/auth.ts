import crypto from 'crypto';

// Default initial passwords per user email
export const DEFAULT_USER_CREDENTIALS: Record<string, { role: string; defaultPass: string }> = {
  'sarah.admin@lenscore.com': { role: 'SUPER_ADMIN', defaultPass: 'Admin@Growth2026!' },
  'marcus.vance@lenscore.com': { role: 'MANAGER', defaultPass: 'Manager@Growth2026!' },
  'priya.erp@lenscore.com': { role: 'ERP_USER', defaultPass: 'ErpUser@Growth2026!' },
  'tariq.dxb@lenscore.com': { role: 'DEPOT_USER', defaultPass: 'Depot@Dubai2026!' },
  'arun.blr@lenscore.com': { role: 'DEPOT_USER', defaultPass: 'Depot@Bangalore2026!' },
};

/**
 * Hash password with salt using PBKDF2
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored hash (or fallback to bootstrap default if account has no hash configured)
 */
export function verifyPassword(password: string, storedHash?: string | null, email?: string): boolean {
  if (!password) return false;

  // 1. If stored hash exists in format salt:hash (Authoritative verification)
  if (storedHash && storedHash.includes(':')) {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;
    const hashToVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hashToVerify === originalHash;
  }

  // 2. If legacy plain stored password in DB (not empty)
  if (storedHash && storedHash.trim() !== '') {
    return storedHash === password;
  }

  // 3. Fallback ONLY if the user account has NO stored password hash at all (e.g. uninitialized user)
  if ((!storedHash || storedHash.trim() === '') && email && DEFAULT_USER_CREDENTIALS[email.toLowerCase()]) {
    return password === DEFAULT_USER_CREDENTIALS[email.toLowerCase()].defaultPass;
  }

  return false;
}

export { signAuthPayload, verifyAuthPayload } from './auth-token';
export type { TokenPayload } from './auth-token';
