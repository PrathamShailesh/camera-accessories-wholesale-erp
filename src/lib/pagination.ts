import { NextRequest } from 'next/server';

// Shared query-param parsing for list endpoints. Every GET list route was
// previously unbounded (no take/skip at all), so this gives them a sane
// default cap even when the caller doesn't ask for a specific page/limit —
// "never load the complete database into the browser" applies by default,
// not just when a client opts in.
export function parsePagination(
  req: NextRequest,
  { defaultLimit = 200, maxLimit = 500 }: { defaultLimit?: number; maxLimit?: number } = {}
): { take: number; skip: number; page: number; limit: number } {
  const { searchParams } = new URL(req.url);
  const limitRaw = parseInt(searchParams.get('limit') || '', 10);
  const pageRaw = parseInt(searchParams.get('page') || '', 10);

  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, maxLimit) : defaultLimit;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { take: limit, skip: (page - 1) * limit, page, limit };
}
