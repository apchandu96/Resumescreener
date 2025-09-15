import { Outlet, Link, useNavigate } from 'react-router-dom'
import NavBar from './components/navbar.jsx'

export default function App() {
  const nav = useNavigate()
  const token = localStorage.getItem('token')

  const logout = () => {
    localStorage.removeItem('token')
    nav('/login')
  }

return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
