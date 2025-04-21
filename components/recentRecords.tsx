// components/RecentRecords.tsx
"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Home, Calendar as CalendarIcon2 } from "lucide-react"
import { format } from "date-fns"
import { enIE } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { WorkEntry } from "@/types/work-entry"

type Props = {
  recentEntries: WorkEntry[]
}

export function RecentRecords({ recentEntries }: Props) {
  return (
    <Card className="md:w-2/3">
      <CardHeader>
        <CardTitle>Recent Records</CardTitle>
        <CardDescription>Your last {recentEntries.length} days of work</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentEntries.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-md"
            >
              <span className="font-medium">
                {format(new Date(entry.date), "EEEE, MM/dd", { locale: enIE })}
              </span>
              {entry.location ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "flex items-center gap-1",
                    entry.location === "office"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : entry.location === "home"
                      ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                      : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                  )}
                >
                  {entry.location === "office" ? (
                    <>
                      <Building2 className="h-3 w-3" />
                      <span>Office</span>
                    </>
                  ) : entry.location === "home" ? (
                    <>
                      <Home className="h-3 w-3" />
                      <span>Home</span>
                    </>
                  ) : (
                    <>
                      <CalendarIcon2 className="h-3 w-3" />
                      <span>Time Off</span>
                    </>
                  )}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">Not recorded</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}