import { Card, CardContent } from "@/components/ui/card"
import { Users, PhoneCall } from "lucide-react"

interface DashboardSummaryProps {
  agentCount: number
  contactCount: number
}

export default function DashboardSummary({ agentCount, contactCount }: DashboardSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-none shadow-md bg-gradient-to-br from-slate-800 to-slate-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 mb-1">Total Agents</p>
              <h2 className="text-4xl font-bold">{agentCount}</h2>
              <p className="text-slate-300 mt-2 text-sm">Active team members</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-full">
              <Users className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-gradient-to-br from-emerald-600 to-emerald-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 mb-1">Total Contacts</p>
              <h2 className="text-4xl font-bold">{contactCount}</h2>
              <p className="text-emerald-100 mt-2 text-sm">Distributed leads</p>
            </div>
            <div className="bg-emerald-500/50 p-4 rounded-full">
              <PhoneCall className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
