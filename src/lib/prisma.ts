import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  prismaHealthy: boolean;
  prismaLastCheck: number;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Track whether the DB is reachable so we can skip slow queries
// and fall back to dataStore immediately.
if (globalForPrisma.prismaHealthy === undefined) {
  globalForPrisma.prismaHealthy = true; // optimistic
  globalForPrisma.prismaLastCheck = 0;
}

const HEALTH_RECHECK_MS = 30_000; // re-probe DB every 30 seconds after a failure

/**
 * Returns true if the database is known to be unreachable.
 * After a failure, it stays "unhealthy" for 30 seconds to avoid
 * repeating slow connection attempts on every request.
 */
export function isDbOffline(): boolean {
  if (globalForPrisma.prismaHealthy) return false;
  // If enough time has passed since the last failure, allow one re-probe
  if (Date.now() - globalForPrisma.prismaLastCheck > HEALTH_RECHECK_MS) {
    globalForPrisma.prismaHealthy = true; // allow re-probe
    return false;
  }
  return true;
}

export function markDbOffline(): void {
  globalForPrisma.prismaHealthy = false;
  globalForPrisma.prismaLastCheck = Date.now();
}

export function markDbOnline(): void {
  globalForPrisma.prismaHealthy = true;
}

/**
 * Execute a Prisma operation with a timeout.
 * If the database is known to be offline, rejects immediately.
 * If the operation exceeds `timeoutMs`, rejects with a timeout error
 * and marks the DB as offline.
 */
export async function withDbTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs = 3000
): Promise<T> {
  if (isDbOffline()) {
    throw new Error('Database is offline (cached)');
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      markDbOffline();
      reject(new Error(`Database query timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    operation()
      .then((result) => {
        clearTimeout(timer);
        markDbOnline();
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        // If it's a connection error, mark offline
        const msg = String(err?.message || '');
        if (
          msg.includes('connect') ||
          msg.includes('ECONNREFUSED') ||
          msg.includes('P1001') ||
          msg.includes('P1000') ||
          msg.includes('P1003') ||
          msg.includes('timed out') ||
          msg.includes('timeout')
        ) {
          markDbOffline();
        }
        reject(err);
      });
  });
}
