import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCandidates, listRoles, screenCandidate, precheckCandidate } from '../api'

function useQuery() {
  return new URLSearchParams(window.location.search)
}

export default function Screening() {
  const q = useQuery()
  const navigate = useNavigate()

  const ROLES_PATH = '/roles' // route for JobRoles page

  const [cands, setCands] = useState([])
  const [roles, setRoles] = useState([])
  const [candidateId, setCandidateId] = useState(q.get('candidateId') || '')
  const [roleId, setRoleId] = useState(q.get('roleId') || '')
  const [res, setRes] = useState(null) // combined analysis from backend
  const [loading, setLoading] = useState(false)
  const [warning, setWarning] = useState(null)

  // Precheck state
  const [precheck, setPrecheck] = useState(null)
  const [prechecking, setPrechecking] = useState(false)

  const noRoles = roles.length === 0
  const key = useMemo(() => `precheck:v1:${candidateId}:${roleId}`, [candidateId, roleId])

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
          const go = window.confirm('You have not added any Job Roles yet. Create one now to run screening?')
          if (go) navigate(ROLES_PATH)
        }
      } catch (err) {
        setWarning(String(err))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Restore cached precheck (one-time per candidate+role)
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
      const go = window.confirm('No roles available. Add a Job Role now?')
      if (go) navigate(ROLES_PATH)
      return
    }

    // Require precheck once unless user overrides
    if (!precheck && !force) {
      const go = window.confirm('Run a quick precheck first? It shows missing must-haves before using AI.')
      if (go) return runPrecheck()
    }

    setLoading(true)
    setWarning(null)
    setRes(null)
    try {
      // screenCandidate now returns a combined object:
      // {
      //   score, summary,
      //   matched_must, missing_must,
      //   matched_good, missing_good,
      //   cv_suggestions, role_specific_gaps, flags,
      //   ats: { score, issues, suggestions, signals:{} }
      // }
      const r = await screenCandidate(candidateId, roleId)
      setRes(r)
    } catch (err) {
      setWarning(String(err))
    } finally {
      setLoading(false)
    }
  }

  const Stat = ({ label, value, strong=false }) => (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-base ${strong ? 'font-bold' : 'font-medium'}`}>{value}</span>
    </div>
  )

  const PillList = ({ items = [] }) => {
    if (!items.length) return <span className="text-slate-500">None</span>
    return (
      <div className="mt-1 flex flex-wrap gap-2">
        {items.map(s => <span key={s} className="pill">{s}</span>)}
      </div>
    )
  }

  const List = ({ items = [] }) => {
    if (!items.length) return <p className="text-slate-600">None</p>
    return (
      <ul className="list-disc list-inside space-y-1 text-slate-800">
        {items.map((v, i) => <li key={i}>{v}</li>)}
      </ul>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Screening</h2>

        {warning && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 mb-3">
            {warning}
          </div>
        )}

        {/* If zero roles */}
        {noRoles && (
          <div className="rounded-xl border border-blue-300 bg-blue-50 text-blue-800 px-4 py-3 mb-4">
            <div className="flex items-center justify-between gap-3">
              <span>You haven’t added any Job Roles yet. Create one to run screening.</span>
              <button className="btn btn-sm" onClick={() => navigate(ROLES_PATH)}>Add a Job Role</button>
            </div>
          </div>
        )}

        {/* Precheck banner */}
        {!noRoles && !precheck && (
          <div className="rounded-xl border border-blue-300 bg-blue-50 text-blue-800 px-4 py-3 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <span>Run a quick precheck to see if the CV meets the role’s minimum requirements (must-have skills, etc.).</span>
              <div className="flex gap-2">
                <button className="btn btn-sm" onClick={runPrecheck} disabled={prechecking || !candidateId || !roleId}>
                  {prechecking ? 'Checking…' : 'Run Precheck (free)'}
                </button>
                <button className="btn btn-sm" onClick={() => onRun(true)} disabled={prechecking}>Skip & Run AI</button>
              </div>
            </div>
          </div>
        )}

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

      {/* Precheck results card */}
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
                      <PillList items={precheck.missing.must} />
                    </>
                  ) : null}
                  {precheck.missing?.certs?.length ? (
                    <>
                      <h4 className="font-semibold mt-3">Missing required certifications</h4>
                      <PillList items={precheck.missing.certs} />
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

      {/* Screening result (detailed) */}
      {res && (
        <div className="card">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-lg font-semibold">Screening result</h3>
            <div className="flex gap-6">
              <Stat label="Fit score" value={`${res.score ?? 0}/100`} strong />
              <Stat label="ATS score" value={`${res.ats?.score ?? 0}/100`} />
            </div>
          </div>

          {res.summary ? (
            <p className="text-slate-800 mb-4">{res.summary}</p>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills breakdown */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Must-have skills</h4>
                <div className="mt-2 rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium text-emerald-700">Present</div>
                    <PillList items={res.matched_must || []} />
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-medium text-amber-700">Missing</div>
                    <PillList items={res.missing_must || []} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold">Good-to-have skills</h4>
                <div className="mt-2 rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium text-emerald-700">Present</div>
                    <PillList items={res.matched_good || []} />
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-medium text-amber-700">Missing</div>
                    <PillList items={res.missing_good || []} />
                  </div>
                </div>
              </div>
            </div>

            {/* Gaps & suggestions */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Role-specific gaps</h4>
                <div className="mt-2 rounded-lg border p-3">
                  <List items={res.role_specific_gaps || []} />
                </div>
              </div>

              <div>
                <h4 className="font-semibold">Concrete CV suggestions</h4>
                <div className="mt-2 rounded-lg border p-3">
                  <List items={res.cv_suggestions || []} />
                </div>
              </div>

              {res.flags?.length ? (
                <div>
                  <h4 className="font-semibold">Flags / risks</h4>
                  <div className="mt-2 rounded-lg border p-3">
                    <List items={res.flags} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* ATS section */}
          <div className="mt-6">
            <h4 className="font-semibold">ATS audit</h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium mb-1">Issues</div>
                <List items={res.ats?.issues || []} />
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium mb-1">Suggestions</div>
                <List items={res.ats?.suggestions || []} />
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium mb-1">Signals</div>
                <div className="text-sm text-slate-700 space-y-1">
                  <div>Has Email: <b>{String(res.ats?.signals?.hasEmail ?? false)}</b></div>
                  <div>Has Phone: <b>{String(res.ats?.signals?.hasPhone ?? false)}</b></div>
                  <div>Has Summary: <b>{String(res.ats?.signals?.hasSummary ?? false)}</b></div>
                  <div>Has Experience: <b>{String(res.ats?.signals?.hasExperience ?? false)}</b></div>
                  <div>Has Education: <b>{String(res.ats?.signals?.hasEducation ?? false)}</b></div>
                  <div>Has Skills: <b>{String(res.ats?.signals?.hasSkills ?? false)}</b></div>
                  {'bulletCount' in (res.ats?.signals || {}) && (
                    <div>Bullet Count: <b>{res.ats.signals.bulletCount}</b></div>
                  )}
                  {'estimatedWords' in (res.ats?.signals || {}) && (
                    <div>Estimated Words: <b>{res.ats.signals.estimatedWords}</b></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button className="btn" onClick={() => onRun(true)}>Re-run screening</button>
            <button className="btn btn-outline" onClick={() => navigate(ROLES_PATH)}>Adjust role</button>
          </div>
        </div>
      )}
    </div>
  )
}
