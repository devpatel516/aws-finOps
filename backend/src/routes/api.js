const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Resource = require('../models/Resource');
const AuditLog = require('../models/AuditLog');
const { runGlobalScanEngine } = require('../workers/orchestrator');

// Add a New AWS Onboarding Target Profile
router.post('/accounts', async (req, res) => {
  try {
    const account = await Account.create(req.body);
    res.status(201).json({ message: 'AWS Account integration context verified and onboarded.', account });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// View active onboarding target profiles
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await Account.find({}, '-secretAccessKey');
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Discovered Active Waste Metrics
router.get('/resources', async (req, res) => {
  try {
    const resources = await Resource.find({ status: { $in: ['detected', 'marked_for_deletion'] } }).sort({ monthlyCost: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stage a target resource payload for scheduled deletion
router.post('/resources/:id/mark-delete', async (req, res) => {
  try {
    const resource = await Resource.findOneAndUpdate(
      { resourceId: req.params.id },
      { status: 'marked_for_deletion', markedForDeletionAt: new Date() },
      { new: true }
    );
    if (!resource) return res.status(404).json({ error: 'Target resource matching index missing.' });

    await AuditLog.create({
      awsAccountId: resource.awsAccountId,
      resourceId: resource.resourceId,
      resourceType: resource.resourceType,
      region: resource.region,
      action: 'MARKED_FOR_DELETION',
      details: 'Flagged manually by administrator via client portal interface.'
    });

    res.json({ message: 'Resource staged for removal successfully.', resource });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Whitelist a specific infrastructure asset context from policies
router.post('/resources/:id/exempt', async (req, res) => {
  try {
    const resource = await Resource.findOneAndUpdate(
      { resourceId: req.params.id },
      { status: 'exempt', markedForDeletionAt: null },
      { new: true }
    );
    if (!resource) return res.status(404).json({ error: 'Target resource context matching index missing.' });

    await AuditLog.create({
      awsAccountId: resource.awsAccountId,
      resourceId: resource.resourceId,
      resourceType: resource.resourceType,
      region: resource.region,
      action: 'EXEMPTED',
      details: 'Whitelisted manually by administrator.'
    });

    res.json({ message: 'Resource successfully exempted from automated processing rules.', resource });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch system operational timeline histories
router.get('/logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger a manual sweep on-demand bypassing scheduled hooks
router.post('/scan', async (req, res) => {
  try {
    runGlobalScanEngine(); // Asynchronous running execution context background process
    res.json({ message: 'Global structural scan task pipeline spawned successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;