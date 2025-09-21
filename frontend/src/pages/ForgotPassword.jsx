import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api'

export default function ForgotPassword(){
  const [email, setEmail] = useState('')
  const [info, setInfo] = useState(null)   // { ok, resetToken? }
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copyState, setCopyState] = useState('idle') // idle | copied | error

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

  const copyToken = async () => {
    if (!info?.resetToken) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(info.resetToken)
      } else {
        // Fallback
        const ta = document.createElement('textarea')
        ta.value = info.resetToken
        ta.setAttribute('readonly', '')
        ta.style.position = 'absolute'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopyState('copied')
    } catch {
      setCopyState('error')
    } finally {
      setTimeout(() => setCopyState('idle'), 1500)
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
        <label className="label" htmlFor="email">User name</label>
        <input
          id="email"
          className="input w-full"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          placeholder="JohnDoe_123"
          type="text"
          autoComplete="username"
        />
        <button className="btn btn-primary w-full" disabled={loading || !email.trim()}>
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

              {/* Token display with copy action */}
              <div className="bg-slate-50 border border-slate-200 rounded p-2">
  <div className="text-xs text-slate-600 mb-1">Your reset token:</div>

  <div className="flex items-start gap-2">
    <code
      className="bg-white border border-slate-200 px-3 py-2 rounded text-sm font-mono whitespace-nowrap overflow-x-auto flex-1"
    >
      {info.resetToken}
    </code>

    <button
      type="button"
      onClick={copyToken}
      className="btn btn-secondary text-xs px-3 py-2 shrink-0"
      aria-label="Copy reset token"
      aria-live="polite"
    >
      {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Retry' : 'Copy'}
    </button>
  </div>

  <p className="text-xs text-slate-600 mt-2">
    Copy the token and go to the Reset Password page. You’ll need to paste this token there.
  </p>
</div>

              <div>
                <Link className="btn btn-primary w-full" to="/resetpassword">
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
