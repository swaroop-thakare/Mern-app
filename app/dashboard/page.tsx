"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AgentManagement from "@/components/agent-management"
import ListUpload from "@/components/list-upload"
import ListDistribution from "@/components/list-distribution"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Users, FileUp, ListFilter } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import DashboardSummary from "@/components/dashboard-summary"

// API base URL - use the same one across all files
const API_URL = "http://localhost:5001/api"

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [agentCount, setAgentCount] = useState(0)
  const [contactCount, setContactCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/")
      return
    }

    // Verify token validity and fetch dashboard data
    const initDashboard = async () => {
      try {
        console.log("Verifying token...")
        const response = await fetch(`${API_URL}/auth/verify`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          console.error("Token verification failed:", await response.text())
          localStorage.removeItem("token")
          router.push("/")
          return
        }

        console.log("Token verified, fetching agent data...")
        // Fetch agent count
        const agentsResponse = await fetch(`${API_URL}/agents`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (agentsResponse.ok) {
          const agents = await agentsResponse.json()
          setAgentCount(agents.length)
        } else {
          console.error("Failed to fetch agents:", await agentsResponse.text())
        }

        console.log("Fetching distribution data...")
        // Fetch distribution data for contact count
        const distributionResponse = await fetch(`${API_URL}/lists/distribution`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (distributionResponse.ok) {
          const distribution = await distributionResponse.json()
          let totalContacts = 0
          distribution.forEach((agent) => {
            totalContacts += agent.contacts.length
          })
          setContactCount(totalContacts)
        } else {
          console.error("Failed to fetch distribution:", await distributionResponse.text())
        }
      } catch (error) {
        console.error("Dashboard initialization failed:", error)
        toast({
          title: "Connection Error",
          description: "Failed to connect to the backend server. Please make sure it's running.",
          variant: "destructive",
        })
        localStorage.removeItem("token")
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    initDashboard()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
        <p className="mt-4 text-slate-600">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader onLogout={handleLogout} />

      <main className="container mx-auto py-8 px-4">
        <DashboardSummary agentCount={agentCount} contactCount={contactCount} />

        <Tabs defaultValue="agents" className="mt-8">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="agents" className="flex items-center justify-center py-3">
              <Users className="mr-2 h-4 w-4" />
              Agent Management
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center justify-center py-3">
              <FileUp className="mr-2 h-4 w-4" />
              Upload Lists
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center justify-center py-3">
              <ListFilter className="mr-2 h-4 w-4" />
              List Distribution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents">
            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <AgentManagement onAgentChange={(count) => setAgentCount(count)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <ListUpload
                  onUploadSuccess={() => {
                    // Refresh contact count after successful upload
                    const fetchContactCount = async () => {
                      try {
                        const token = localStorage.getItem("token")
                        const response = await fetch(`${API_URL}/lists/distribution`, {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        })

                        if (response.ok) {
                          const distribution = await response.json()
                          let totalContacts = 0
                          distribution.forEach((agent) => {
                            totalContacts += agent.contacts.length
                          })
                          setContactCount(totalContacts)
                        }
                      } catch (error) {
                        console.error("Error fetching contact count:", error)
                      }
                    }
                    fetchContactCount()
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution">
            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <ListDistribution />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
