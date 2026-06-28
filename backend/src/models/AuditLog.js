const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  awsAccountId: { type: String, required: true },
  resourceId: { type: String, required: true },
  resourceType: { type: String, required: true },
  region: { type: String, required: true },
  action: { type: String, enum: ['DISCOVERED', 'MARKED_FOR_DELETION', 'EXEMPTED', 'DELETED', 'DELETION_FAILED'], required: true },
  savingsRealized: { type: Number, default: 0 },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);