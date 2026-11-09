import User from '../models/User.js'; import PasswordResetToken from '../models/PasswordResetToken.js'; import { createToken } from '../utils/jwt.js'; import { createResetToken, hashResetToken, safeUser } from '../utils/auth.js'; import { isMailConfigured, sendPasswordResetEmail } from '../utils/mailer.js';
const emailPattern = /^\S+@\S+\.\S+$/;
function validatePassword(password, confirmPassword) { if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters.'; if (confirmPassword !== undefined && password !== confirmPassword) return 'Passwords do not match.'; return null; }
export async function register(req, res, next) { try { const { name, email, phone, password, confirmPassword } = req.body || {}; if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || (phone !== undefined && typeof phone !== 'string')) return res.status(400).json({ message: 'Name, email, phone and password must be text.' }); if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email, and password are required.' }); if (!emailPattern.test(email.trim())) return res.status(400).json({ message: 'Enter a valid email address.' }); const passwordError = validatePassword(password, confirmPassword); if (passwordError) return res.status(400).json({ message: passwordError }); const normalizedEmail = email.trim().toLowerCase(); if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with that email already exists.' }); const user = await User.create({ name: name.trim(), email: normalizedEmail, phone: phone?.trim(), password, role: 'customer' }); return res.status(201).json({ token: createToken(user), user: safeUser(user) }); } catch (error) { next(error); } }
export async function login(req, res, next) { try { const { email, password } = req.body || {}; if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ message: 'Email and password must be text.' }); if (!email?.trim() || !password) return res.status(400).json({ message: 'Email and password are required.' }); const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password'); if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid email or password.' }); if (user.status !== 'active') return res.status(403).json({ message: 'This account is not active.' }); return res.json({ token: createToken(user), user: safeUser(user) }); } catch (error) { next(error); } }
export function logout(_req, res) { return res.status(204).send(); }
export function me(req, res) { return res.json({ user: safeUser(req.user) }); }
export async function forgotPassword(req, res, next) { try { const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''; if (!email || !emailPattern.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' }); const user = await User.findOne({ email }); if (user) { const token = createResetToken(); await PasswordResetToken.deleteMany({ user: user._id, usedAt: null }); const reset = await PasswordResetToken.create({ user: user._id, tokenHash: hashResetToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) }); const resetUrl = new URL('/reset-password', process.env.CLIENT_URL || 'http://localhost:5173'); resetUrl.searchParams.set('token', token); try { if (isMailConfigured()) await sendPasswordResetEmail({ email: user.email, resetUrl: resetUrl.toString() }); else if (process.env.NODE_ENV === 'production') throw new Error('SMTP is not configured.'); } catch (error) { await PasswordResetToken.deleteOne({ _id: reset._id }); return next(error); } if (process.env.NODE_ENV !== 'production' && !isMailConfigured()) return res.json({ message: 'If the account exists, reset instructions have been created.', developmentResetToken: token }); } return res.json({ message: 'If the account exists, reset instructions have been sent.' }); } catch (error) { next(error); } }
export async function resetPassword(req, res, next) { try { const { token, password, confirmPassword } = req.body || {}; if (typeof token !== 'string') return res.status(400).json({ message: 'A reset token is required.' }); const passwordError = validatePassword(password, confirmPassword); if (!token || passwordError) return res.status(400).json({ message: passwordError || 'A reset token is required.' }); const reset = await PasswordResetToken.findOneAndUpdate({ tokenHash: hashResetToken(token), usedAt: null, expiresAt: { $gt: new Date() } }, { usedAt: new Date() }, { returnDocument: 'after' }); if (!reset) return res.status(400).json({ message: 'This reset token is invalid or expired.' }); const user = await User.findById(reset.user).select('+password'); if (!user) return res.status(400).json({ message: 'This reset token is invalid or expired.' }); user.password = password; await user.save(); return res.json({ message: 'Password reset successfully.' }); } catch (error) { next(error); } }


export async function updateProfile(req, res, next) {
  try {
    const body = req.body;
    if (!body || Array.isArray(body) || !Object.keys(body).length || Object.keys(body).some(key => !['name', 'phone'].includes(key))) return res.status(400).json({ message: 'Only name and phone can be updated.' });
    const changes = {};
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 100) return res.status(400).json({ message: 'Name must be 2 to 100 characters.' });
      changes.name = body.name.trim();
    }
    if (body.phone !== undefined) {
      if (typeof body.phone !== 'string' || (body.phone.trim() && !/^[+]?\d[\d\s-]{6,19}$/.test(body.phone.trim()))) return res.status(400).json({ message: 'Enter a valid phone number.' });
      changes.phone = body.phone.trim();
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: changes }, { returnDocument: 'after', runValidators: true });
    res.json({ user: safeUser(user) });
  } catch (error) { next(error); }
}
export async function updatePreferences(req, res, next) {
  try {
    const body = req.body;
    if (!body || Array.isArray(body) || !Object.keys(body).length || Object.keys(body).some(key => !['email', 'sms'].includes(key) || typeof body[key] !== 'boolean')) return res.status(400).json({ message: 'Notification preferences must be true or false.' });
    const changes = Object.fromEntries(Object.entries(body).map(([key, value]) => ['notificationPreferences.' + key, value]));
    const user = await User.findByIdAndUpdate(req.user._id, { $set: changes }, { returnDocument: 'after', runValidators: true });
    res.json({ user: safeUser(user) });
  } catch (error) { next(error); }
}
