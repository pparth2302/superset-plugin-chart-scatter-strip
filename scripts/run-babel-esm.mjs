import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const babelCli = require.resolve('@babel/cli/bin/babel.js');
const extraArgs = process.argv.slice(2);
const args = [
  babelCli,
  'src',
  '--extensions',
  '.ts,.tsx,.js,.jsx',
  '--copy-files',
  '--out-dir',
  'esm',
  ...extraArgs,
];

const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    BABEL_OUTPUT: 'esm',
  },
});

child.on('exit', code => {
  process.exit(code ?? 1);
});

child.on('error', error => {
  console.error(error);
  process.exit(1);
});