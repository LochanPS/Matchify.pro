import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client to prevent too many connections.
//
// VERCEL SERVERLESS NOTE:
// Each function invocation can create a new PrismaClient. Without connection_limit=1
// the default pool of ~10 connections per invocation exhausts the DB under any real load.
// The DATABASE_URL must include ?connection_limit=1&pgbouncer=true (PgBouncer/Supabase pooler).
// This code also enforces limit=1 via datasourceUrl as a safety net in case the env var
// does not already carry the query params.
let prisma;

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

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasourceUrl: buildDatasourceUrl(),
  });
} else {
  // In development, use a global variable to preserve the client across hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = global.prisma;
}

export default prisma;
