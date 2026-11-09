export function errorHandler(error, _req, res, _next) {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Request body must contain valid JSON.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large.' });
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Each image must be 5 MB or smaller.' });
  if (error.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ message: 'A maximum of 8 images can be uploaded.' });
  if (error.code === 'LIMIT_UNEXPECTED_FILE' || error.message === 'Unsupported image type') return res.status(400).json({ message: 'Only JPEG, PNG, WebP, and GIF images are accepted.' });
  if (error.code === 11000) return res.status(409).json({ message: 'A record with that value already exists.' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'Please check the submitted field values.' });
  if (error.name === 'VersionError') return res.status(409).json({ message: 'This record changed. Refresh and try again.' });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier or value.' });
  const status = error.statusCode || error.status;
  if (status >= 400 && status < 500) return res.status(status).json({ message: error.message });
  console.error('Request failed:', error.name || 'Error');
  return res.status(500).json({ message: 'Something went wrong. Please try again.' });
}
