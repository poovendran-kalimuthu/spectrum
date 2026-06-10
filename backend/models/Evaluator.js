import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const evaluatorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  pin: { type: String, required: true },   // bcrypt-hashed 4-6 digit PIN
  assignedRounds: [{
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    roundNumber: { type: Number, required: true }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Hash PIN before saving
evaluatorSchema.pre('save', async function (next) {
  if (!this.isModified('pin')) return next();
  this.pin = await bcrypt.hash(this.pin, 10);
  next();
});

// Compare PIN method
evaluatorSchema.methods.matchPin = async function (enteredPin) {
  return await bcrypt.compare(enteredPin, this.pin);
};

const Evaluator = mongoose.model('Evaluator', evaluatorSchema);
export default Evaluator;
