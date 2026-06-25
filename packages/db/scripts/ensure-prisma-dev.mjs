import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const dbDir = resolve(root, 'packages/db');
const envPath = resolve(root, '.env');

function usesHostedDatabase() {
  const env = readFileSync(envPath, 'utf8');
  const match = env.match(/^DATABASE_URL="([^"]+)"/m);
  if (!match) return false;
  const url = match[1];
  return url.includes('supabase.co') || url.includes('supabase.com');
}

function prismaDevLs() {
  return execSync('npx prisma dev ls', { cwd: dbDir, encoding: 'utf8' });
}

function hasRunningInstance(raw) {
  return /\]8;;prisma\+postgres:\/\/localhost:\d+\/\?api_key=eyJ/.test(raw);
}

function startPrismaDev() {
  console.log('[db] Prisma dev not running — starting "accounting" instance...');
  execSync('npx prisma dev --detach -n accounting', { cwd: dbDir, stdio: 'inherit' });
}

function syncEnv() {
  execSync('node packages/db/scripts/sync-prisma-dev-env.mjs', { cwd: root, stdio: 'inherit' });
}

if (!existsSync(envPath)) {
  console.error('[db] Missing .env — copy .env.example first.');
  process.exit(1);
}

if (usesHostedDatabase()) {
  console.log('[db] Using hosted DATABASE_URL — skipping local prisma dev.');
  process.exit(0);
}

try {
  const ls = prismaDevLs();
  if (!hasRunningInstance(ls)) {
    startPrismaDev();
  }
} catch {
  startPrismaDev();
}

syncEnv();
console.log('[db] Prisma dev ready (proxy DATABASE_URL synced to .env).');
