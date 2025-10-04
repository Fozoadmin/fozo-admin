import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Login() {
  const nav = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const u = import.meta.env.VITE_APP_USERNAME
    const p = import.meta.env.VITE_APP_PASSWORD
    if (username === u && password === p) {
      localStorage.setItem("auth", "1")
      nav("/dashboard")
    } else {
      setError("Invalid username or password")
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-muted/20 p-4">
      <Card className="w-full max-w-sm rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-sm">Username</label>
              <Input
                value={username}
                onChange={(e)=>setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <Button type="submit" className="mt-1">Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
