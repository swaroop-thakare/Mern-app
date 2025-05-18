"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { API_URL, fetchWithAuth } from "@/lib/api-config"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const router = useRouter()

  // Check server connection on component mount
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const response = await fetch(`${API_URL}/test`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          setConnectionError(null)
        } else {
          setConnectionError("Server is running but returned an error")
        }
      } catch (error) {
        console.error("Server connection check failed:", error)
        setConnectionError("Cannot connect to the backend server")
      }
    }

    checkServerConnection()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setConnectionError(null)

    try {
      console.log("Attempting login with:", { email, password })

      const response = await fetchWithAuth("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("Login response:", data)

      if (response.ok) {
        // Save token to localStorage
        localStorage.setItem("token", data.token)

        toast({
          title: "Login successful",
          description: "You have been logged in successfully",
        })

        router.push("/dashboard")
      } else {
        toast({
          title: "Login failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      setConnectionError("Failed to connect to the backend server. Please check the server is running.")
      toast({
        title: "Connection Error",
        description: "Failed to connect to the backend server. Please check the server is running.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Agent Management System</h1>
          <p className="text-slate-500 mt-2">Manage your agents and distribute leads efficiently</p>
        </div>

        {connectionError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {connectionError}
              <div className="mt-2 text-xs">
                <p>Troubleshooting steps:</p>
                <ol className="list-decimal pl-4 mt-1 space-y-1">
                  <li>
                    Make sure the server is running with <code>node server/server.js</code>
                  </li>
                  <li>Check if there are any errors in the server console</li>
                  <li>The server uses portfinder to find an available port - check the console for the actual port</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 px-4"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 px-4"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 mt-2 bg-slate-800 hover:bg-slate-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-sm text-slate-500">Default credentials: admin@example.com / admin123</p>
          </CardFooter>
        </Card>

        <div className="mt-4 text-center">
          <p className="text-sm text-slate-500">
            Backend status: <BackendStatusChecker />
          </p>
        </div>
      </div>
    </div>
  )
}

// Component to check backend status
function BackendStatusChecker() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking")

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/test`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          setStatus("online")
        } else {
          setStatus("offline")
        }
      } catch (error) {
        console.error("Backend check error:", error)
        setStatus("offline")
      }
    }

    checkBackend()
  }, [])

  return (
    <span
      className={
        status === "checking"
          ? "text-yellow-500"
          : status === "online"
            ? "text-green-500 font-medium"
            : "text-red-500 font-medium"
      }
    >
      {status === "checking" ? "Checking..." : status === "online" ? "Online" : "Offline"}
    </span>
  )
}
