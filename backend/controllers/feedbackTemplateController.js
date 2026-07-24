import FeedbackTemplate from '../models/FeedbackTemplate.js';

// @desc    Create a feedback template
// @route   POST /api/feedback/templates
// @access  Private/Admin
export const createTemplate = async (req, res) => {
  try {
    const { title, description, fields } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Template title is required' });
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one question field is required' });
    }

    const template = await FeedbackTemplate.create({
      title: title.trim(),
      description: description?.trim() || '',
      fields,
      createdBy: req.user._id
    });

    await template.populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all feedback templates
// @route   GET /api/feedback/templates
// @access  Private/Admin
export const getAllTemplates = async (req, res) => {
  try {
    const templates = await FeedbackTemplate.find()
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get a single feedback template by ID
// @route   GET /api/feedback/templates/:id
// @access  Private/Admin
export const getTemplateById = async (req, res) => {
  try {
    const template = await FeedbackTemplate.findById(req.params.id).populate('createdBy', 'name email');
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a feedback template
// @route   DELETE /api/feedback/templates/:id
// @access  Private/Admin
export const deleteTemplate = async (req, res) => {
  try {
    const template = await FeedbackTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.status(200).json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
