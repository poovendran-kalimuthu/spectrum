import User from '../models/User.js';
import Event from '../models/Event.js';

export const globalSearch = async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || q.length < 2) return res.json({ success: true, results: { users: [], events: [] } });

    let users = [];
    let events = [];

    const isUserSearch = q.toLowerCase().startsWith('user:');

    if (isUserSearch) {
      // User specific search mode
      const userQuery = q.slice(5).trim();
      
      if (userQuery.length >= 2 && req.user && ['superadmin', 'admin_t1', 'admin_t2'].includes(req.user.role)) {
        const regex = new RegExp(userQuery, 'i');
        users = await User.find({
          $or: [{ name: regex }, { email: regex }, { registerNumber: regex }]
        }).limit(5).select('name email role profilePicture registerNumber');
      }
    } else {
      // Default event search mode
      const regex = new RegExp(q, 'i');
      events = await Event.find({
        $or: [{ title: regex }, { description: regex }]
      }).limit(5).select('title slug type date status thumbnail');
    }

    res.json({ success: true, results: { users, events } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
