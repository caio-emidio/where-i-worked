"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkTracker } from "@/components/work-tracker"
import { WorkStats } from "@/components/work-stats"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="track" className="w-full md:container">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="track">Track</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        <TabsContent value="track" className="mt-6">
          <WorkTracker />
        </TabsContent>
        <TabsContent value="stats" className="mt-6">
          <WorkStats />
        </TabsContent>
      </Tabs>
    </div>
  )
}
