import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
const available = ['verify-models','verify-integrity','test-foundations','test-services','test-catalog','test-orders','test-analytics','test-admin-management','test-phase9','test-phase10','test-orders-ui','test-catalog-ui','test-analytics-ui','test-admin-management-ui','test-phase10-ui','test-cross-browser'];
const requested = process.argv.slice(2);
if (requested.some(name => !available.includes(name))) throw new Error('Unknown regression suite.');
const suites = requested.length ? requested : available;
const report = requested.length ? 'regression-focused' : 'regression';
mkdirSync('test-results', { recursive: true });
writeFileSync('test-results/' + report + '.log', '');
const results = [];
for (const suite of suites) {
  const started = Date.now();
  console.log('\nRunning ' + suite);
  appendFileSync('test-results/' + report + '.log', '\nRunning ' + suite + '\n');
  const child = spawn(process.execPath, ['backend/' + suite + '.js'], { windowsHide: true, env: { ...process.env, NODE_ENV: 'test', JWT_SECRET: 'isolated-regression-secret-not-production', CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '', SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '', AUTH_RATE_LIMIT: '200' }, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { process.stdout.write(data); appendFileSync('test-results/' + report + '.log', data); });
  const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve); });
  results.push({ suite, exitCode: code, elapsedSeconds: Math.round((Date.now() - started) / 1000) });
  writeFileSync('test-results/' + report + '.json', JSON.stringify({ runAt: new Date().toISOString(), results }, null, 2));
  if (code !== 0) { process.exitCode = 1; break; }
}
console.log(results.filter(r => r.exitCode === 0).length + '/' + suites.length + ' regression suites passed.');


