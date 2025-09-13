import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api'

export default function ForgotPassword(){
  const [email, setEmail] = useState('')
  const [info, setInfo] = useState(null)   // { ok, resetToken? }
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setInfo(null)
    try {
      const res = await forgotPassword(email.trim())
      setInfo(res)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-2">Forgot password</h2>
      <p className="text-xs text-slate-600 mb-4">
        We’re not sending any email. Enter your email to generate a reset token.
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 mb-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          className="input w-full"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <button className="btn w-full" disabled={loading || !email.trim()}>
          {loading ? 'Generating…' : 'Generate reset token'}
        </button>
      </form>

      {/* Success states */}
      {info?.ok && (
        <div className="mt-4 text-sm text-slate-800 space-y-3">
          {info.resetToken ? (
            <>
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded">
                Reset token generated.
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-2">
                <div className="text-xs text-slate-600 mb-1">Your reset token:</div>
                <code className="block bg-white border border-slate-200 px-2 py-1 rounded overflow-auto">
                  {info.resetToken}
                </code>
                <p className="text-xs text-slate-600 mt-2">
                  Copy the token and go to the Reset Password page. You’ll need to paste this token there.
                </p>
              </div>
              <div>
                <Link className="btn w-full" to="/resetpassword">
                  Go to Reset Password
                </Link>
              </div>
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded">
              We couldn’t find an account for <b>{email}</b>. Please check the email and try again.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
