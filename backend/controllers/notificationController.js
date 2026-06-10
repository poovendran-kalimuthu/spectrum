import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { targetUsers: { $size: 0 } }, // Broadcast
        { targetUsers: req.user._id }
      ]
    }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });
    
    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { title, message, type, targetUsers } = req.body;
    
    // Check admin
    if (!['superadmin', 'admin_t1', 'admin_t2'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const notif = new Notification({
      title,
      message,
      type: type || 'info',
      targetUsers: targetUsers || [],
      createdBy: req.user._id
    });
    
    await notif.save();
    res.status(201).json({ success: true, notification: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
