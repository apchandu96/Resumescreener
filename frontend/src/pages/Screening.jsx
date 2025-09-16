import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCandidates, listRoles, screenCandidate, precheckCandidate } from '../api'
import { AlertTriangle } from 'lucide-react'

function useQuery() {
  return new URLSearchParams(window.location.search)
}

export default function Screening() {
  const q = useQuery()
  const navigate = useNavigate()

  const ROLES_PATH = '/roles'

  const [cands, setCands] = useState([])
  const [roles, setRoles] = useState([])
  const [candidateId, setCandidateId] = useState(q.get('candidateId') || '')
  const [roleId, setRoleId] = useState(q.get('roleId') || '')
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [warning, setWarning] = useState(null)

  // Precheck state
  const [precheck, setPrecheck] = useState(null)
  const [prechecking, setPrechecking] = useState(false)

  const noRoles = roles.length === 0
  const key = useMemo(() => `precheck:v1:${candidateId}:${roleId}`, [candidateId, roleId])

  // Modal state
  const [modal, setModal] = useState({ open: false, title: '', description: '', onConfirm: null })

  // Load candidates + roles
  useEffect(() => {
    (async () => {
      try {
        const [cs, rs] = await Promise.all([listCandidates(), listRoles()])
        setCands(cs)
        setRoles(rs)
        if (!candidateId && cs.length) setCandidateId(cs[0]._id)
        if (!roleId && rs.length) setRoleId(rs[0]._id)
        if (!rs.length) {
          setModal({
            open: true,
            title: 'No Job Roles yet',
            description: 'You have not added any Job Roles. Create one now to run screening.',
            onConfirm: () => navigate(ROLES_PATH),
          })
        }
      } catch (err) {
        setWarning(String(err))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Restore cached precheck
  useEffect(() => {
    setPrecheck(null)
    if (!candidateId || !roleId) return
    const cached = localStorage.getItem(key)
    if (cached) {
      try { setPrecheck(JSON.parse(cached)) } catch {}
    }
  }, [key, candidateId, roleId])

  const runPrecheck = async () => {
    if (!candidateId) return alert('Select a CV')
    if (!roleId) return alert('Select a role')

    setPrechecking(true)
    setWarning(null)
    try {
      const result = await precheckCandidate(candidateId, roleId)
      setPrecheck(result)
      localStorage.setItem(key, JSON.stringify({ ...result, ts: Date.now() }))
    } catch (err) {
      setWarning(String(err))
    } finally {
      setPrechecking(false)
    }
  }

  const clearPrecheck = () => {
    localStorage.removeItem(key)
    setPrecheck(null)
  }

  const onRun = async (force = false) => {
    if (!candidateId) return alert('Please select a CV')
    if (!roleId) {
      setModal({
        open: true,
        title: 'No roles available',
        description: 'Add a Job Role now to proceed with screening.',
        onConfirm: () => navigate(ROLES_PATH),
      })
      return
    }

    if (!precheck && !force) {
      setModal({
        open: true,
        title: 'Run Precheck first?',
        description: 'Precheck shows missing must-haves before using AI. Would you like to run it first?',
        onConfirm: runPrecheck,
      })
      return
    }

    setLoading(true)
    setWarning(null)
    setRes(null)
    try {
      const r = await screenCandidate(candidateId, roleId)
      setRes(r)
    } catch (err) {
      setWarning(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Screening</h2>

        {warning && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        {/* CV + Role selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="cv">Select your CV</label>
            <select
              id="cv"
              className="input"
              value={candidateId}
              onChange={e => setCandidateId(e.target.value)}
            >
              {cands.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.yearsExperience || 0} yrs)
                </option>
              ))}
            </select>
            {cands.length === 0 && (
              <p className="text-xs text-slate-500 mt-1">No candidates yet. Upload a CV to begin.</p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="role">Select a role</label>
            <select
              id="role"
              className="input"
              value={roleId}
              onChange={e => setRoleId(e.target.value)}
              disabled={noRoles}
            >
              {roles.map(r => (
                <option key={r._id} value={r._id}>{r.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <button className="btn" onClick={() => onRun(false)} disabled={loading || noRoles}>
            {loading ? 'Scoring…' : 'Run screening'}
          </button>
          <button className="btn btn-outline" onClick={runPrecheck} disabled={prechecking || !candidateId || !roleId}>
            {prechecking ? 'Checking…' : (precheck ? 'Re-run Precheck' : 'Run Precheck (free)')}
          </button>
          {precheck && (
            <button className="btn btn-ghost" onClick={clearPrecheck} title="Clear cached precheck">
              Clear Precheck
            </button>
          )}
        </div>
      </div>

      {/* ===== Precheck results card ===== */}
      {precheck && (
        <div className={`card border ${precheck.pass ? 'border-emerald-300' : 'border-amber-300'}`}>
          <h3 className="text-lg font-semibold mb-2">Precheck Result</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className={`text-3xl font-extrabold ${precheck.pass ? 'text-emerald-700' : 'text-amber-700'}`}>
                {precheck.pass ? 'Pass' : 'Needs Attention'}
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Must-have coverage: <b>{Math.round((precheck.coverage?.must || 0) * 100)}%</b> &middot; Good-to-have: <b>{Math.round((precheck.coverage?.good || 0) * 100)}%</b>
              </p>
              {precheck.checks && precheck.checks.minYearsRequired ? (
                <p className="text-sm text-slate-600 mt-1">
                  Experience: {precheck.checks.candidateYears} yrs (req. {precheck.checks.minYearsRequired}+) — {precheck.checks.yearsOk ? 'OK' : 'Not met'}
                </p>
              ) : null}
            </div>

            <div className="md:col-span-2">
              {(precheck.missing?.must?.length || precheck.missing?.certs?.length) ? (
                <>
                  {precheck.missing?.must?.length ? (
                    <>
                      <h4 className="font-semibold">Missing must-have skills</h4>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {precheck.missing.must.map(s => <span key={s} className="pill">{s}</span>)}
                      </div>
                    </>
                  ) : null}
                  {precheck.missing?.certs?.length ? (
                    <>
                      <h4 className="font-semibold mt-3">Missing required certifications</h4>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {precheck.missing.certs.map(s => <span key={s} className="pill">{s}</span>)}
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <p className="text-slate-700">All minimum requirements appear present.</p>
              )}

              {(precheck.notes || []).length ? (
                <ul className="mt-3 list-disc list-inside text-slate-700">
                  {precheck.notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {!precheck.pass && (
              <button className="btn btn-outline" onClick={() => navigate(ROLES_PATH)}>
                Edit Role Requirements
              </button>
            )}
            <button className="btn" onClick={() => onRun(true)}>
              Proceed to AI screening
            </button>
          </div>
        </div>
      )}

      {/* ===== AI Screening Results ===== */}
      {res && (
        <div className="card border border-slate-200">
          <h3 className="text-lg font-semibold mb-2">AI Screening Result</h3>
          <p className="mb-2 text-slate-700">{res.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold">Matched Must-haves</h4>
              <ul className="list-disc list-inside text-sm">
                {res.matched_must?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>

              <h4 className="font-semibold mt-3">Missing Must-haves</h4>
              <ul className="list-disc list-inside text-sm text-red-600">
                {res.missing_must?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Matched Good-to-haves</h4>
              <ul className="list-disc list-inside text-sm">
                {res.matched_good?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>

              <h4 className="font-semibold mt-3">Missing Good-to-haves</h4>
              <ul className="list-disc list-inside text-sm text-red-600">
                {res.missing_good?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>

          {res.cv_suggestions?.length ? (
            <div className="mt-4">
              <h4 className="font-semibold">Suggestions to improve CV</h4>
              <ul className="list-disc list-inside text-sm">
                {res.cv_suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          ) : null}

          {res.role_specific_gaps?.length ? (
            <div className="mt-4">
              <h4 className="font-semibold">Role-specific gaps</h4>
              <ul className="list-disc list-inside text-sm">
                {res.role_specific_gaps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {/* Modal */}
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        description={modal.description}
        confirmText="OK"
        onCancel={() => setModal({ open: false })}
        onConfirm={() => {
          modal.onConfirm?.()
          setModal({ open: false })
        }}
      />
    </div>
  )
}

function ConfirmModal({ open, title, description, confirmText = 'Confirm', cancelText = 'Cancel', onCancel, onConfirm }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button className="btn btn-sm btn-outline" onClick={onCancel}>{cancelText}</button>
          <button className="btn btn-sm bg-slate-900 text-white hover:bg-slate-800" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
