import { useState } from 'react'
import { login } from '../api'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [err,setErr] = useState(null)
  const nav = useNavigate()

  const submit = async e => {
    e.preventDefault()
    try {
      const { token } = await login(email,password)
      localStorage.setItem('token', token)
      nav('/cv')
    } catch(e){ setErr(String(e)) }
  }

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      {err && <div className="bg-red-100 text-red-600 p-2 mb-3">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input className="input w-full" placeholder="User name" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input w-full" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn btn-primary w-full">Login</button>
        <div className="mt-3 text-center">
         <div className="mb-2 text-sm text-slate-600">New user? <a href="/register" className="text-sm text-slate-600 hover:underline">Create an account</a></div> 
       <a href="/forgot" className="text-sm text-slate-600 hover:underline">Forgot password?</a>
</div>
      </form>
    </div>
  )
}
