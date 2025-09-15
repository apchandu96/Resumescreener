import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'

export default function NavBar() {
  const nav = useNavigate()
  const token = localStorage.getItem('token')
  const [open, setOpen] = useState(false)

  const logout = () => {
    localStorage.removeItem('token')
    setOpen(false)
    nav('/login')
  }

  const closeMenu = () => setOpen(false)

  // 🔑 function to style active links
  const linkClass = ({ isActive }) =>
    `hover:underline ${isActive ? 'text-emerald-400 font-semibold' : ''}`

  const mobileLinkClass = ({ isActive }) =>
    `block px-2 py-2 rounded hover:bg-slate-700 ${
      isActive ? 'bg-slate-700 text-emerald-400 font-semibold' : ''
    }`

  return (
    <header className="bg-slate-800 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <NavLink
            to="/"
            className="flex items-center gap-2 font-bold text-lg"
            onClick={closeMenu}
          >
            <img
              src="/images/logo.png"
              alt="CV Craft Logo"
              className="h-8 w-8 object-contain"
            />
            <span>CV Craft</span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 text-sm">
            {token ? (
              <>
                <NavLink to="/cv" className={linkClass}>My CV</NavLink>
                <NavLink to="/roles" className={linkClass}>Job Roles</NavLink>
                <NavLink to="/screening" className={linkClass}>Screening</NavLink>
                <NavLink to="/jobs" className={linkClass}>Job Search</NavLink>
                <button
                  onClick={logout}
                  className="ml-2 flex items-center gap-1 bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>Login</NavLink>
                <NavLink to="/register" className={linkClass}>Register</NavLink>
                <NavLink to="/jobs" className={linkClass}>Job Search</NavLink>
              </>
            )}
          </nav>

          {/* Mobile burger */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-controls="mobile-menu"
            aria-expanded={open}
            onClick={() => setOpen(prev => !prev)}
          >
            <span className="sr-only">Toggle navigation</span>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          id="mobile-menu"
          className={`md:hidden transition-all duration-200 ease-out ${
            open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}
        >
          <div className="pt-3 pb-4 space-y-2 text-sm">
            {token ? (
              <>
                <NavLink onClick={closeMenu} to="/cv" className={mobileLinkClass}>My CV</NavLink>
                <NavLink onClick={closeMenu} to="/roles" className={mobileLinkClass}>Job Roles</NavLink>
                <NavLink onClick={closeMenu} to="/screening" className={mobileLinkClass}>Screening</NavLink>
                <NavLink onClick={closeMenu} to="/jobs" className={mobileLinkClass}>Job Search</NavLink>
                <button
                  onClick={logout}
                  className="mt-2 w-full flex items-center gap-2 text-left px-2 py-2 rounded bg-red-500 hover:bg-red-600"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink onClick={closeMenu} to="/login" className={mobileLinkClass}>Login</NavLink>
                <NavLink onClick={closeMenu} to="/register" className={mobileLinkClass}>Register</NavLink>
                <NavLink onClick={closeMenu} to="/jobs" className={mobileLinkClass}>Job Search</NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
