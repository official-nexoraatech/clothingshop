// Self-contained replica set for tests; never connects to the shop database.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import mongoose from 'mongoose';
export async function startTestDatabase() {
  const probe = net.createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  const storage = mkdtempSync(path.join(tmpdir(), 'clothing-orders-test-'));
  const child = spawn(process.env.MONGOD_PATH || 'mongod', ['--wiredTigerCacheSizeGB', '0.25', '--replSet', 'ordersTest', '--port', String(port), '--bind_ip', '127.0.0.1', '--dbpath', storage, '--logpath', path.join(storage, 'mongod.log')], { windowsHide: true, stdio: 'ignore' });
  let spawnError; child.on('error', error => { spawnError = error; });
  const stop = async () => { if (child.exitCode !== null || spawnError) return; const done = new Promise(resolve => child.once('exit', resolve)); child.kill(); await done; };
  try {
    let client;
    for (let i = 0; i < 120 && !client; i++) {
      if (spawnError) throw spawnError;
      const attempt = new mongoose.mongo.MongoClient(`mongodb://127.0.0.1:${port}/?directConnection=true`, { serverSelectionTimeoutMS: 500 });
      try { await attempt.connect(); client = attempt; } catch { await attempt.close(); }
    }
    if (!client) throw new Error('Test MongoDB failed to start. Install mongod or set MONGOD_PATH.');
    try { await client.db('admin').command({ replSetInitiate: { _id: 'ordersTest', members: [{ _id: 0, host: `127.0.0.1:${port}` }] } }); } finally { await client.close(); }
    return { uri: `mongodb://127.0.0.1:${port}/orders_test?replicaSet=ordersTest`, stop };
  } catch (error) { await stop(); throw error; }
}
