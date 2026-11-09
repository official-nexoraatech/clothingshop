import jwt from 'jsonwebtoken';
export const createToken = (user) => jwt.sign({ userId: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
