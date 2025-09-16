import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, Trash2, ScreenShare } from 'lucide-react'
import { extractSkills, createRole, listRoles, deleteRole } from '../api'

export default function JobRoles() {
  const navigate = useNavigate()

  const SCREEN_PATH = '/screening'

  const [title, setTitle] = useState('Frontend Engineer (React)')
  const [desc, setDesc] = useState('List only the essential and preferred skills plus key responsibilities. No company info needed.')
  const [must, setMust] = useState([])
  const [good, setGood] = useState([])
  const [warning, setWarning] = useState(null)
  const [roles, setRoles] = useState([])


  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // menus & modals
  const [openMenuId, setOpenMenuId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState(null)

  // after-save suggestion modal
  const [postSaveOpen, setPostSaveOpen] = useState(false)
  const [savedRoleId, setSavedRoleId] = useState(null)

  const load = async () => setRoles(await listRoles())
  useEffect(() => { load() }, [])

  const onSave = async () => {
    if (!title?.trim() || !desc?.trim()) {
      return setWarning('Please provide both a role title and the key roles & responsibilities.')
    }

    if (!title?.trim() || !desc?.trim()) {
      return setWarning('Please provide both a role title and the key roles & responsibilities.')
    }

    setSaving(true); setWarning(null)
    try {
      // Auto-extract skills from the JD
      const extracted = await extractSkills(title, desc)
      const mustHaveSkills = extracted?.mustHaveSkills || []
      const goodToHaveSkills = extracted?.goodToHaveSkills || []

      setMust(mustHaveSkills)
      setGood(goodToHaveSkills)

      // Save role with extracted skills
      const role = await createRole({
        title,
        description: desc,
        mustHaveSkills,
        goodToHaveSkills
        mustHaveSkills,
        goodToHaveSkills
      })


      await load()
      setSavedRoleId(role._id)
      setPostSaveOpen(true)
    } catch (err) {
      setWarning(String(err))
    } finally {
      setSaving(false)
    }
  }

  const askDelete = (roleId) => {
    setRoleToDelete(roleId)
    setConfirmOpen(true)
    setOpenMenuId(null)
  }

  const confirmDelete = async () => {
    const roleId = roleToDelete
    if (!roleId) return

    setConfirmOpen(false)
    setDeletingId(roleId)
    setWarning(null)

    const prev = roles
    setRoles(prev => prev.filter(r => r._id !== roleId))

    try {
      await deleteRole(roleId)
    } catch (err) {
      setRoles(prev)
      setWarning(String(err))
    } finally {
      setDeletingId(null)
      setRoleToDelete(null)
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
              placeholder="Describe the responsibilities and list essential (must-have) and preferred (good-to-have) skills."
              required
            />
          </div>


          <div className="flex gap-3">
            <button className="btn btn-primary" onClick={onSave} disabled={saving || !title || !desc}>
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
                        <ActionMenu
                          open={openMenuId === r._id}
                          onOpen={() => setOpenMenuId(r._id)}
                          onClose={() => setOpenMenuId(null)}
                          items={[
                            {
                              label: 'Screen against this role',
                              icon: <ScreenShare className="h-4 w-4" />,
                              disabled: isDeleting,
                              onClick: () => navigate(`${SCREEN_PATH}?roleId=${r._id}`)
                            },
                            {
                              label: 'Delete role',
                              icon: <Trash2 className="h-4 w-4" />,
                              destructive: true,
                              disabled: isDeleting,
                              onClick: () => askDelete(r._id)
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm delete modal */}
      <ConfirmModal
        open={confirmOpen}
        title="Delete role?"
        description="This will remove the role and its related screening results."
        confirmText="Delete"
        onCancel={() => { setConfirmOpen(false); setRoleToDelete(null) }}
        onConfirm={confirmDelete}
      />

      {/* Post-save modal */}
      <ConfirmModal
        open={postSaveOpen}
        title="Role saved"
        description="Do you want to screen a CV against this role now?"
        confirmText="Go to Screening"
        cancelText="Not now"
        onCancel={() => { setPostSaveOpen(false); setSavedRoleId(null) }}
        onConfirm={() => {
          const id = savedRoleId
          setPostSaveOpen(false)
          setSavedRoleId(null)
          if (id) navigate(`${SCREEN_PATH}?roleId=${id}`)
        }}
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
          className="absolute right-0 mt-1 w-56 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-10"
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
          <button className="btn btn-sm btn-outline" onClick={onCancel}>{cancelText}</button>
          <button className="btn btn-sm bg-slate-900 text-white hover:bg-slate-800" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
