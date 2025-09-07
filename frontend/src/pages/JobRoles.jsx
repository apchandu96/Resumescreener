import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractSkills, createRole, listRoles } from '../api'

export default function JobRoles() {
  const navigate = useNavigate()

  // change this if your Screening route differs
  const SCREEN_PATH = '/screening'

  const [title, setTitle] = useState('Frontend Engineer (React)')
  const [desc, setDesc] = useState('Build delightful product experiences with React and modern tooling.')
  const [must, setMust] = useState([])
  const [good, setGood] = useState([])
  const [warning, setWarning] = useState(null)
  const [roles, setRoles] = useState([])
  const [saving, setSaving] = useState(false)

  const load = async () => setRoles(await listRoles())
  useEffect(() => { load() }, [])

  const onExtract = async () => {
    setWarning(null)
    try {
      const r = await extractSkills(title, desc)
      setMust(r.mustHaveSkills || [])
      setGood(r.goodToHaveSkills || [])
    } catch (err) {
      setWarning(String(err))
    }
  }

  const onSave = async () => {
    setSaving(true); setWarning(null)
    try {
      const role = await createRole({
        title,
        description: desc,
        mustHaveSkills: must,
        goodToHaveSkills: good
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
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="desc">Job Description</label>
            <textarea
              id="desc"
              className="textarea"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3">
            <button className="btn" onClick={onExtract}>Extract skills from JD</button>
            <button className="btn" onClick={onSave} disabled={saving || !title || !desc}>
              {saving ? 'Saving...' : 'Add Role'}
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
                {roles.map(r => (
                  <tr key={r._id} className="border-t">
                    <td className="py-2 pr-4">{r.title}</td>
                    <td className="py-2 pr-4">
                      {(r.mustHaveSkills || []).map(s => <span key={s} className="pill">{s}</span>)}
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        className="btn btn-sm"
                        onClick={() => navigate(`${SCREEN_PATH}?roleId=${r._id}`)}
                      >
                        Screen against this role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
