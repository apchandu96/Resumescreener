import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { resetPassword } from '../api'

export default function ResetPassword(){
  const [params] = useSearchParams()

  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [tokenLocked, setTokenLocked] = useState(false)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [info, setInfo] = useState(null)   // { ok }
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // If token is in the URL, prefill and lock the field
  useEffect(() => {
    const t = params.get('token')
    if (t) {
      setToken(t)
      setTokenLocked(true)
    }
  }, [params])

  const submit = async (e) => {
    e.preventDefault()
    setError(null); setInfo(null)

    // Client-side validation
    if (!email.trim()) return setError('Please enter your email.')
    if (!token.trim()) return setError('Please enter the reset token.')
    if (!password) return setError('Please enter a new password.')
    if (password !== confirm) return setError('Passwords do not match.')

    setLoading(true)
    try {
      const res = await resetPassword({ email: email.trim(), token: token.trim(), newPassword: password })
      if (res?.ok) {
        setInfo(res)
      } else {
        setError(res?.message || 'Unable to reset password. Please check the token and try again.')
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-2">Reset password</h2>
      <p className="text-xs text-slate-600 mb-4">
        Enter your email, the reset token, and your new password.
        {tokenLocked && ' (Token prefilled from link and cannot be edited.)'}
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 mb-3 rounded">
          {error}
        </div>
      )}

      {info?.ok && (
        <div className="bg-emerald-50 text-emerald-700 p-2 mb-3 rounded">
          Password updated. You can now{' '}
          <Link className="underline" to="/login">log in</Link>.
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input w-full"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="label" htmlFor="token">Reset token</label>
          <input
            id="token"
            className="input w-full"
            value={token}
            onChange={e=>!tokenLocked && setToken(e.target.value)}
            placeholder="Paste the token here"
            disabled={tokenLocked}
          />
        </div>

        {/* New password with Show/Hide */}
        <div>
          <label className="label" htmlFor="pwd">New password</label>
          <div className="relative">
            <input
              id="pwd"
              type={showPwd ? 'text' : 'password'}
              className="input w-full pr-24"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={()=>setShowPwd(s => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100"
              aria-pressed={showPwd}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Confirm password with Show/Hide */}
        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              className="input w-full pr-24"
              value={confirm}
              onChange={e=>setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={()=>setShowConfirm(s => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100"
              aria-pressed={showConfirm}
              aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
            >
              {showConfirm ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button className="btn w-full" disabled={loading}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <div className="text-center mt-4">
        <Link className="text-sm text-slate-600 underline" to="/forgot">
          Back to Forgot Password
        </Link>
      </div>
    </div>
  )
}
