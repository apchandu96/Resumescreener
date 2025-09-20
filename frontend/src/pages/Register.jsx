import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register as apiRegister } from '../api'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr(null)

    // simple client validation
    if (!email.trim()) return setErr('Email is required')
    if (!password) return setErr('Password is required')
    if (password !== confirm) return setErr('Passwords do not match')
    if (password.length < 6) return setErr('Password must be at least 6 characters')

    try {
      setLoading(true)
      const { token } = await apiRegister(email.trim(), password)
      localStorage.setItem('token', token)
      nav('/cv') // go to My CV after signup
    } catch (e) {
      setErr(String(e).replace('Error:','').trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 bg-white rounded-2xl shadow border border-slate-200">
      <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
      <p className="text-slate-600 text-sm mt-1">Start uploading your CVs and roles.</p>

      {err && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              className="input pr-16"
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={()=>setShowPass(p=>!p)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-slate-100"
            >
              {showPass ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="label">Confirm password</label>
          <input
            id="confirm"
            type={showPass ? 'text' : 'password'}
            className="input"
            autoComplete="new-password"
            value={confirm}
            onChange={(e)=>setConfirm(e.target.value)}
            required
          />
        </div>

        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-slate-600 mt-4 text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-slate-900 font-medium hover:underline">Log in</Link>
      </p>
    </div>
  )
}
