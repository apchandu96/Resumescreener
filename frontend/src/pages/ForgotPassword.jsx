import { useState } from 'react'
import { forgotPassword } from '../api'

export default function ForgotPassword(){
  const [email, setEmail] = useState('')
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setInfo(null)
    try {
      const res = await forgotPassword(email)
      setInfo(res) // may contain resetToken in dev
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Forgot password</h2>
      {error && <div className="bg-red-100 text-red-600 p-2 mb-3">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <label className="label" htmlFor="email">Email</label>
        <input id="email" className="input w-full" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
        <button className="btn w-full" disabled={loading}>{loading? 'Sending...' : 'Send reset link'}</button>
      </form>

      {info?.ok && (
        <div className="mt-4 text-sm text-slate-700">
          <p>Check your email for the reset link.</p>
          {info.resetToken && (
            <p className="mt-2">
              <b>Dev token:</b> <code className="bg-slate-100 px-2 py-1 rounded">{info.resetToken}</code><br/>
              Paste this token on the Reset Password page.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
