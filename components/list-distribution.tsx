"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Loader2, RefreshCw, UserCircle, Phone, StickyNote } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

// API base URL
const API_URL = "http://localhost:5001/api"

interface Agent {
  _id: string
  name: string
  email: string
}

interface Contact {
  _id: string
  firstName: string
  phone: string
  notes: string
}

interface AgentWithContacts extends Agent {
  contacts: Contact[]
}

export default function ListDistribution() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [distribution, setDistribution] = useState<AgentWithContacts[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRedistributing, setIsRedistributing] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/agents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAgents(data)
        if (data.length > 0) {
          setSelectedAgent(data[0]._id)
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch agents",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching agents:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching agents",
        variant: "destructive",
      })
    }
  }

  const fetchDistribution = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/lists/distribution`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDistribution(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch distribution data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching distribution:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching distribution data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
    fetchDistribution()
  }, [])

  const handleRedistribute = async () => {
    setIsRedistributing(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/lists/redistribute`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Lists redistributed successfully",
        })
        fetchDistribution()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.message || "Failed to redistribute lists",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error redistributing lists:", error)
      toast({
        title: "Error",
        description: "An error occurred while redistributing lists",
        variant: "destructive",
      })
    } finally {
      setIsRedistributing(false)
    }
  }

  const getAgentContacts = (agentId: string) => {
    const agentData = distribution.find((a) => a._id === agentId)
    return agentData?.contacts || []
  }

  const getTotalContacts = () => {
    let total = 0
    distribution.forEach((agent) => {
      total += agent.contacts.length
    })
    return total
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Contact Distribution</h2>
          <Skeleton className="h-10 w-32" />
        </div>

        <Skeleton className="h-12 w-full rounded-md" />

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Contact Distribution</h2>
          <p className="text-slate-500 text-sm mt-1">
            {getTotalContacts()} contacts distributed among {agents.length} agents
          </p>
        </div>

        <Button
          onClick={handleRedistribute}
          disabled={isRedistributing || agents.length === 0}
          className="bg-slate-800 hover:bg-slate-700"
        >
          {isRedistributing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redistributing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Redistribute Lists
            </>
          )}
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card className="border border-dashed bg-slate-50">
          <CardContent className="p-10 text-center">
            <div className="mx-auto bg-slate-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
              <UserCircle className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">No agents found</h3>
            <p className="text-slate-500 mb-6">Add agents before distributing lists.</p>
          </CardContent>
        </Card>
      ) : distribution.length === 0 || getTotalContacts() === 0 ? (
        <Card className="border border-dashed bg-slate-50">
          <CardContent className="p-10 text-center">
            <div className="mx-auto bg-slate-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
              <Phone className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">No contacts available</h3>
            <p className="text-slate-500 mb-6">Upload a list to distribute contacts among agents.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-md border overflow-hidden shadow-sm">
          <Tabs defaultValue={selectedAgent || undefined} onValueChange={setSelectedAgent}>
            <TabsList className="flex w-full overflow-x-auto bg-slate-50 p-0 h-auto">
              {agents.map((agent) => {
                const contactCount = getAgentContacts(agent._id).length
                return (
                  <TabsTrigger
                    key={agent._id}
                    value={agent._id}
                    className="flex-1 py-3 px-4 data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-slate-800"
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{agent.name}</span>
                      <Badge variant="outline" className="mt-1 bg-slate-100">
                        {contactCount} contacts
                      </Badge>
                    </div>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {agents.map((agent) => {
              const contacts = getAgentContacts(agent._id)
              return (
                <TabsContent key={agent._id} value={agent._id} className="p-0 mt-0">
                  <div className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="bg-slate-100 rounded-full p-2 mr-3">
                        <UserCircle className="h-6 w-6 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800">{agent.name}</h3>
                        <p className="text-sm text-slate-500">{agent.email}</p>
                      </div>
                    </div>

                    {contacts.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-md border border-dashed">
                        <StickyNote className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600">No contacts assigned to this agent</p>
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead className="font-medium">First Name</TableHead>
                              <TableHead className="font-medium">Phone</TableHead>
                              <TableHead className="font-medium">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contacts.map((contact) => (
                              <TableRow key={contact._id} className="hover:bg-slate-50">
                                <TableCell className="font-medium">{contact.firstName}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-normal">
                                    {contact.phone}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {contact.notes || <span className="text-slate-400 italic">No notes</span>}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        </div>
      )}
    </div>
  )
}
