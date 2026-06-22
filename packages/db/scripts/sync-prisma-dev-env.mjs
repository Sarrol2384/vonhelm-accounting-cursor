import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const envPath = resolve(root, '.env');
const dbDir = resolve(root, 'packages/db');

const raw = execSync('npx prisma dev ls', { cwd: dbDir, encoding: 'utf8' });

// Full prisma+postgres URL lives inside the terminal hyperlink (OSC 8).
const hyperlink = raw.match(
  /\]8;;(prisma\+postgres:\/\/localhost:\d+\/\?api_key=eyJ[A-Za-z0-9_-]+)/,
);
if (!hyperlink) {
  console.error('No prisma dev server found. Run: pnpm db:local');
  process.exit(1);
}

// Runtime app traffic MUST use the prisma+postgres proxy (port 51213): it multiplexes
// concurrent queries. The raw TCP port (51214) accepts only ONE connection at a time and
// wedges (ECONNRESET) under the concurrent queries the app fires (e.g. the Today page),
// so it is only safe for sequential CLI work (db push / seed) via DIRECT_URL.
let databaseUrl = hyperlink[1];
let directUrl = hyperlink[1];
try {
  const apiKey = new URL(hyperlink[1]).searchParams.get('api_key');
  const payload = JSON.parse(Buffer.from(apiKey, 'base64url').toString());
  if (payload.databaseUrl) directUrl = payload.databaseUrl;
} catch {
  // keep proxy URL as DIRECT_URL fallback
}

if (!existsSync(envPath)) {
  console.error(`Missing ${envPath}. Copy .env.example first.`);
  process.exit(1);
}

let env = readFileSync(envPath, 'utf8');
const setVar = (name, value) => {
  const line = `${name}="${value}"`;
  const re = new RegExp(`^${name}=.*$`, 'm');
  env = re.test(env) ? env.replace(re, line) : `${env.trimEnd()}\n${line}\n`;
};

setVar('DATABASE_URL', databaseUrl);
setVar('DIRECT_URL', directUrl);
writeFileSync(envPath, env.endsWith('\n') ? env : `${env}\n`);

console.log('Synced .env from prisma dev (proxy DATABASE_URL + direct DIRECT_URL).');
