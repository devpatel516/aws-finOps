const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  accountName: { type: String, required: true },
  awsAccountId: { type: String, required: true, unique: true },
  accessKeyId: { type: String, required: true },
  secretAccessKey: { type: String, required: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Account', AccountSchema);