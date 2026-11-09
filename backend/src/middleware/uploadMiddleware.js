import multer from 'multer';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
const uploadDirectory = path.resolve('backend', 'uploads');
mkdirSync(uploadDirectory, { recursive: true });
const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
const storage = multer.diskStorage({
  destination: (_req, _file, done) => done(null, uploadDirectory),
  filename: (_req, file, done) => done(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensions[file.mimetype]}`)
});
const imageOnly = (_req, file, done) => done(extensions[file.mimetype] ? null : new Error('Unsupported image type'), true);
export const productImageUpload = multer({ storage, fileFilter: imageOnly, limits: { fileSize: 5 * 1024 * 1024, files: 8 } });
export const removeUploadedFiles = files => Promise.all((files || []).map(file => unlink(file.path).catch(() => {})));
export async function validateImageContent(req, _res, next) {
  try {
    for (const file of req.files || []) {
      const data = await readFile(file.path);
      const valid = file.mimetype === 'image/png' ? data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
        : file.mimetype === 'image/jpeg' ? data[0] === 255 && data[1] === 216 && data[2] === 255
        : file.mimetype === 'image/gif' ? ['GIF87a','GIF89a'].includes(data.subarray(0,6).toString())
        : data.subarray(0,4).toString() === 'RIFF' && data.subarray(8,12).toString() === 'WEBP';
      if (!valid) throw new Error('Unsupported image type');
    }
    next();
  } catch (error) { await removeUploadedFiles(req.files); next(error); }
}

