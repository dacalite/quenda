// SPDX-License-Identifier: EUPL-1.2
// Fails when a source file lacks the EUPL-1.2 SPDX header in its first three lines.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const HEADER = 'SPDX-License-Identifier: EUPL-1.2';
const SOURCE = /\.(ts|tsx|js|mjs|css|html)$/;

const files = [
  ...readdirSync('.'),
  ...['src', 'e2e', 'scripts'].flatMap((dir) =>
    readdirSync(dir, { recursive: true }).map((file) => join(dir, String(file))),
  ),
].filter((file) => SOURCE.test(file));

const missing = files.filter(
  (file) =>
    !readFileSync(file, 'utf8')
      .split('\n', 3)
      .some((line) => line.includes(HEADER)),
);

if (missing.length > 0) {
  console.error(`Missing "${HEADER}" in:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
console.log(`SPDX headers OK in ${files.length} files.`);
