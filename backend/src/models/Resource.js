const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  awsAccountId: { type: String, required: true },
  resourceId: { type: String, required: true, unique: true },
  resourceType: { type: String, enum: ['EBS_VOLUME', 'ELASTIC_IP', 'STOPPED_EC2'], required: true },
  region: { type: String, required: true },
  monthlyCost: { type: Number, required: true },
  status: { type: String, enum: ['detected', 'marked_for_deletion', 'exempt', 'deleted'], default: 'detected' },
  awsDetails: { type: Object, required: true },
  detectedAt: { type: Date, default: Date.now },
  markedForDeletionAt: { type: Date, default: null },
  remediatedAt: { type: Date, default: null }
});

module.exports = mongoose.model('Resource', ResourceSchema);