import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client to prevent too many connections.
//
// VERCEL SERVERLESS NOTE:
// Each function invocation can create a new PrismaClient. Without connection_limit=1
// the default pool of ~10 connections per invocation exhausts the DB under any real load.
// The DATABASE_URL must include ?connection_limit=1&pgbouncer=true (PgBouncer/Supabase pooler).
// This code also enforces limit=1 via datasourceUrl as a safety net in case the env var
// does not already carry the query params.
//
// CRITICAL: Use globalThis in ALL environments. In production (Vercel), a warm container
// re-uses the same Node.js process for multiple requests, but module scope may be
// re-evaluated between invocations in some edge cases. Without globalThis, multiple
// PrismaClient instances can accumulate inside a single container — each holding its own
// connection — rapidly exhausting the pool and causing P2024 errors.

function buildDatasourceUrl() {
  const url = process.env.DATABASE_URL || '';
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', '1');
    }
    if (!parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true');
    }
    return parsed.toString();
  } catch {
    // URL parsing failed — return as-is and let Prisma surface the error
    return url;
  }
}

if (!globalThis.__prisma) {
  globalThis.__prisma = new PrismaClient({
    datasourceUrl: buildDatasourceUrl(),
    ...(process.env.NODE_ENV !== 'production' && { log: ['error', 'warn'] }),
  });
}

const prisma = globalThis.__prisma;
export default prisma;
