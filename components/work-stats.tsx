"use client"

import { useState, useEffect, use } from "react"
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subMonths,
  addDays,
  isWeekend,
  startOfDay,
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
import { calculateStats, WorkEntry } from "@/lib/calculateStats"

export type DateRange = {
  start: Date
  end: Date
}

type PeriodType = "week" | "month" | "quarter" | "custom"

export function WorkStats() {
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [periodType, setPeriodType] = useState<PeriodType>("quarter")
  const [customRange, setCustomRange] = useState<DateRange | null>(null)
  const [customStartDate, setCustomStartDate] = useState<Date | null>()
  const [customEndDate, setCustomEndDate] = useState<Date | null>()
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
          title: "Error: Loading records",
          description: "Could not load your work records.",
          variant: "destructive",
          duration: 3000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntries()
  }, [user, supabase, toast, customStartDate, customEndDate])

  function getCustomQuarterRange(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed: Jan = 0, Feb = 1, ...

    let start, end;

    if (month >= 1 && month <= 3) {
      // Feb - Apr
      start = new Date(year, 1, 1); // Feb 1
      end = new Date(year, 3, 30);  // Apr 30
    } else if (month >= 4 && month <= 6) {
      // May - Jul
      start = new Date(year, 4, 1); // May 1
      end = new Date(year, 6, 31);  // Jul 31
    } else if (month >= 7 && month <= 9) {
      // Aug - Oct
      start = new Date(year, 7, 1); // Aug 1
      end = new Date(year, 9, 31);  // Oct 31
    } else {
      // Nov - Jan (special: Jan is next year)
      if (month === 0) {
        start = new Date(year - 1, 10, 1); // Nov 1 last year
        end = new Date(year, 0, 31);       // Jan 31 this year
      } else {
        start = new Date(year, 10, 1);     // Nov 1 this year
        end = new Date(year + 1, 0, 31);   // Jan 31 next year
      }
    }

    return { start, end };
  }


  // Set custom range when both dates are selected
  useEffect(() => {
    if (customStartDate && customEndDate) {
      // Ensure the start date is before the end date
      if (customStartDate > customEndDate) {
        toast({
          title: "Invalid date range",
          description: "Start date must be before end date.",
          variant: "destructive",
          duration: 3000,
        })
        return;
      }
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
        const { start, end } = getCustomQuarterRange(today);
        return {
          start: start,
          end: end,
        }
      case "custom":
        return (
          customRange || {
            start: today,
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

  // Validate date range, for every weekdays in the range, we must have a workentry
  // If not, we should show a warning
  useEffect(() => {
    if (!dateRange?.start || !dateRange?.end || !workEntries || workEntries.length === 0) return;

    if (periodType === "custom" && (!customStartDate || !customEndDate)) {
      return;
    }


    const entriesInRange = workEntries.filter((entry) =>
      isWithinInterval(entry.date, {
        start: dateRange.start,
        end: addDays(dateRange.end, 1),// add 1 day to include the end date
      }),
    )

    const weekdays: Date[] = [];
    const currentDate = new Date(dateRange.start);

    while (currentDate <= dateRange.end) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        weekdays.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const missingEntries = weekdays.filter(
      (date) => !entriesInRange.some((entry) => entry.date.toDateString() === date.toDateString())
    );

    if (missingEntries.length > 0) {
      toast({
        title: "Warning: Missing Work Entries",
        description: `You have ${missingEntries.length} missing work entries in the selected period ${dateRange.start.toDateString()} - ${dateRange.end.toDateString()}. Stats maybe incorrect.`,
        variant: "warning",
        duration: 3000,
      });
    }
  }, [periodType, workEntries]);

  // Get the current date range based on the selected period
  const dateRange = getCurrentDateRange()
  // console.log("dateRange", dateRange)

  const stats = calculateStats(workEntries, dateRange)

  // Prepare data for pie chart - excluding time_off
  const chartData = [
    { name: "Office", value: stats.officeCount, percent: stats.officePercentage, color: "hsl(var(--primary))" },
    { name: "Home", value: stats.homeCount, percent: stats.homePercentage, color: theme === "dark" ? "#eab308" : "#eab308" },
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
              <Select value={periodType} onValueChange={(periodType) => setPeriodType(periodType as PeriodType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
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
                          selected={customStartDate || new Date()}
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
                          selected={customEndDate || new Date()}
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
              {!(periodType === "custom" && (!customStartDate || !customEndDate)) && (
                <div className="text-center mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {format(customStartDate ? customStartDate : dateRange.start, "MM/dd/yyyy", { locale: enIE })} -{" "}
                    {format(customEndDate ? customEndDate : dateRange.end, "MM/dd/yyyy", { locale: enIE })}
                  </h3>
                </div>
              )
              }

              {stats.totalWorkDaysExcludingTimeOff > 0 ? (
                <>
                  <div className="flex justify-center items-center mb-6">
                    {stats.totalWorkDaysExcludingTimeOff > 0 &&
                      !(periodType === "custom" && (!customStartDate || !customEndDate)) ? (
                      <div className="w-56 h-56 flex items-center justify-center">
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
                              label={({ percent }) => `${percent}%`}
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
                        <Card className="overflow-hidden">
                          {periodType === "custom" && (!customStartDate || !customEndDate) ? (
                            <p className="text-muted-foreground">Please select both start and end dates to view data.</p>
                          ) : (
                            <>
                              <p className="text-muted-foreground">No work days recorded in this period.</p>
                              <p className="text-sm mt-2">Only time off days were recorded.</p>
                            </>
                          )}
                        </Card>
                      </div>
                    )}

                  </div>
                  <Separator className="mb-4" />
                  {!(periodType === "custom" && (!customStartDate || !customEndDate)) && (
                    <div>
                      <div className="grid grid-cols-3 gap-4">
                        <Card className="overflow-hidden" onClick={() => { }}>
                          <div className="h-2 bg-primary" />
                          <CardContent className="p-4 pt-6 text-center">
                            <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                            <div className="text-2xl font-bold">{stats.officePercentage}%</div>
                            <div className="text-sm text-muted-foreground">Office</div>
                            <div className="text-xs text-muted-foreground mt-1">{stats.officeCount} days</div>
                            {stats.weekEndEntriesCount > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                <strong>Note: Weekend office days are also included in the total.</strong>
                              </div>
                            )}
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
                    </div>
                  )}
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
