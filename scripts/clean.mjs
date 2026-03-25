import { rmSync } from 'node:fs';
import { join } from 'node:path';

const targets = ['lib', 'esm', 'tsconfig.tsbuildinfo'];

for (const target of targets) {
  rmSync(join(process.cwd(), target), {
    force: true,
    maxRetries: 10,
    recursive: true,
    retryDelay: 100,
  });
}