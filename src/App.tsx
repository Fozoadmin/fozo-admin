import { Navigate, Route, Routes } from "react-router-dom"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"

function RequireAuth({ children }: { children: React.ReactNode }) {
  const authToken = localStorage.getItem("auth_token")
  const authFlag = localStorage.getItem("auth") === "1"
  const isAuthenticated = authToken && authFlag
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
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
