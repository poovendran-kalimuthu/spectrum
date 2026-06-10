import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  teamName: { type: String, default: '' },
  teamLeader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Registered'], default: 'Registered' },
    addedAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['Registered', 'Pending', 'Confirmed'], default: 'Registered' },
  isShortlisted: { type: Boolean, default: false },
  isDisqualified: { type: Boolean, default: false },
  currentRound: { type: Number, default: 0 },
  isWinner: { type: Boolean, default: false },
  winnerPosition: { type: String, default: '' },
  attendance: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    round: { type: Number, required: true },
    status: { type: String, enum: ['Present', 'Absent'], default: 'Present' },
    markedBy: { type: String, enum: ['QR', 'Manual'], default: 'QR' },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
