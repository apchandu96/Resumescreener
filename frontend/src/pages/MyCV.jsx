import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MoreVertical, Trash2, Search, ScreenShare, FileText } from 'lucide-react'
import { uploadCandidate, listCandidates, atsReportByCandidate, atsScoreByCandidate, deleteCandidate } from '../api'

export default function MyCV(){
  const navigate = useNavigate()

  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [years, setYears] = useState('')
  const [loading, setLoading] = useState(false)
  const [warning, setWarning] = useState(null)
  const [cands, setCands] = useState([])

  // ATS state per candidate
  const [basicMap, setBasicMap] = useState({})   // candidateId -> basic report
  const [deepMap, setDeepMap] = useState({})     // candidateId -> deep report
  const [deepLoadingId, setDeepLoadingId] = useState(null)
  const [deepErrorId, setDeepErrorId] = useState(null)

  // Deletion state (modal)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [candidateToDelete, setCandidateToDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // action menu state
  const [openMenuId, setOpenMenuId] = useState(null)

  const load = async () => setCands(await listCandidates())
  useEffect(()=>{ load() }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    if(!file || file.type !== 'application/pdf') return alert('Please upload a PDF file')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', name)
    fd.append('yearsExperience', years)

    setLoading(true); setWarning(null)
    try{
      const created = await uploadCandidate(fd)
      setName(''); setYears(''); setFile(null)
      const input = document.getElementById('cv'); if (input) input.value = ''
      await load()

      // Immediately run BASIC report
      if (created?._id) {
        try {
          const report = await atsReportByCandidate(created._id)
          setBasicMap(prev => ({ ...prev, [created._id]: report }))
        } catch (err) {
          // non-fatal; basic report failed
          console.warn("ATS report failed", err)
        }
        
      }
    }catch(err){ setWarning(String(err)) }
    finally{ setLoading(false) }
  }

  const deepDive = async (candidateId) => {
    setDeepErrorId(null)
    setDeepLoadingId(candidateId)
    try{
      const r = await atsScoreByCandidate(candidateId)
      setDeepMap(prev => ({ ...prev, [candidateId]: r }))
    }catch(err){
      setDeepErrorId(candidateId)
      setDeepMap(prev => ({ ...prev, [candidateId]: { error: String(err) } }))
    }finally{
      setDeepLoadingId(null)
    }
  }

  const askDelete = (candidateId) => {
    setCandidateToDelete(candidateId)
    setConfirmOpen(true)
    setOpenMenuId(null)
  }

  const confirmDelete = async () => {
    const candidateId = candidateToDelete
    if (!candidateId) return
    setConfirmOpen(false)
    setDeletingId(candidateId)
    setWarning(null)

    // optimistic update
    const prevCands = cands
    setCands(prev => prev.filter(x => x._id !== candidateId))
    setBasicMap(prev => { const { [candidateId]:_, ...rest } = prev; return rest })
    setDeepMap(prev => { const { [candidateId]:_, ...rest } = prev; return rest })

    try{
      await deleteCandidate(candidateId)
    }catch(err){
      // rollback on failure
      setCands(prevCands)
      setWarning(String(err))
    }finally{
      setDeletingId(null)
      setCandidateToDelete(null)
    }
  }

  const top3 = (arr=[]) => arr.slice(0,3)

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Upload your CV (PDF only)</h2>
        {warning && <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 mb-3">{warning}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="cv">PDF file</label>
            <input id="cv" className="input" type="file" accept=".pdf" onChange={e=>setFile(e.target.files[0]||null)} required/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="name">Title</label>
              <input id="name" className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g., Backend developer CV" required/>
            </div>
            <div>
              <label className="label" htmlFor="years">Years of experience (optional)</label>
              <input id="years" className="input" type="number" min="0" step="1" value={years} onChange={e=>setYears(e.target.value)} placeholder="e.g., 4" required/>
            </div>
          </div>
          <button className="btn btn-primary btn-primary" disabled={loading}>{loading?'Uploading...':'Upload CV'}</button>
        </form>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-3">Your CVs</h3>
        {cands.length === 0 ? <p className="text-slate-600">No CVs yet.</p> : (
          <ul className="space-y-3">
            {cands.map(c => {
              const basic = basicMap[c._id]
              const deep = deepMap[c._id]
              const isDeepLoading = deepLoadingId === c._id
              const deepErr = deepErrorId === c._id && deep?.error
              const isDeleting = deletingId === c._id
              

              return (
                <li key={c._id} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        {c.name}
                      </div>
                      <div className="text-xs text-slate-600">
                        {new Date(c.createdAt).toLocaleString()} • {c.yearsExperience ?? 0} yrs
                      </div>
                    </div>

                    {/* Compact Action Menu */}
                    <ActionMenu
                      open={openMenuId === c._id}
                      onOpen={() => setOpenMenuId(c._id)}
                      onClose={() => setOpenMenuId(null)}
                      items={[
                        {
                          icon: <ScreenShare className="h-4 w-4" />,
                          label: 'Screen CV',
                          onClick: () => navigate(`/screening?candidateId=${c._id}`)
                        },
                        {
                          icon: <Search className="h-4 w-4" />,
                          label: isDeepLoading ? 'Analyzing…' : 'Deep Dive (AI)',
                          disabled: isDeepLoading || isDeleting,
                          onClick: () => deepDive(c._id)
                        },
                        {
                          icon: <Trash2 className="h-4 w-4" />,
                          label: 'Delete CV',
                          destructive: true,
                          onClick: () => askDelete(c._id)
                        }
                      ]}
                    />
                  </div>

                  {/* BASIC (auto after upload) */}
                  {basic && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">ATS Basics</h4>
                        <div className="text-sm">Score: <b>{basic.score}</b></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <div className="text-sm text-slate-600 mb-1">Top issues</div>
                          {basic.issues?.length ? (
                            <ul className="list-disc list-inside text-sm">{top3(basic.issues).map((x,i)=> <li key={i}>{x}</li>)}</ul>
                          ) : <p className="text-sm text-slate-600">No major issues detected.</p>}
                        </div>
                        <div>
                          <div className="text-sm text-slate-600 mb-1">Suggestions</div>
                          {basic.suggestions?.length ? (
                            <ul className="list-disc list-inside text-sm">{top3(basic.suggestions).map((x,i)=> <li key={i}>{x}</li>)}</ul>
                          ) : <p className="text-sm text-slate-600">Looks good!</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DEEP DIVE (on click) */}
                  {deepErr && (
                    <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3">
                      {deep.error}
                    </div>
                  )}
                  {deep && !deep.error && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">ATS Deep Dive (AI)</h4>
                        <div className="text-sm">Score: <b>{deep.score}</b></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <div className="font-semibold">Issues</div>
                          {deep.issues?.length ? (
                            <ul className="list-disc list-inside">{deep.issues.map((x,i)=> <li key={i}>{x}</li>)}</ul>
                          ) : <p className="text-slate-600">No major issues detected.</p>}
                        </div>
                        <div>
                          <div className="font-semibold">Suggestions</div>
                          {deep.suggestions?.length ? (
                            <ul className="list-disc list-inside">{deep.suggestions.map((x,i)=> <li key={i}>{x}</li>)}</ul>
                          ) : <p className="text-slate-600">Looks good!</p>}
                        </div>
                      </div>
                      {deep.signals && (
                        <div className="mt-3 text-xs text-slate-600">
                          Signals: email {String(deep.signals.hasEmail)}, phone {String(deep.signals.hasPhone)}, summary {String(deep.signals.hasSummary)}, experience {String(deep.signals.hasExperience)}, education {String(deep.signals.hasEducation)}, skills {String(deep.signals.hasSkills)} • bullets {deep.signals.bulletCount} • words {deep.signals.estimatedWords}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Confirm delete modal */}
      <ConfirmModal
        open={confirmOpen}
        title="Delete CV?"
        description="This action will permanently remove the CV and related screening results."
        confirmText="Delete"
        onCancel={() => { setConfirmOpen(false); setCandidateToDelete(null) }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

/* ---------- UI helpers ---------- */

function ActionMenu({ open, onOpen, onClose, items = [] }) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={open ? onClose : onOpen}
        className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
        title="Actions"
      >
        <MoreVertical className="h-5 w-5 text-slate-600" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-44 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-10"
        >
          {items.map((it, idx) => (
            <button
              key={idx}
              role="menuitem"
              disabled={it.disabled}
              onClick={() => { it.onClick?.(); onClose?.() }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100 disabled:opacity-50 ${it.destructive ? 'text-red-600 hover:text-red-700' : 'text-slate-700'}`}
            >
              {it.icon}
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      )}
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
          <button className="btn btn-sm btn btn-primary-outline" onClick={onCancel}>{cancelText}</button>
          <button className="btn btn btn-primary-sm bg-red-600 text-white hover:bg-red-700" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
