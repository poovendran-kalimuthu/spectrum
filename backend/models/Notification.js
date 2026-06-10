import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Empty means broadcast to all
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of users who have read it
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Notification', notificationSchema);
