import mongoose from 'mongoose';

const projectSubmissionSchema = new mongoose.Schema({
  registration: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  projectTitle: { type: String, required: true },
  problemStatement: { type: String, required: true },
  targetUsers: { type: String, required: true },
  proposedSolution: { type: String, required: true },
  uniqueFactor: { type: String, required: true },
  revenueModel: { type: String, required: true },
  problemValidation: { type: String, required: true },
  feasibility: { type: String, required: true },
  workflow: { type: String, required: true },
  existingSolutions: { type: String, required: true },
  expectedImpact: { type: String, required: true }
}, { timestamps: true });

const ProjectSubmission = mongoose.model('ProjectSubmission', projectSubmissionSchema);
export default ProjectSubmission;
