const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5199'

// Utility: add JWT if present
function authHeaders(extra = {}) {
  const token = localStorage.getItem('token')
  return {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extra
  }
}

/* ---------- AUTH ---------- */
export async function login(email, password) {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function register(email, password) {
  const r = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

/* ---------- CANDIDATES ---------- */
export async function uploadCandidate(formData) {
  const r = await fetch(`${BASE}/api/candidates`, {
    method: 'POST',
    headers: authHeaders(), // no content-type for FormData
    body: formData
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function listCandidates() {
  const r = await fetch(`${BASE}/api/candidates`, { headers: authHeaders() })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

/* ---------- ROLES ---------- */
export async function extractSkills(title, description) {
  const r = await fetch(`${BASE}/api/roles/extract`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title, description })
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function createRole(payload) {
  const r = await fetch(`${BASE}/api/roles`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function listRoles() {
  const r = await fetch(`${BASE}/api/roles`, { headers: authHeaders() })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

/* ---------- SCREENING ---------- */
export async function screenCandidate(candidateId, roleId) {
  const r = await fetch(`${BASE}/api/screen`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ candidateId, roleId })
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function screenHistory(candidateId) {
  const r = await fetch(`${BASE}/api/screen/${candidateId}`, {
    headers: authHeaders()
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

/* ---------- ATS ---------- */
export async function atsReportByCandidate(candidateId) {
  const r = await fetch(`${BASE}/api/ats/report`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ candidateId })
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function atsScoreByCandidate(candidateId) {
  const r = await fetch(`${BASE}/api/ats/score`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ candidateId })
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}
export async function forgotPassword(email) {
  const r = await fetch(`${BASE}/api/auth/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json() // { ok:true, resetToken? }
}

export async function resetPassword(token, password, confirmPassword) {
  const r = await fetch(`${BASE}/api/auth/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password, confirmPassword })
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json() // { ok:true }
}
// Add this to your existing api.js
export async function precheckCandidate(candidateId, roleId) {
  const r = await fetch(`${BASE}/api/precheck`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateId, roleId })
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}