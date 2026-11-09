import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: new URL('./.env', import.meta.url) });
console.info('Connecting to the configured MongoDB database…');
await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
console.info('Connected; inspecting users indexes…');

const users = mongoose.connection.collection('users');
const indexes = await users.indexes();
const total = await users.countDocuments();
const countMissingOrEmpty = field => users.countDocuments({ $or: [{ [field]: { $exists: false } }, { [field]: null }, { [field]: '' }] });

console.log(JSON.stringify({
  indexes: indexes.map(({ name, key, unique, sparse, partialFilterExpression }) => ({ name, key, unique: Boolean(unique), sparse: Boolean(sparse), partialFilterExpression: partialFilterExpression || null })),
  summary: {
    total,
    missingEmail: await countMissingOrEmpty('email'),
    missingPhone: await countMissingOrEmpty('phone'),
    missingName: await countMissingOrEmpty('name'),
  },
}, null, 2));

await mongoose.disconnect();
