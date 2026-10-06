import crypto from 'node:crypto';
export const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
export const createResetToken = () => crypto.randomBytes(32).toString('hex');
export const safeUser = (user) => ({ id: user._id, name: user.name, email: user.email, phone: user.phone, avatar: user.profile?.avatar || '', notificationPreferences: { email: user.notificationPreferences?.email ?? false, sms: user.notificationPreferences?.sms ?? false }, role: user.role, status: user.status, createdAt: user.createdAt, updatedAt: user.updatedAt });
