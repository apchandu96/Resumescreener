import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function NavBar() {
  const nav = useNavigate()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const [open, setOpen] = useState(false)

  const logout = () => {
    localStorage.removeItem('token')
    setOpen(false)
    nav('/login')
  }

  // Slightly more compact than before to protect space for the tagline + nav
  const linkBase = 'px-3 py-2 rounded-xl outline-none transition-colors duration-150 text-[16px] md:text-[17px]'
  const navLink = ({ isActive }) =>
    `${linkBase} ${isActive ? 'bg-[#ffffff] text-black' : 'hover:bg-[#ffffff] text-black'}`

  return (
    <header role="banner" className="sticky top-0 z-40 navbar border-b border-[#d2460e]">
      <nav
        className="container grid grid-cols-[auto,1fr,auto] items-center gap-4 min-h-16 md:min-h-20 py-1"
        role="navigation"
        aria-label="Primary"
      >
        {/* LEFT: burger + logo (never shrink) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            className="md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#ff6a33]"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-controls="primary-menu"
            aria-expanded={open ? 'true' : 'false'}
            onClick={() => setOpen(v => !v)}
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>

          <NavLink to="/" className="logo-groove flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt="CV Craft logo"
              className="h-16 sm:h-20 md:h-24 w-auto object-contain"
              title='Home'
            />
            <span className="sr-only">CV Craft</span>
          </NavLink>
        </div>

        {/* MIDDLE: Tagline (grows, shows fully, wraps to two lines if needed) */}
        <div className="hidden md:block flex-1 min-w-0">
          <div
            className="inline-flex items-start gap-2 rounded-xl bg-white/95 text-[#0C022F] border border-slate-200 shadow-sm px-3 py-2 leading-snug max-w-[680px] whitespace-normal"
          >
            {/* slim brand accent */}
           
            <span className="text-base md:text-[17px] font-semibold">
              About to apply? <span className="font-medium">Stop here first.</span>
            </span>
              </div>
        </div>

        {/* RIGHT: nav links (never shrink) */}
        <ul className="hidden md:flex items-center gap-2 flex-shrink-0" id="primary-menu">
          {token ? (
            <>
              <li><NavLink to="/cv" className={navLink}>My CV</NavLink></li>
              <li><NavLink to="/roles" className={navLink}>Roles</NavLink></li>
              <li><NavLink to="/screening" className={navLink}>Screening</NavLink></li>
              <li><NavLink to="/jobs" className={navLink}>Job Search</NavLink></li>
              <li>
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-xl hover:bg-[#f1101a]"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><NavLink to="/jobs" className={navLink}>Job Search</NavLink></li>
              <li><NavLink to="/login" className="btn btn-secondary">Login</NavLink></li>
              <li><NavLink to="/register" className="btn btn-secondary">Register</NavLink></li>
            </>
          )}
        </ul>
      </nav>

      {/* Mobile drawer */}
      <div className={`md:hidden border-t border-[#d2460e] ${open ? 'block' : 'hidden'}`} id="primary-menu">
        <div className="container py-3">
          {/* Tagline visible on mobile too (below logo) */}
          <p className="mb-3 text-[15px] font-semibold text-[#0C022F]">
            About to apply? <span className="font-medium">Stop here first.</span>
          </p>

          <div className="grid gap-2 text-[17px]" role="menu">
            {token ? (
              <>
                <NavLink onClick={() => setOpen(false)} to="/cv" className={navLink}>My CV</NavLink>
                <NavLink onClick={() => setOpen(false)} to="/roles" className={navLink}>Roles</NavLink>
                <NavLink onClick={() => setOpen(false)} to="/screening" className={navLink}>Screening</NavLink>
                <NavLink onClick={() => setOpen(false)} to="/jobs" className={navLink}>Job Search</NavLink>
                <button onClick={logout} className="px-3 py-2 rounded-xl text-left hover:bg-[#ff6a33]">Logout</button>
              </>
            ) : (
              <>
                <NavLink onClick={() => setOpen(false)} to="/jobs" className={navLink}>Job Search</NavLink>
                <NavLink onClick={() => setOpen(false)} to="/login" className="btn btn-secondary">Login</NavLink>
                <NavLink onClick={() => setOpen(false)} to="/register" className="btn btn-secondary">Register</NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
