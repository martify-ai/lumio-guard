// Builds the real blocklists from pinned upstream sources plus our curated lists.
//   npm run lists                → full profile (every source)
//   npm run lists -- --profile compact   → leaves out sources marked "large"
//
// Steps: download each pinned source (cached), check its checksum, clean and merge
// the domains per category, add curated lists, remove anything that would block a
// never-block site, and write packages/blocklists/real/<category>.txt + REPORT.json.
// The real lists are build output and are not committed.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyNeverBlock, isBlockedBy, parseList, removeCoveredSubdomains } from '../src/lib/domain';

interface Source {
  id: string;
  category: string;
  name: string;
  licence: string;
  url: string;
  sha256: string;
  large: boolean;
}

const lists = resolve(dirname(fileURLToPath(import.meta.url)), '../../packages/blocklists');
const args = process.argv.slice(2);
const profile = args.includes('--profile') ? args[args.indexOf('--profile') + 1] : 'full';
if (!['full', 'compact'].includes(profile)) throw new Error(`Unknown profile: ${profile}`);

const config = JSON.parse(readFileSync(join(lists, 'sources.json'), 'utf8')) as {
  sources: Source[];
  curated: { category: string; file: string }[];
};
const categories: { id: string }[] = JSON.parse(readFileSync(join(lists, 'categories.json'), 'utf8')).categories;
const neverBlock = parseList(readFileSync(join(lists, 'curated/never-block.txt'), 'utf8')).domains;

const cache = join(lists, '.cache');
const out = join(lists, 'real');
mkdirSync(cache, { recursive: true });
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const sha256 = (buf: Buffer) => createHash('sha256').update(buf).digest('hex');

async function load(src: Source): Promise<string> {
  const file = join(cache, `${src.id}.txt`);
  if (existsSync(file) && sha256(readFileSync(file)) === src.sha256) return readFileSync(file, 'utf8');
  console.log(`Downloading ${src.id} …`);
  const res = await fetch(src.url);
  if (!res.ok) throw new Error(`${src.id}: download failed (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  // A changed file means the pin is wrong or the source was tampered with. Stop.
  if (sha256(buf) !== src.sha256) throw new Error(`${src.id}: checksum mismatch. Refusing to use it.`);
  writeFileSync(file, buf);
  return buf.toString('utf8');
}

const report: Record<string, unknown> = { profile, builtAt: new Date().toISOString(), categories: {} };

for (const c of categories) {
  const merged = new Set<string>();
  const perSource: Record<string, unknown> = {};
  const upstream = new Set<string>();

  for (const src of config.sources.filter((s) => s.category === c.id)) {
    if (profile === 'compact' && src.large) {
      perSource[src.id] = { skipped: 'large source left out of the compact profile' };
      continue;
    }
    const parsed = parseList(await load(src));
    parsed.domains.forEach((d) => {
      merged.add(d);
      upstream.add(d);
    });
    perSource[src.id] = { domains: parsed.domains.length, rejectedLines: parsed.rejected, licence: src.licence };
  }

  const curatedReport: Record<string, unknown> = {};
  for (const cur of config.curated.filter((x) => x.category === c.id)) {
    const parsed = parseList(readFileSync(join(lists, cur.file), 'utf8'));
    parsed.domains.forEach((d) => merged.add(d));
    curatedReport[cur.file] = {
      domains: parsed.domains.length,
      rejectedLines: parsed.rejected,
      // Curated entries no upstream list knows about: these rest on our judgement alone.
      notConfirmedByUpstream: parsed.domains.filter((d) => !isBlockedBy(d, upstream)),
    };
  }

  const { kept, removed } = applyNeverBlock([...merged].sort(), neverBlock);
  const final = removeCoveredSubdomains(kept);

  // Safety check: after filtering, no never-block site may be blocked.
  const finalSet = new Set(final);
  const stillBlocked = neverBlock.filter((d) => isBlockedBy(d, finalSet));
  if (stillBlocked.length) throw new Error(`${c.id}: never-block sites still blocked: ${stillBlocked.join(', ')}`);

  writeFileSync(join(out, `${c.id}.txt`), final.join('\n') + '\n');
  (report.categories as Record<string, unknown>)[c.id] = {
    domains: final.length,
    sources: perSource,
    curated: curatedReport,
    removedByNeverBlock: removed,
    removedAsCoveredSubdomains: kept.length - final.length,
  };
}

writeFileSync(join(out, 'REPORT.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
