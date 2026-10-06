import Notification from '../models/Notification.js';
export const notify = (recipient, type, title, message, relatedEntity, session = null) => Notification.create([{ recipient, type, title, message, relatedEntity }], session ? { session } : undefined);
