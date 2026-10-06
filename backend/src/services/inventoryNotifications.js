import User from '../models/User.js';
import Notification from '../models/Notification.js';

const state = (stock, threshold) => stock === 0 ? 'out' : stock <= threshold ? 'low' : 'available';

// Called inside the stock transaction: retries and rollbacks include notifications.
export async function notifyInventoryChange(variant, previousStock, nextStock, session, previousThreshold = variant.lowStockThreshold) {
  const before = state(previousStock, previousThreshold);
  const after = state(nextStock, variant.lowStockThreshold);
  if (before === after) return;
  const recipients = await User.find({ role: { $in: ['admin', 'employee'] }, status: 'active' }).select('_id').session(session);
  if (!recipients.length) return;
  const title = after === 'out' ? 'Out of stock' : after === 'low' ? 'Low stock' : 'Stock available again';
  await Notification.insertMany(recipients.map(user => ({
    recipient: user._id, type: 'Inventory', title,
    message: `${variant.sku}: ${nextStock} available (${variant.size}, ${variant.color}).`,
    relatedEntity: { model: 'ProductVariant', entity: variant._id },
  })), { session });
}
