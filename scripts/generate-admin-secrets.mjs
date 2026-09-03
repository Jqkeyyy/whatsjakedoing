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
const passwordBytes = Buffer.byteLength(password, 'utf8');
if (password.length < 12) {
  console.error('ADMIN_PASSWORD must be at least 12 characters.');
  process.exit(1);
}
if (passwordBytes > 72) {
  console.error('ADMIN_PASSWORD must be at most 72 UTF-8 bytes (bcrypt limit).');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
const sessionSecret = randomBytes(32).toString('hex');

const filtered = lines.filter(
  (l) => !l.startsWith('ADMIN_PASSWORD=') && !l.startsWith('ADMIN_PASSWORD_HASH=') && !l.startsWith('SESSION_SECRET=')
);
// Quoted: an unquoted bcrypt hash (e.g. `$2a$10$...`) is corrupted by
// dotenv-style variable-expansion parsers, which treat `$2a`/`$10` as
// shell-style variable references and silently blank them out.
filtered.push(`ADMIN_PASSWORD_HASH="${hash}"`, `SESSION_SECRET="${sessionSecret}"`);

writeFileSync(path, filtered.filter((l) => l !== '').join('\n') + '\n');
console.log('Done. ADMIN_PASSWORD_HASH and SESSION_SECRET written to .env.local; plaintext password removed.');
