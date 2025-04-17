"use client"

import { useState, useEffect } from "react"
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  isWithinInterval,
  subMonths,
} from "date-fns"
import { enIE } from "date-fns/locale"
import { Building2, Home, CalendarIcon, CalendarPlus2Icon as CalendarIcon2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Separator } from "@/components/ui/separator"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"

interface WorkEntry {
  id: string
  date: Date
  location: "office" | "home" | "time_off"
  user_id: string
}

type DateRange = {
  start: Date
  end: Date
}

export function WorkStats() {
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [periodType, setPeriodType] = useState("week")
  const [customRange, setCustomRange] = useState<DateRange | null>(null)
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>()
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()
  const { theme } = useTheme()

  // Load entries from Supabase on component mount
  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return

      setIsLoading(true)

      try {
        const { data, error } = await supabase
          .from("work_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })

        if (error) {
          throw error
        }

        if (data) {
          setWorkEntries(
            data.map((entry) => ({
              ...entry,
              date: new Date(entry.date),
            })),
          )
        }
      } catch (error) {
        console.error("Error fetching work entries:", error)
        toast({
          title: "Error loading records",
          description: "Could not load your work records.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntries()
  }, [user, supabase, toast])

  // Set custom range when both dates are selected
  useEffect(() => {
    if (customStartDate && customEndDate) {
      setCustomRange({
        start: customStartDate,
        end: customEndDate,
      })
    }
  }, [customStartDate, customEndDate])

  // Get current date range based on selected period
  const getCurrentDateRange = (): DateRange => {
    const today = new Date()

    switch (periodType) {
      case "week":
        return {
          start: startOfWeek(today, { locale: enIE }),
          end: endOfWeek(today, { locale: enIE }),
        }
      case "month":
        return {
          start: startOfMonth(today),
          end: endOfMonth(today),
        }
      case "quarter":
        return {
          start: startOfQuarter(today),
          end: endOfQuarter(today),
        }
      case "custom":
        return (
          customRange || {
            start: startOfMonth(subMonths(today, 1)),
            end: today,
          }
        )
      default:
        return {
          start: startOfWeek(today, { locale: enIE }),
          end: endOfWeek(today, { locale: enIE }),
        }
    }
  }

  const dateRange = getCurrentDateRange()

  // Calculate statistics - excluding time_off entries
  const calculateStats = () => {
    // Get all entries in the date range
    const entriesInRange = workEntries.filter((entry) =>
      isWithinInterval(entry.date, {
        start: dateRange.start,
        end: dateRange.end,
      }),
    )

    // Filter out time_off entries for statistics
    const workEntriesOnly = entriesInRange.filter((entry) => entry.location !== "time_off")

    const officeCount = workEntriesOnly.filter((entry) => entry.location === "office").length
    const homeCount = workEntriesOnly.filter((entry) => entry.location === "home").length
    const totalWorkDays = workEntriesOnly.length

    // Count time_off days separately (not included in percentages)
    const timeOffCount = entriesInRange.filter((entry) => entry.location === "time_off").length
    const totalDays = entriesInRange.length

    const officePercentage = totalWorkDays > 0 ? Math.round((officeCount / totalWorkDays) * 100) : 0
    const homePercentage = totalWorkDays > 0 ? Math.round((homeCount / totalWorkDays) * 100) : 0

    return {
      officeCount,
      homeCount,
      timeOffCount,
      totalWorkDays,
      totalDays,
      officePercentage,
      homePercentage,
    }
  }

  const stats = calculateStats()

  // Prepare data for pie chart - excluding time_off
  const chartData = [
    { name: "Office", value: stats.officeCount, color: "hsl(var(--primary))" },
    { name: "Home", value: stats.homeCount, color: theme === "dark" ? "#eab308" : "#eab308" },
  ].filter((item) => item.value > 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
          <CardDescription>See where you worked during a specific period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Period</label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodType === "custom" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium block">Start date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customStartDate ? format(customStartDate, "MM/dd/yyyy") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={customStartDate}
                          onSelect={setCustomStartDate}
                          initialFocus
                          locale={enIE}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium block">End date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customEndDate ? format(customEndDate, "MM/dd/yyyy") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={customEndDate}
                          onSelect={setCustomEndDate}
                          initialFocus
                          locale={enIE}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <p className="text-muted-foreground">Loading statistics...</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-center mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {format(dateRange.start, "MM/dd/yyyy", { locale: enIE })} -{" "}
                  {format(dateRange.end, "MM/dd/yyyy", { locale: enIE })}
                </h3>
              </div>

              {stats.totalDays > 0 ? (
                <>
                  <div className="flex justify-center mb-6">
                    {stats.totalWorkDays > 0 ? (
                      <div className="h-56 w-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={70}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No work days recorded in this period.</p>
                        <p className="text-sm mt-2">Only time off days were recorded.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Card className="overflow-hidden">
                      <div className="h-2 bg-primary" />
                      <CardContent className="p-4 pt-6 text-center">
                        <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{stats.officePercentage}%</div>
                        <div className="text-sm text-muted-foreground">Office</div>
                        <div className="text-xs text-muted-foreground mt-1">{stats.officeCount} days</div>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                      <div className="h-2 bg-yellow-500" />
                      <CardContent className="p-4 pt-6 text-center">
                        <Home className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                        <div className="text-2xl font-bold">{stats.homePercentage}%</div>
                        <div className="text-sm text-muted-foreground">Home</div>
                        <div className="text-xs text-muted-foreground mt-1">{stats.homeCount} days</div>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                      <div className="h-2 bg-blue-500" />
                      <CardContent className="p-4 pt-6 text-center">
                        <CalendarIcon2 className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-bold">{stats.timeOffCount}</div>
                        <div className="text-sm text-muted-foreground">Time Off</div>
                        <div className="text-xs text-muted-foreground mt-1">Not in stats</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    <p>* Time off days (PTO/Sick/Holiday) are not included in work percentage calculations</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No records found for this period.</p>
                  <p className="text-sm mt-2">Record where you worked in the "Track" tab.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
