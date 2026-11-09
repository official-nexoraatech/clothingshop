import path from 'node:path';
import User from '../models/User.js';
import { cloudinary, cloudinaryEnabled } from '../config/cloudinary.js';
import { removeUploadedFiles } from '../middleware/uploadMiddleware.js';
import { safeUser } from '../utils/auth.js';

async function removeAvatar(profile, userId) {
  if (profile?.avatarPublicId?.startsWith(`clothing-shop/avatars/${userId}/`)) {
    await cloudinary.uploader.destroy(profile.avatarPublicId, { resource_type: 'image', invalidate: true });
  }
  if (profile?.avatarFilename && path.basename(profile.avatarFilename) === profile.avatarFilename) {
    await removeUploadedFiles([{ path: path.resolve('backend/uploads', profile.avatarFilename) }]);
  }
}

export async function uploadAvatar(req, res, next) {
  let uploaded;
  try {
    const file = req.files?.[0];
    if (!file) return res.status(400).json({ message: 'Choose a profile image.' });
    uploaded = cloudinaryEnabled
      ? await cloudinary.uploader.upload(file.path, { folder: `clothing-shop/avatars/${req.user.id}`, resource_type: 'image', timeout: 30000 })
      : null;
    const avatar = uploaded?.secure_url || `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    const previous = await User.findByIdAndUpdate(req.user.id, { $set: {
      'profile.avatar': avatar, 'profile.avatarPublicId': uploaded?.public_id || '',
      'profile.avatarFilename': uploaded ? '' : file.filename,
    } }, { returnDocument: 'before', runValidators: true });
    if (!previous) throw new Error('Account unavailable');
    if (uploaded) await removeUploadedFiles(req.files);
    // Cleanup failure must not turn a saved profile into a failed request.
    try { await removeAvatar(previous.profile, req.user.id); } catch { console.error('Previous avatar cleanup failed.'); }
    res.json({ user: safeUser(await User.findById(req.user.id)) });
  } catch (error) {
    if (uploaded) { try { await cloudinary.uploader.destroy(uploaded.public_id, { resource_type: 'image' }); } catch { console.error('Avatar rollback cleanup failed.'); } }
    await removeUploadedFiles(req.files);
    next(error);
  }
}
