// Local development only. Preserves the original standalone database unchanged.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
const envPath = new URL('./.env', import.meta.url);
const envText = fs.readFileSync(envPath, 'utf8'), config = dotenv.parse(envText);
const port = 27028, replicaSet = 'clothingLocal';
const storage = path.resolve('backend/.local-mongo');
fs.mkdirSync(storage, { recursive: true });
const direct = `mongodb://127.0.0.1:${port}/admin?directConnection=true`;
const connect = uri => mongoose.createConnection(uri, { serverSelectionTimeoutMS: 1500 }).asPromise();
let admin;
try { admin = await connect(direct); } catch {
  const child = spawn(process.env.MONGOD_PATH || 'mongod', ['--replSet', replicaSet, '--port', String(port), '--bind_ip', '127.0.0.1', '--dbpath', storage, '--logpath', path.join(storage, 'mongod.log'), '--logappend'], { detached: true, windowsHide: true, stdio: 'ignore' });
  child.on('error', error => { console.error('Cannot start mongod:', error.message); }); child.unref();
  for (let i = 0; i < 20 && !admin; i++) { await new Promise(r => setTimeout(r, 500)); try { admin = await connect(direct); } catch { /* startup */ } }
}
if (!admin) throw new Error('Local MongoDB could not start. Install mongod or set MONGOD_PATH.');
try {
  try { await admin.db.admin().command({ replSetGetStatus: 1 }); }
  catch (error) { if (error.code !== 94) throw error; await admin.db.admin().command({ replSetInitiate: { _id: replicaSet, members: [{ _id: 0, host: `127.0.0.1:${port}` }] } }); }
} finally { await admin.close(); }
let source, destination;
try {
  if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(config.MONGO_URI || '')) throw new Error('This setup command supports local development databases only.');
  source = await mongoose.createConnection(config.MONGO_URI, { serverSelectionTimeoutMS: 30000 }).asPromise();
  const dbName = source.name;
  const targetUri = `mongodb://127.0.0.1:${port}/${dbName}?replicaSet=${replicaSet}`;
  destination = await mongoose.createConnection(targetUri, { serverSelectionTimeoutMS: 30000 }).asPromise();
  if (config.MONGO_URI !== targetUri) {
    const existing = await destination.db.listCollections().toArray();
    if (existing.length) throw new Error('Destination already contains data. Refusing to overwrite it.');
    for (const { name, type, options } of await source.db.listCollections().toArray()) {
      if (name.startsWith('system.') || type !== 'collection') continue;
      await destination.db.createCollection(name, options);
      const from = source.db.collection(name), to = destination.db.collection(name);
      let batch = [];
      for await (const doc of from.find()) { batch.push(doc); if (batch.length === 500) { await to.insertMany(batch); batch = []; } }
      if (batch.length) await to.insertMany(batch);
      for (const index of await from.listIndexes().toArray()) {
        if (index.name === '_id_') continue;
        const { key, v: _version, ns: _namespace, ...indexOptions } = index;
        await to.createIndex(key, indexOptions);
      }
      if (await from.countDocuments() !== await to.countDocuments()) throw new Error(`Copy verification failed for ${name}.`);
      console.log(`Copied and verified ${name}.`);
    }
    const backup = new URL('./.env.phase7-original', import.meta.url);
    if (!fs.existsSync(backup)) fs.writeFileSync(backup, envText, { mode: 0o600 });
    fs.writeFileSync(envPath, envText.replace(/^MONGO_URI=.*$/m, `MONGO_URI=${targetUri}`), { mode: 0o600 });
    console.log('Backend configured for local replica set. Original database and environment backup preserved.');
  }
  console.log(`Local MongoDB replica set ready on port ${port}.`);
} finally { await source?.close(); await destination?.close(); }
