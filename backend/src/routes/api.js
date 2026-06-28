const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Resource = require('../models/Resource');
const AuditLog = require('../models/AuditLog');
const { runGlobalScanEngine } = require('../workers/orchestrator');
const { verifyToken, requireRole } = require('../middleware/auth');

// Apply JWT guard to every route in this file
router.use(verifyToken);

// ── Security helper ───────────────────────────────────────────────────────────
/**
 * Returns the AWS Account IDs that belong to req.user.
 * NEVER falls back to an empty filter — if the user owns no accounts
 * we return an explicit empty array so callers can short-circuit with [].
 */
async function getOwnedAwsAccountIds(userId) {
  const accounts = await Account.find({ ownerId: userId }, 'awsAccountId');
  return accounts.map(a => a.awsAccountId);
}

// ── POST /api/accounts ────────────────────────────────────────────────────────
// Onboard a new AWS account — always stamped with the calling user's id
router.post('/accounts', async (req, res) => {
  try {
    const account = await Account.create({ ...req.body, ownerId: req.user.id });
    res.status(201).json({ message: 'AWS Account integration context verified and onboarded.', account });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ── GET /api/accounts ─────────────────────────────────────────────────────────
// Only returns accounts owned by the authenticated user — secret key excluded
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await Account.find({ ownerId: req.user.id }, '-secretAccessKey');
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/resources ────────────────────────────────────────────────────────
// SECURITY: scoped strictly to the authenticated user's AWS accounts.
// If the user has no accounts, we return [] — never fall through to all data.
router.get('/resources', async (req, res) => {
  try {
    const ownedIds = await getOwnedAwsAccountIds(req.user.id);

    // 🔒 User has no connected accounts — return empty, never expose others' data
    if (ownedIds.length === 0) return res.json([]);

    const resources = await Resource.find({
      awsAccountId: { $in: ownedIds },                       // ownership enforced
      status: { $in: ['detected', 'marked_for_deletion'] },
    }).sort({ monthlyCost: -1 });

    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/resources/:id/mark-delete ───────────────────────────────────────
// SECURITY: ownership is verified in the query filter — a user can only stage
// resources that belong to one of their own AWS accounts.
router.post('/resources/:id/mark-delete', requireRole('admin'), async (req, res) => {
  try {
    const ownedIds = await getOwnedAwsAccountIds(req.user.id);

    if (ownedIds.length === 0) {
      return res.status(403).json({ error: 'No AWS accounts connected to your profile.' });
    }

    // 🔒 The awsAccountId filter ensures cross-user tampering is impossible
    const resource = await Resource.findOneAndUpdate(
      {
        resourceId: req.params.id,
        awsAccountId: { $in: ownedIds },  // ownership check
      },
      { status: 'marked_for_deletion', markedForDeletionAt: new Date() },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found or you do not have permission to modify it.' });
    }

    await AuditLog.create({
      awsAccountId: resource.awsAccountId,
      resourceId: resource.resourceId,
      resourceType: resource.resourceType,
      region: resource.region,
      action: 'MARKED_FOR_DELETION',
      details: `Flagged manually by ${req.user.email} via client portal interface.`,
    });

    res.json({ message: 'Resource staged for removal successfully.', resource });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/resources/:id/exempt ────────────────────────────────────────────
// SECURITY: same ownership check — only the account owner can exempt a resource.
router.post('/resources/:id/exempt', requireRole('admin'), async (req, res) => {
  try {
    const ownedIds = await getOwnedAwsAccountIds(req.user.id);

    if (ownedIds.length === 0) {
      return res.status(403).json({ error: 'No AWS accounts connected to your profile.' });
    }

    // 🔒 Ownership enforced via awsAccountId filter
    const resource = await Resource.findOneAndUpdate(
      {
        resourceId: req.params.id,
        awsAccountId: { $in: ownedIds },  // ownership check
      },
      { status: 'exempt', markedForDeletionAt: null },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found or you do not have permission to modify it.' });
    }

    await AuditLog.create({
      awsAccountId: resource.awsAccountId,
      resourceId: resource.resourceId,
      resourceType: resource.resourceType,
      region: resource.region,
      action: 'EXEMPTED',
      details: `Whitelisted manually by ${req.user.email}.`,
    });

    res.json({ message: 'Resource successfully exempted from automated processing rules.', resource });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/logs ─────────────────────────────────────────────────────────────
// SECURITY: scoped strictly to the authenticated user's AWS accounts.
// If the user has no accounts, return [] — never expose others' audit logs.
router.get('/logs', async (req, res) => {
  try {
    const ownedIds = await getOwnedAwsAccountIds(req.user.id);

    // 🔒 No accounts → no logs (never fall through to global query)
    if (ownedIds.length === 0) return res.json([]);

    const logs = await AuditLog.find({
      awsAccountId: { $in: ownedIds },  // ownership enforced
    }).sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/scan ────────────────────────────────────────────────────────────
// SECURITY: only scans accounts belonging to the authenticated user,
// not all accounts in the database.
router.post('/scan', requireRole('admin'), async (req, res) => {
  try {
    const ownedIds = await getOwnedAwsAccountIds(req.user.id);

    if (ownedIds.length === 0) {
      return res.status(400).json({ error: 'No AWS accounts connected. Please connect an account first.' });
    }

    // Pass the user's account IDs so the engine only scans their accounts
    runGlobalScanEngine(ownedIds).catch(err =>
      console.error('Background scan error:', err.message)
    );

    res.json({ message: 'Scan triggered for your connected AWS accounts.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;