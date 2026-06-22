import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const dbDir = resolve(root, 'packages/db');
const envPath = resolve(root, '.env');

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
