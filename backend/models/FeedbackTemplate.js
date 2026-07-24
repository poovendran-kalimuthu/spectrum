import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  id: { type: String, required: true },           // unique field key, e.g. "q1"
  label: { type: String, required: true },         // question text
  type: {
    type: String,
    enum: ['rating', 'text', 'textarea'],
    default: 'text'
  },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: '' }
}, { _id: false });

const feedbackTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  fields: { type: [fieldSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const FeedbackTemplate = mongoose.model('FeedbackTemplate', feedbackTemplateSchema);
export default FeedbackTemplate;
