// scripts/generate-admin-secrets.mjs
// Usage: add a line `ADMIN_PASSWORD=<your chosen password>` to .env.local
// yourself (in your editor, not via chat), then run this script. It reads
// that value, replaces it with a bcrypt hash, mints a random session
// secret, and never prints the plaintext password anywhere.
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

const path = '.env.local';
const lines = readFileSync(path, 'utf8').split('\n');

const passwordLineIndex = lines.findIndex((l) => l.startsWith('ADMIN_PASSWORD='));
if (passwordLineIndex === -1) {
  console.error('Add a line `ADMIN_PASSWORD=<your password>` to .env.local first, then re-run.');
  process.exit(1);
}

const password = lines[passwordLineIndex].slice('ADMIN_PASSWORD='.length);
if (!password) {
  console.error('ADMIN_PASSWORD is empty.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const sessionSecret = randomBytes(32).toString('hex');

const filtered = lines.filter(
  (l) => !l.startsWith('ADMIN_PASSWORD=') && !l.startsWith('ADMIN_PASSWORD_HASH=') && !l.startsWith('SESSION_SECRET=')
);
filtered.push(`ADMIN_PASSWORD_HASH=${hash}`, `SESSION_SECRET=${sessionSecret}`);

writeFileSync(path, filtered.filter((l) => l !== '').join('\n') + '\n');
console.log('Done. ADMIN_PASSWORD_HASH and SESSION_SECRET written to .env.local; plaintext password removed.');
