import { join } from 'node:path';
import rimraf from 'rimraf';

const targets = ['lib', 'esm', 'tsconfig.tsbuildinfo'];

for (const target of targets) {
  try {
    rimraf.sync(join(process.cwd(), target));
  } catch (error) {
    if (error && ['ENOENT', 'ENOTEMPTY', 'EPERM'].includes(error.code)) {
      // Best-effort cleanup on Windows; build steps overwrite generated files.
      continue;
    }

    throw error;
  }
}
