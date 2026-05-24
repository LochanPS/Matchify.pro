/**
 * Replace all inline spinners with <Spinner size="..." /> across the codebase.
 *
 * Handles:
 *  1. <Loader className="w-X h-X animate-spin" />  → <Spinner size="X" />
 *  2. <Loader2 className="w-X h-X animate-spin" />
 *  3. <div className="...animate-spin..." style={...}></div>   (multiline)
 *  4. <div className="...animate-spin..." />   (self-closing)
 *
 * Run: node scripts/patch-spinners.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function findJsx(dir) {
  const r = [];
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    if (f.isDirectory()) r.push(...findJsx(join(dir, f.name)));
    else if (f.name.endsWith('.jsx')) r.push(join(dir, f.name));
  }
  return r;
}

const IMPORT_LINE = "import Spinner from '../components/Spinner';";
const IMPORT_LINE_ALT = "import Spinner from '../../components/Spinner';";

/** Pick size prop from className string */
function sizeFromClass(cls) {
  if (/w-3\.5|h-3\.5|w-3 |h-3 |w-3$|h-3$/.test(cls)) return 'xs';
  if (/w-4|h-4/.test(cls)) return 'sm';
  if (/w-5|h-5|w-6|h-6|w-7|h-7|w-8|h-8/.test(cls)) return 'md';
  if (/w-10|h-10|w-12|h-12/.test(cls)) return 'lg';
  if (/w-16|h-16|w-20|h-20/.test(cls)) return 'xl';
  return 'md';
}

/** Extract extra layout classes (mx-auto, mb-X, mt-X, relative, etc.) */
function extraClasses(cls) {
  const keep = cls.split(/\s+/).filter(c =>
    /^(mx-auto|mb-|mt-|mr-|ml-|block|inline-block|relative|z-\d+|flex-shrink)/.test(c)
  );
  return keep.join(' ');
}

/** Depth-first replace, returns [newSrc, count] */
function patchFile(src, isAdmin) {
  const importLine = isAdmin ? IMPORT_LINE_ALT : IMPORT_LINE;
  let count = 0;

  // ── 1. <Loader className="...animate-spin..." />
  //       <Loader2 className="...animate-spin..." />
  src = src.replace(/<Loader2?\s+className="([^"]*animate-spin[^"]*)"\s*\/>/g, (_, cls) => {
    const size = sizeFromClass(cls);
    const extra = extraClasses(cls);
    count++;
    return extra ? `<Spinner size="${size}" className="${extra}" />` : `<Spinner size="${size}" />`;
  });

  // ── 2. <Loader2? className="...animate-spin..." style={...} />  (with style)
  src = src.replace(/<Loader2?\s+className="([^"]*animate-spin[^"]*)"\s+style=\{[^}]*\}\s*\/>/g, (_, cls) => {
    const size = sizeFromClass(cls);
    count++;
    return `<Spinner size="${size}" />`;
  });

  // ── 3. Self-closing div/span with animate-spin (single line)
  //    <div className="...animate-spin..." />
  //    <div className="...animate-spin..." style={...} />
  src = src.replace(/<div\s+className="([^"]*animate-spin[^"]*)"\s*(?:style=\{[^}]*\})?\s*\/>/g, (_, cls) => {
    const size = sizeFromClass(cls);
    const extra = extraClasses(cls);
    count++;
    return extra ? `<Spinner size="${size}" className="${extra}" />` : `<Spinner size="${size}" />`;
  });

  // ── 4. Multi-line div with animate-spin, closed with </div>
  //    <div
  //      className="...animate-spin..."
  //      style={...}
  //    ></div>   or   ></div>
  src = src.replace(/<div\s+className="([^"]*animate-spin[^"]*)"\s*(?:\r?\n\s*style=\{[^}]*\})?\s*>[\s]*<\/div>/g, (_, cls) => {
    const size = sizeFromClass(cls);
    const extra = extraClasses(cls);
    count++;
    return extra ? `<Spinner size="${size}" className="${extra}" />` : `<Spinner size="${size}" />`;
  });

  // ── 5. Multi-line pattern: className on one line, style= on next
  //    <div
  //      className="...animate-spin..."
  //      style={{
  //        ...
  //      }}
  //    ></div>
  src = src.replace(/<div\s+className="([^"]*animate-spin[^"]*)"\s*\r?\n\s*style=\{[\s\S]*?\}\s*(?:>[\s]*<\/div>|\/?>)/g, (match, cls) => {
    const size = sizeFromClass(cls);
    const extra = extraClasses(cls);
    count++;
    return extra ? `<Spinner size="${size}" className="${extra}" />` : `<Spinner size="${size}" />`;
  });

  if (count === 0) return [src, 0];

  // Add import if not present
  if (!src.includes('Spinner') || !src.includes(importLine)) {
    // Remove old wrong-depth import if present
    src = src.replace(/import Spinner from '[^']*Spinner';\n?/g, '');
    // Insert after last import line
    const lines = src.split('\n');
    let lastImport = 0;
    for (let i = 0; i < Math.min(lines.length, 80); i++) {
      if (lines[i].replace(/\r/, '').startsWith('import ')) lastImport = i;
    }
    lines.splice(lastImport + 1, 0, importLine);
    src = lines.join('\n');
  }

  return [src, count];
}

const files = findJsx(join(ROOT, 'frontend', 'src'));
let totalFiles = 0, totalReplacements = 0;

for (const fp of files) {
  if (fp.includes('LoadingScreen') || fp.includes('Spinner.jsx')) continue;
  const src = readFileSync(fp, 'utf8');
  if (!src.includes('animate-spin')) continue;

  const isAdmin = fp.includes('/admin/');
  const [newSrc, count] = patchFile(src, isAdmin);

  if (count > 0) {
    writeFileSync(fp, newSrc, 'utf8');
    console.log(`✅ ${fp.split('src/').pop()} — ${count} replacements`);
    totalFiles++;
    totalReplacements += count;
  }
}

console.log(`\nDone. ${totalReplacements} spinners replaced across ${totalFiles} files.`);
