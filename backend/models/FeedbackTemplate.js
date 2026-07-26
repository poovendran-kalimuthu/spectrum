import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  id:          { type: String, required: true },
  label:       { type: String, required: true },
  type: {
    type: String,
    enum: [
      // Text inputs
      'text', 'textarea', 'number', 'email', 'phone', 'url',
      // Selection
      'dropdown', 'radio', 'checkbox', 'multiple_choice', 'yes_no',
      // Rating & Scale
      'rating', 'rating_scale', 'emoji_rating', 'slider', 'nps',
      // Grid / Likert
      'likert', 'matrix',
      // Date / Time / File
      'date', 'time', 'file_upload'
    ],
    default: 'text'
  },
  required:    { type: Boolean, default: false },
  placeholder: { type: String, default: '' },

  // Options — for dropdown, radio, checkbox, multiple_choice
  options:     { type: [String], default: undefined },

  // Range — for slider, rating_scale, nps
  min:         { type: Number },
  max:         { type: Number },
  step:        { type: Number },

  // Likert scale labels (e.g. ['Strongly Disagree', ..., 'Strongly Agree'])
  scaleLabels: { type: [String], default: undefined },

  // Matrix — row question labels and column labels
  rows:        { type: [String], default: undefined },
  columns:     { type: [String], default: undefined },
}, { _id: false });

const feedbackTemplateSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  fields:      { type: [fieldSchema], default: [] },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const FeedbackTemplate = mongoose.model('FeedbackTemplate', feedbackTemplateSchema);
export default FeedbackTemplate;
