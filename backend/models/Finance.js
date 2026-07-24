import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  category: {
    type: String,
    required: true,
    enum: ['Marketing', 'Logistics', 'Catering', 'Prizes', 'Operations', 'Miscellaneous', 'Events'],
    default: 'Miscellaneous'
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const financeSchema = new mongoose.Schema({
  allottedBudget: {
    type: Number,
    required: true,
    default: 100000,
    min: [0, 'Allotted budget cannot be negative']
  },
  expenses: [expenseSchema]
}, { timestamps: true });

const Finance = mongoose.model('Finance', financeSchema);
export default Finance;
