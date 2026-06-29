import { getActiveToken } from './context/AuthContext';

const API_BASE_URL = 'http://localhost:5000/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
// Read from the module-level variable in AuthContext — always in sync with
// React state, with NO timing race against useEffect / localStorage writes.
const authHeaders = () => {
  const token = getActiveToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
};

async function handleResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (HTTP ${res.status})`);
  }
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

// ── Auth API (public — no token needed) ──────────────────────────────────────
export const authAPI = {
  register: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },
};

// ── Protected Resource API ────────────────────────────────────────────────────
export const fetchResources = async () => {
  const res = await fetch(`${API_BASE_URL}/resources`, { headers: authHeaders() });
  return handleResponse(res);
};

export const fetchLogs = async () => {
  const res = await fetch(`${API_BASE_URL}/logs`, { headers: authHeaders() });
  return handleResponse(res);
};

export const onboardAccount = async (accountData) => {
  const res = await fetch(`${API_BASE_URL}/accounts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(accountData),
  });
  return handleResponse(res);
};

export const markForDeletion = async (resourceId) => {
  const res = await fetch(`${API_BASE_URL}/resources/${resourceId}/mark-delete`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const exemptResource = async (resourceId) => {
  const res = await fetch(`${API_BASE_URL}/resources/${resourceId}/exempt`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const triggerManualScan = async () => {
  const res = await fetch(`${API_BASE_URL}/scan`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const deleteResourceOnTheSpot = async (resourceId) => {
  const res = await fetch(`${API_BASE_URL}/resources/${resourceId}/delete`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const fetchAccounts = async () => {
  const res = await fetch(`${API_BASE_URL}/accounts`, { headers: authHeaders() });
  return handleResponse(res);
};

export const disconnectAccount = async () => {
  const res = await fetch(`${API_BASE_URL}/accounts`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
};