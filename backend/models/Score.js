import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'Evaluator', required: true },
  registration: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  roundNumber: { type: Number, required: true },
  scores: [{
    criteriaName: { type: String, required: true },
    score: { type: Number, required: true }
  }],
  totalScore: { type: Number, default: 0 },
  remarks: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Unique constraint: one scoresheet per evaluator per team per round
scoreSchema.index({ evaluator: 1, registration: 1, roundNumber: 1 }, { unique: true });

const Score = mongoose.model('Score', scoreSchema);
export default Score;
