import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  microsoftId: {
    type: String,
    sparse: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profilePicture: {
    type: String
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  registerNumber: { type: String },
  department: { type: String },
  year: { type: String },
  section: { type: String },
  mobile: { type: String },
  alternateEmail: { type: String },
  role: {
    type: String,
    enum: ['user', 'mentor', 'superadmin', 'admin_t1', 'admin_t2'],
    default: 'user'
  },
  // Mentor / Mentee sub-system
  subRole: {
    type: String,
    enum: ['student', 'mentor', null],
    default: null
  },
  assignedMentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  mentorStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', null],
    default: null
  },
  adminTeam: {
    type: String,
    enum: ['Editorial', 'Newsletter/Magazine', 'Report', 'Unassigned'],
    default: 'Unassigned'
  },
  adminPosition: {
    type: String,
    default: 'Member'
  },
  settings: {
    language: { type: String, default: 'English (US)' },
    timezone: { type: String, default: 'IST (Indian Standard Time)' },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: false },
    eventUpdates: { type: Boolean, default: true },
    theme: { type: String, default: 'System' },
    compactMode: { type: Boolean, default: false }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;

