import { Outlet, Link, useNavigate } from 'react-router-dom'
import NavBar from './components/Navbar'
import Footer from './components/Footer'

export default function App() {
  const nav = useNavigate()
  const token = localStorage.getItem('token')

  const logout = () => {
    localStorage.removeItem('token')
    nav('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white readable">
      <div
        role="note"
        aria-label="POC Notice"
        className="bg-amber-100 text-amber-900 border-b border-amber-300 text-center text-xs sm:text-sm py-2 px-4"
      >
        This site is a non-commercial proof of concept for demonstration only.
      </div>
      <NavBar />
      <main
        id="main-content"
        role="main"
        className="container mx-auto px-4 py-6 flex-1 w-full"
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
