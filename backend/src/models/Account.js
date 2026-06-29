const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../config/crypto');

const AccountSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  accountName: { type: String, required: true },
  awsAccountId: { type: String, required: true, unique: true },
  accessKeyId: { 
    type: String, 
    required: true,
    get: decrypt,
    set: encrypt
  },
  secretAccessKey: { 
    type: String, 
    required: true,
    get: decrypt,
    set: encrypt
  },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('Account', AccountSchema);