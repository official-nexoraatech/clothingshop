import dotenv from 'dotenv';
dotenv.config({ path: new URL('./.env', import.meta.url) });
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters.');
const { connectDatabase } = await import('./src/config/database.js');
await import('./src/models/index.js');
const { default: app } = await import('./src/app.js');
const port = Number(process.env.PORT || 5000);
connectDatabase().then(() => app.listen(port, () => console.info(`API listening on ${port}`))).catch((error) => { console.error(`Database initialization failed: ${error.message}`); process.exitCode = 1; });
