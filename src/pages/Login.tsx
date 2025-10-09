import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

export default function Login() {
  const nav = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`http://localhost:3000/fozo/api/auth/login-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'srxdtcfy14Eguy5212hijbswd7iobhvinoqhd78gq2r74oh809h9TFR76GDH83csyHQ9DH3H8EH9Q'
        },
        body: JSON.stringify({
          identifier: username,
          password: password
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Use context instead of localStorage
        login(data.user, data.token)
        nav("/dashboard")
      } else {
        console.error('Login error:', data)
        setError(data.message || "Invalid username or password")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
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
            <Button type="submit" className="mt-1" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
