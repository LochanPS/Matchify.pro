import prisma from '../lib/prisma.js';

// Turn a name into a URL-safe slug: "VRAS & DJs" -> "vras-djs", "Men's Doubles Int" -> "mens-doubles-int"
export function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/['’`]/g, '')          // drop apostrophes (women's -> womens)
    .replace(/[^a-z0-9]+/g, '-')    // any run of non-alphanumerics -> single hyphen
    .replace(/^-+|-+$/g, '')        // trim leading/trailing hyphens
    .slice(0, 60) || 'tournament';
}

// Globally-unique tournament slug (append -2, -3… on collision).
export async function generateUniqueTournamentSlug(name, excludeId = null) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.tournament.findFirst({
      where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

// Category slug, unique WITHIN its tournament.
export async function generateUniqueCategorySlug(tournamentId, name, excludeId = null) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.category.findFirst({
      where: { tournamentId, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

// One-time (idempotent) backfill of slugs for rows created before slugs existed.
// After the first run there are no null slugs, so this is cheap on every boot.
export async function backfillSlugs() {
  try {
    const ts = await prisma.tournament.findMany({ where: { slug: null }, select: { id: true, name: true } });
    for (const t of ts) {
      const slug = await generateUniqueTournamentSlug(t.name, t.id);
      await prisma.tournament.update({ where: { id: t.id }, data: { slug } });
    }
    const cs = await prisma.category.findMany({ where: { slug: null }, select: { id: true, name: true, tournamentId: true } });
    for (const c of cs) {
      const slug = await generateUniqueCategorySlug(c.tournamentId, c.name, c.id);
      await prisma.category.update({ where: { id: c.id }, data: { slug } });
    }
    if (ts.length || cs.length) {
      console.log(`✅ Backfilled slugs: ${ts.length} tournaments, ${cs.length} categories`);
    }
  } catch (e) {
    console.error('Slug backfill (non-fatal):', e.message);
  }
}
