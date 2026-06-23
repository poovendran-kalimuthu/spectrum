import Document from '../models/Document.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // approvers could be a comma-separated string or array
    let approvers = req.body.approvers;
    if (typeof approvers === 'string') {
      approvers = approvers.split(',').map(id => id.trim());
    } else if (!approvers) {
      approvers = [];
    }

    // If no approvers selected, auto-approve immediately
    const autoApprove = approvers.length === 0;

    const newDoc = new Document({
      title: req.body.title,
      documentType: req.body.documentType,
      fileUrl: '/uploads/' + req.file.filename,
      sender: req.user._id,
      approvers: approvers,
      approvalsReceived: [],
      status: autoApprove ? 'Approved' : 'Pending',
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      isPublic: req.body.isPublic === 'true' || req.body.isPublic === true
    });

    await newDoc.save();
    console.log('Document uploaded:', newDoc._id, 'by:', req.user._id, 'approvers:', approvers, 'autoApproved:', autoApprove);
    res.status(201).json({ success: true, document: newDoc });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const userId = req.user._id;
    // Get documents where user is sender OR user is in approvers list
    const docs = await Document.find({
      $or: [
        { sender: userId },
        { approvers: userId }
      ]
    }).populate('sender', 'name email profilePicture role')
      .populate('approvers', 'name email role')
      .populate('approvalsReceived', 'name email role')
      .populate('comments.user', 'name email profilePicture role')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${docs.length} docs for user ${userId}`);
    res.json({ success: true, documents: docs });
  } catch (err) {
    console.error('Fetch Docs Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const approveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user._id;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    if (!doc.approvers.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to approve' });
    }

    if (!doc.approvalsReceived.includes(userId)) {
      doc.approvalsReceived.push(userId);
    }

    if (comment) {
      doc.comments.push({ user: userId, text: comment });
    }

    if (doc.approvalsReceived.length === doc.approvers.length) {
      doc.status = 'Approved';
    }

    await doc.save();
    
    // Repopulate to return to client
    await doc.populate('sender', 'name email profilePicture role');
    await doc.populate('approvers', 'name email role');
    await doc.populate('approvalsReceived', 'name email role');
    await doc.populate('comments.user', 'name email profilePicture role');

    res.json({ success: true, document: doc });
  } catch (err) {
    console.error('Approve Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const rejectDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user._id;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    if (!doc.approvers.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject' });
    }

    doc.status = 'Rejected';

    if (comment) {
      doc.comments.push({ user: userId, text: comment });
    }

    await doc.save();
    await doc.populate('sender', 'name email profilePicture role');
    await doc.populate('approvers', 'name email role');
    await doc.populate('approvalsReceived', 'name email role');
    await doc.populate('comments.user', 'name email profilePicture role');

    res.json({ success: true, document: doc });
  } catch (err) {
    console.error('Reject Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Allow sender or approvers to comment
    if (doc.sender.toString() !== userId.toString() && !doc.approvers.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to comment' });
    }

    doc.comments.push({ user: userId, text });
    await doc.save();

    await doc.populate('sender', 'name email profilePicture role');
    await doc.populate('approvers', 'name email role');
    await doc.populate('approvalsReceived', 'name email role');
    await doc.populate('comments.user', 'name email profilePicture role');

    res.json({ success: true, document: doc });
  } catch (err) {
    console.error('Add Comment Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Only the original sender can delete
    const isSender = doc.sender.toString() === userId.toString();
    if (!isSender) {
      return res.status(403).json({ success: false, message: 'Only the sender can delete this document' });
    }

    // Cannot delete after it has been fully approved
    if (doc.status === 'Approved') {
      return res.status(403).json({ success: false, message: 'Approved documents cannot be deleted' });
    }

    // Delete the file from the filesystem if it exists
    if (doc.fileUrl) {
      const filename = doc.fileUrl.replace('/uploads/', '');
      const filepath = path.join('uploads', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    await Document.findByIdAndDelete(id);
    console.log('Document deleted:', id, 'by:', userId);
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Delete Document Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// All Documents: Approved docs + docs uploaded without approvers (auto-approved)
export const getPublicDocuments = async (req, res) => {
  try {
    const docs = await Document.find({
      $or: [
        { status: 'Approved' },
        { approvers: { $size: 0 } }
      ]
    }).populate('sender', 'name email profilePicture role')
      .populate('approvers', 'name email role')
      .populate('approvalsReceived', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, documents: docs });
  } catch (err) {
    console.error('Get Public Docs Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

