export function validateProductionEnvironment(env = process.env) {
  if (env.NODE_ENV !== 'production') return;
  for (const key of ['MONGO_URI', 'CLIENT_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
    if (!env[key]?.trim()) throw new Error(`${key} is required in production.`);
  }
  if (!/^mongodb(?:\+srv)?:\/\//.test(env.MONGO_URI) ||
      /(?:localhost|127\.0\.0\.1|\[::1\])/i.test(env.MONGO_URI)) {
    throw new Error('Production MONGO_URI must point to a cloud MongoDB deployment.');
  }
  const client = new URL(env.CLIENT_URL);
  if (client.protocol !== 'https:' || client.username || client.password || client.search || client.hash ||
      client.pathname !== '/' || ['localhost', '127.0.0.1', '[::1]'].includes(client.hostname)) {
    throw new Error('CLIENT_URL must be the public HTTPS frontend origin.');
  }
}
