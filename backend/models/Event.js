import mongoose from 'mongoose';

const criteriaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  maxScore: { type: Number, required: true, default: 10 }
}, { _id: false });

const roundConfigSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  name: { type: String, default: '' },
  evaluationType: { type: String, enum: ['admin', 'jury'], default: 'admin' },
  criteria: [criteriaSchema],
  maxAdvance: { type: Number, default: 0 } // 0 means no limit
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, default: '' },
  slug: { type: String, unique: true, sparse: true },
  noOfDays: { type: Number, default: 1 },
  dates: [{ type: Date }],
  teamSizeLimit: { type: Number, default: 4 },
  rounds: { type: Number, default: 1 },           // total number of rounds (for backward compat)
  roundConfig: [roundConfigSchema],               // per-round evaluation config
  maxShortlisted: { type: Number, default: 0 },   // 0 means no limit
  numberOfWinners: { type: Number, default: 3 },  // How many winners to select
  session: { type: String, enum: ['none', 'day1_morning', 'day1_afternoon', 'day2_morning'], default: 'none' },
  imageUrl: { type: String },
  isPublished: { type: Boolean, default: false },
  isRegistrationOpen: { type: Boolean, default: true },
  isSubmissionOpen: { type: Boolean, default: false },
  isTeamChangeAllowed: { type: Boolean, default: true },
  activeAttendance: {
    round: { type: Number, default: 0 },
    sessionToken: { type: String, default: '' },
    createdAt: { type: Date }
  },
  attendanceMode: { 
    type: String, 
    enum: ['student_scan', 'admin_scan', 'both'], 
    default: 'student_scan' 
  },
  eventType: { type: String, enum: ['micro', 'macro', 'internal'], default: 'micro' },
  parentEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  category: { type: String, enum: ['Technical', 'Workshop', 'Non-Technical', 'None'], default: 'None' },
  macroCountLimit: { type: Number, default: 0 },
  resourcePerson: { type: String, default: '' },
  contactDetails: { type: String, default: '' },
  coordinators: [{
    name: { type: String },
    email: { type: String },
    role: { type: String, default: 'Organizer' },
    avatar: { type: String }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

eventSchema.pre('save', async function(next) {
  if (this.isModified('title') || !this.slug) {
    let baseSlug = slugify(this.title);
    let uniqueSlug = baseSlug;
    let count = 1;
    while (await mongoose.model('Event').findOne({ slug: uniqueSlug, _id: { $ne: this._id } })) {
      uniqueSlug = `${baseSlug}-${count++}`;
    }
    this.slug = uniqueSlug;
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);
export default Event;
