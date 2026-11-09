import { startTestDatabase } from './test-support.js';
const database = await startTestDatabase();
process.env.MONGO_URI = database.uri;
process.env.JWT_SECRET = 'isolated-verification-secret-not-production';
try {
  for (const suite of ['verify-database', 'verify-auth', 'verify-rbac']) await import('./' + suite + '.js');
} finally { await database.stop(); }
