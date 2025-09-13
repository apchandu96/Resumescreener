import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import MyCV from './pages/MyCV'
import JobRoles from './pages/JobRoles'
import Screening from './pages/Screening'
import JobSearch from './pages/JobSearch'
import './index.css'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot" element={<ForgotPassword />} />
        <Route path="reset" element={<ResetPassword />} />
        <Route path="/jobs" element={<JobSearch/>} />
        <Route
          path="cv"
          element={
            <PrivateRoute>
              <MyCV />
            </PrivateRoute>
          }
        />
        <Route
          path="roles"
          element={
            <PrivateRoute>
              <JobRoles />
            </PrivateRoute>
          }
        />
        <Route
          path="screening"
          element={
            <PrivateRoute>
              <Screening />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  </BrowserRouter>
)
