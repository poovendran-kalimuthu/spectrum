import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // Optional: feedback can be about the site only
  eventRating: { type: Number, min: 1, max: 5 },
  siteRating: { type: Number, min: 1, max: 5, required: true },
  eventComments: { type: String, default: '' },
  siteComments: { type: String, default: '' },
  siteTechnicalIssues: { type: String, default: '' },
  suggestions: { type: String, default: '' },
  overallSatisfaction: { type: Number, min: 1, max: 5 },
  recommendation: { type: Number, min: 1, max: 5 },
  preferredNextEvent: { type: String, default: '' }
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
