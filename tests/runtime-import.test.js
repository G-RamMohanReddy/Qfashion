import test from 'node:test';
import { execFileSync } from 'node:child_process';
test('Firebase Admin loads when serverless instrumentation disables require(ESM)', () => {
  execFileSync(process.execPath, ['--no-experimental-require-module', '-e', "require('firebase-admin/auth')"], { stdio: 'pipe' });
});
