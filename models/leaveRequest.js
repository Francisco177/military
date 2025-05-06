const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  rank: { type: String, required: true },
  unit: { type: String, required: true },
  leaveType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  officerName: String,
  serviceNumber: String,
  relationship: String,
  address: String,
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
