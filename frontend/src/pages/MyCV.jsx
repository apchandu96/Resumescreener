import { useEffect, useState } from 'react'
import { uploadCandidate, listCandidates, atsReportByCandidate, atsScoreByCandidate, deleteCandidate } from '../api'

export default function MyCV(){
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

  // Deletion state
  const [deletingId, setDeletingId] = useState(null)

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
        } catch { /* non-fatal; basic report failed */ }
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

  const onDelete = async (candidateId) => {
    if (!candidateId) return
    const go = window.confirm('Delete this CV permanently? This cannot be undone.')
    if (!go) return

    setDeletingId(candidateId)
    setWarning(null)

    // optimistic update
    const prevCands = cands
    setCands(prev => prev.filter(x => x._id !== candidateId))
    setBasicMap(prev => {
      const { [candidateId]: _, ...rest } = prev
      return rest
    })
    setDeepMap(prev => {
      const { [candidateId]: _, ...rest } = prev
      return rest
    })

    try{
      await deleteCandidate(candidateId)
    }catch(err){
      // rollback if it fails
      setCands(prevCands)
      setWarning(String(err))
    }finally{
      setDeletingId(null)
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
          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input id="name" className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g., Jane Doe" required/>
          </div>
          <div>
            <label className="label" htmlFor="years">Years of experience</label>
            <input id="years" className="input" type="number" min="0" step="1" value={years} onChange={e=>setYears(e.target.value)} placeholder="e.g., 4" required/>
          </div>
          <button className="btn" disabled={loading}>{loading?'Uploading...':'Upload CV'}</button>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-slate-600">
                        {new Date(c.createdAt).toLocaleString()} • {c.yearsExperience ?? 0} yrs
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a className="btn" href={`/screening?candidateId=${c._id}`}>Screen this CV</a>
                      <button className="btn" onClick={()=>deepDive(c._id)} disabled={isDeepLoading || isDeleting}>
                        {isDeepLoading ? 'Analyzing...' : 'Deep Dive with AI'}
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={()=>onDelete(c._id)}
                        disabled={isDeepLoading || isDeleting}
                        title="Delete this CV"
                      >
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
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
    </div>
  )
}
