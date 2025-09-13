import { Link, useNavigate } from 'react-router-dom'

export default function NavBar(){
  const nav = useNavigate()
  const token = localStorage.getItem('token')

  const logout = () => {
    localStorage.removeItem('token')
    nav('/login')
  }

  return (
    <nav className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
      <div className="font-bold text-lg">
        <Link to="/">Resume Screener</Link>
      </div>
      <div className="flex gap-4 items-center">
        {token && (
          <>
            <Link to="/cv" className="hover:underline">My CV</Link>
            <Link to="/roles" className="hover:underline">Job Roles</Link>
            <Link to="/screening" className="hover:underline">Screening</Link>
            <Link to="/jobs" className="hover:underline">Job Search</Link>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </>
        )}
        {!token && (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="hover:underline">Register</Link>
            <Link to="/jobs" className="hover:underline">Job Search</Link>
          </>
        )}
      </div>
    </nav>
  )
}
