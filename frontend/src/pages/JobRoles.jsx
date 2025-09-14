import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractSkills, createRole, listRoles, deleteRole } from '../api'

export default function JobRoles() {
  const navigate = useNavigate()

  // change this if your Screening route differs
  const SCREEN_PATH = '/screening'

  const [title, setTitle] = useState('Frontend Engineer (React)')
  const [desc, setDesc] = useState('')
  const [must, setMust] = useState([])
  const [good, setGood] = useState([])
  const [warning, setWarning] = useState(null)
  const [roles, setRoles] = useState([])

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => setRoles(await listRoles())
  useEffect(() => { load() }, [])

  const onSave = async () => {
    if (!title?.trim() || !desc?.trim()) {
      return setWarning('Please provide both a role title and the key roles & responsibilities.')
    }

    setSaving(true); setWarning(null)
    try {
      // 1) Auto-extract skills from the JD (no manual button)
      const extracted = await extractSkills(title, desc)
      const mustHaveSkills = extracted?.mustHaveSkills || []
      const goodToHaveSkills = extracted?.goodToHaveSkills || []

      // reflect in UI (optional)
      setMust(mustHaveSkills)
      setGood(goodToHaveSkills)

      // 2) Save role with extracted skills
      const role = await createRole({
        title,
        description: desc,
        mustHaveSkills,
        goodToHaveSkills
      })

      await load()

      if (confirm('Role saved. Would you like to screen against this role now?')) {
        navigate(`${SCREEN_PATH}?roleId=${role._id}`)
      }
    } catch (err) {
      setWarning(String(err))
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (roleId) => {
    if (!roleId) return
    const go = window.confirm('Delete this role? Any related screening results will also be removed.')
    if (!go) return

    setDeletingId(roleId)
    setWarning(null)

    // optimistic update
    const prev = roles
    setRoles(prev => prev.filter(r => r._id !== roleId))

    try {
      await deleteRole(roleId)
    } catch (err) {
      // rollback
      setRoles(prev)
      setWarning(String(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Add a Job Role</h2>

        {warning && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 mb-3">
            {warning}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="title">Role Title</label>
            <input
              id="title"
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Frontend Engineer (React)"
              required
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="label" htmlFor="desc">Key Roles & Responsibilities</label>
              <span className="text-xs text-slate-500">
                No company info required — focus on <b>essential</b> and <b>preferred</b> skills.
              </span>
            </div>
            <textarea
              id="desc"
              className="textarea"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe the responsibilities and list essential (must-have) and preferred (good-to-have) skills."
              required
            />
          </div>

          <div className="flex gap-3">
            {/* Extract button removed; save triggers extraction automatically */}
            <button className="btn" onClick={onSave} disabled={saving || !title || !desc}>
              {saving ? 'Analyzing JD & Saving…' : 'Add Role'}
            </button>
          </div>
        </div>

        {(must.length || good.length) ? (
          <div className="mt-5">
            <h3 className="font-semibold mb-2">Extracted skills</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="py-2 pr-4 text-left">Must-have</th>
                    <th className="py-2 pr-4 text-left">Good-to-have</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="py-2 pr-4">
                      {must.map(s => <span key={s} className="pill">{s}</span>)}
                    </td>
                    <td className="py-2 pr-4">
                      {good.map(s => <span key={s} className="pill">{s}</span>)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Your Roles</h2>
        {roles.length === 0 ? (
          <p className="text-slate-600">No roles yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Must-have</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(r => {
                  const isDeleting = deletingId === r._id
                  return (
                    <tr key={r._id} className="border-t">
                      <td className="py-2 pr-4">{r.title}</td>
                      <td className="py-2 pr-4">
                        {(r.mustHaveSkills || []).map(s => <span key={s} className="pill">{s}</span>)}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <button
                            className="btn btn-sm"
                            onClick={() => navigate(`${SCREEN_PATH}?roleId=${r._id}`)}
                            disabled={isDeleting}
                          >
                            Screen against this role
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => onDelete(r._id)}
                            disabled={isDeleting}
                            title="Delete this role"
                          >
                            {isDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
