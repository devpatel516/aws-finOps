const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Account = require('../models/Account');
const { runGlobalScanEngine } = require('../workers/orchestrator');

// ── Helper: sign a JWT ──────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ── POST /api/auth/register ─────────────────────────────────────────────────
// Creates a new user account. Optionally onboards an AWS account at the same time.
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      // Optional AWS credentials — if provided, onboard account immediately
      accountName,
      awsAccountId,
      accessKeyId,
      secretAccessKey,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Create user (pre-save hook hashes the password)
    const user = await User.create({ name, email, passwordHash: password });

    // Optionally onboard AWS account right away
    let account = null;
    if (awsAccountId && accessKeyId && secretAccessKey) {
      account = await Account.create({
        ownerId: user._id,
        accountName: accountName || `${name}'s AWS Account`,
        awsAccountId,
        accessKeyId,
        secretAccessKey,
      });

      // 🔒 Only scan this specific account, not all accounts in the DB
      runGlobalScanEngine([awsAccountId]).catch(err => console.error('Initial scan error:', err));
    }

    const token = signToken(user);

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accountOnboarded: !!account,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user and include passwordHash (stripped by toJSON by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────────────────────
// Returns current user info from token (no DB hit needed)
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token.' });
  }
  try {
    const decoded = require('jsonwebtoken').verify(
      authHeader.split(' ')[1],
      process.env.JWT_SECRET
    );
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

module.exports = router;
