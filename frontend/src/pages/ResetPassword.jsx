import { useState } from 'react'
import { resetPassword } from '../api'
import { useNavigate } from 'react-router-dom'

export default function ResetPassword(){
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      await resetPassword(token, password, confirmPassword)
      setDone(true)
      setTimeout(()=> nav('/login'), 1200)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Reset password</h2>
      {error && <div className="bg-red-100 text-red-600 p-2 mb-3">{error}</div>}

      <form onSubmit={submit} className="space-y-3">
        <label className="label" htmlFor="token">Reset token</label>
        <input id="token" className="input w-full" value={token} onChange={e=>setToken(e.target.value)} placeholder="Paste the reset token" />

        <label className="label" htmlFor="pass">New password</label>
        <input id="pass" type="password" className="input w-full" value={password} onChange={e=>setPassword(e.target.value)} />

        <label className="label" htmlFor="confirm">Confirm password</label>
        <input id="confirm" type="password" className="input w-full" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />

        <button className="btn w-full" disabled={loading}>{loading? 'Saving...' : 'Reset password'}</button>
      </form>

      {done && <div className="mt-3 text-green-700 bg-green-50 p-2 rounded">Password updated! Redirecting to login…</div>}
    </div>
  )
}
