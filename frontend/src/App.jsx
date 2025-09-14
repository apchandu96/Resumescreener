import { Outlet, Link, useNavigate } from 'react-router-dom'

export default function App() {
  const nav = useNavigate()
  const token = localStorage.getItem('token')

  const logout = () => {
    localStorage.removeItem('token')
    nav('/login')
  }

  return (
    <div>
      <header className="bg-slate-800 text-white">
        <div className="container py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <img
              src='/images/logo.png'
              alt="CV Craft Logo"
              className="h-8 w-8 object-contain"
            />
            <span>CV Craft</span>
          </Link>

          <nav className="space-x-4 text-sm">
            {token ? (
              <>
                <Link to="/cv" className="hover:underline">My CV</Link>
                <Link to="/roles" className="hover:underline">Job Roles</Link>
                <Link to="/screening" className="hover:underline">Screening</Link>
                <Link to="/jobs" className="hover:underline">Job Search</Link>
                <button
                  onClick={logout}
                  className="ml-3 bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">Login</Link>
                <Link to="/register" className="hover:underline">Register</Link>
                <Link to="/jobs" className="hover:underline">Job Search</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container py-6">
        {/* Child routes render here */}
        <Outlet />
      </main>
    </div>
  )
}
