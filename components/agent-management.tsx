"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Loader2, UserPlus, Trash2, Search, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchWithAuth } from "@/lib/api-config"

interface Agent {
  _id: string
  name: string
  email: string
  mobile: string
}

interface AgentManagementProps {
  onAgentChange?: (count: number) => void
}

export default function AgentManagement({ onAgentChange }: AgentManagementProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [newAgent, setNewAgent] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
  })

  const fetchAgents = async () => {
    try {
      const response = await fetchWithAuth("/agents")

      if (response.ok) {
        const data = await response.json()
        setAgents(data)
        setFilteredAgents(data)
        if (onAgentChange) onAgentChange(data.length)
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
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAgents(agents)
    } else {
      const filtered = agents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.mobile.includes(searchQuery),
      )
      setFilteredAgents(filtered)
    }
  }, [searchQuery, agents])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewAgent((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetchWithAuth("/agents", {
        method: "POST",
        body: JSON.stringify(newAgent),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Agent created successfully",
        })
        setNewAgent({
          name: "",
          email: "",
          mobile: "",
          password: "",
        })
        setIsDialogOpen(false)
        fetchAgents()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.message || "Failed to create agent",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating agent:", error)
      toast({
        title: "Error",
        description: "An error occurred while creating the agent",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAgent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) {
      return
    }

    try {
      const response = await fetchWithAuth(`/agents/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Agent deleted successfully",
        })
        fetchAgents()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete agent",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting agent:", error)
      toast({
        title: "Error",
        description: "An error occurred while deleting the agent",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Agent Management</h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-800 hover:bg-slate-700 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Agent</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newAgent.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newAgent.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number (with country code)</Label>
                  <Input
                    id="mobile"
                    name="mobile"
                    value={newAgent.mobile}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={newAgent.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-800 hover:bg-slate-700">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Agent"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <Card className="border border-dashed bg-slate-50">
          <CardContent className="p-10 text-center">
            <div className="mx-auto bg-slate-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">No agents found</h3>
            <p className="text-slate-500 mb-6">
              {searchQuery ? "No agents match your search criteria." : "Add your first agent to get started."}
            </p>
            {searchQuery ? (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            ) : (
              <Button onClick={() => setIsDialogOpen(true)} className="bg-slate-800 hover:bg-slate-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Your First Agent
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Mobile</TableHead>
                <TableHead className="text-right font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent._id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {agent.mobile}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAgent(agent._id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-sm text-slate-500 pt-2">
        {filteredAgents.length > 0 && (
          <p>
            Showing {filteredAgents.length} of {agents.length} agents
          </p>
        )}
      </div>
    </div>
  )
}
