import { Navigate, Route, Routes } from "react-router-dom"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"

function RequireAuth({ children }: { children: React.ReactNode }) {
  const authed = localStorage.getItem("auth") === "1"
  return authed ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
