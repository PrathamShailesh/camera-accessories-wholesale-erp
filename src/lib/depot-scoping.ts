import { AuthSession, isDepotScoped } from './rbac';

/**
 * Depot scoping utility for enforcing multi-depot isolation
 * DEPOT_USER role can only access data from their assigned depot
 * SUPER_ADMIN, MANAGER, ERP_USER can access all depots
 */

export interface DepotScopedQuery {
  depotId?: string | { in?: string[] };
}

export function applyDepotScoping(
  session: AuthSession | null | undefined,
  baseQuery: any = {}
): any {
  // If user is not depot-scoped, return base query unchanged
  if (!isDepotScoped(session) || !session?.assignedDepotId) {
    return baseQuery;
  }

  // For depot users, filter by their assigned depot
  return {
    ...baseQuery,
    depotId: session.assignedDepotId,
  };
}

export function applyDepotScopingToWhere(
  session: AuthSession | null | undefined,
  whereClause: any = {}
): any {
  // If user is not depot-scoped, return where clause unchanged
  if (!isDepotScoped(session) || !session?.assignedDepotId) {
    return whereClause;
  }

  // For depot users, add depot filter
  return {
    ...whereClause,
    depotId: session.assignedDepotId,
  };
}

export function canAccessDepot(
  session: AuthSession | null | undefined,
  depotId: string
): boolean {
  // Super admins, managers, and ERP users can access any depot
  if (!isDepotScoped(session)) {
    return true;
  }

  // Depot users can only access their assigned depot
  return session?.assignedDepotId === depotId;
}

export function filterDepotsByAccess(
  session: AuthSession | null | undefined,
  depots: any[]
): any[] {
  // Super admins, managers, and ERP users can see all depots
  if (!isDepotScoped(session)) {
    return depots;
  }

  // Depot users can only see their assigned depot
  return depots.filter((d) => d.id === session?.assignedDepotId);
}
