"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkTracker } from "@/components/workTracker/workTracker"
import { WorkStats } from "@/components/work-stats"
import { PlanningTracker } from "@/components/planning/PlanningTracker"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="track" className="w-full md:container">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="track">Track</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        <TabsContent value="track" className="mt-6">
          <WorkTracker />
        </TabsContent>
        <TabsContent value="planning" className="mt-6">
          <PlanningTracker />
        </TabsContent>
        <TabsContent value="stats" className="mt-6">
          <WorkStats />
        </TabsContent>
      </Tabs>
    </div>
  )
}
