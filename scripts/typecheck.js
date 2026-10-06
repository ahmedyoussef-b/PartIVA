import { execSync } from 'child_process';

console.log('Generating route types...');
execSync('next typegen', { stdio: 'inherit' });

setTimeout(() => {
  console.log('Running type check...');
  execSync('tsc --noEmit', { stdio: 'inherit' });
}, 500);
